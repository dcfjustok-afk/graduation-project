from __future__ import annotations

import argparse
import json
import re
import threading
import time
from http.server import BaseHTTPRequestHandler
from http.server import ThreadingHTTPServer
from typing import Any

from deep_translator import GoogleTranslator


MODEL_NAME = "local-google-zh"
TARGET_LANG = "zh-CN"

_translator = GoogleTranslator(source="auto", target=TARGET_LANG)
_translate_lock = threading.Lock()
_cache: dict[str, str] = {}


def _extract_balanced_json_array(text: str) -> list[dict[str, Any]] | None:
    marker = "## Here is the input:"
    start_at = text.find(marker)
    if start_at == -1:
        start_at = 0
    start = text.find("[", start_at)
    if start == -1:
        return None

    depth = 0
    in_string = False
    escape = False
    for index in range(start, len(text)):
        char = text[index]
        if in_string:
            if escape:
                escape = False
            elif char == "\\":
                escape = True
            elif char == '"':
                in_string = False
            continue

        if char == '"':
            in_string = True
        elif char == "[":
            depth += 1
        elif char == "]":
            depth -= 1
            if depth == 0:
                raw = text[start : index + 1]
                try:
                    parsed = json.loads(raw)
                except json.JSONDecodeError:
                    return None
                if isinstance(parsed, list):
                    return parsed
                return None
    return None


def _extract_single_text(text: str) -> str:
    markers = [
        "Now translate the following text:",
        "Input:",
    ]
    for marker in markers:
        pos = text.rfind(marker)
        if pos != -1:
            return text[pos + len(marker) :].strip()
    return text.strip()


def _protect_tokens(text: str) -> tuple[str, dict[str, str]]:
    protected: dict[str, str] = {}

    patterns = [
        r"<[^>]+>",
        r"\{v\d+\}",
        r"\{\s*v\s*\d+\s*\}",
        r"\{[A-Za-z_][A-Za-z0-9_]*\}",
        r"\[\[[^\]]+\]\]",
        r"%%[^%]+%%",
        r"%[sdif]",
        r"https?://\S+",
        r"\b[\w.+-]+@[\w.-]+\.\w+\b",
    ]
    combined = re.compile("|".join(f"({pattern})" for pattern in patterns))

    def replace(match: re.Match[str]) -> str:
        key = f"ZXQ{len(protected)}QXZ"
        protected[key] = match.group(0)
        return key

    return combined.sub(replace, text), protected


def _restore_tokens(text: str, protected: dict[str, str]) -> str:
    restored = text
    for key, value in protected.items():
        restored = restored.replace(key, value)
        restored = restored.replace(key.lower(), value)
        restored = restored.replace(f"{key[:3]} {key[3:]}", value)
    return restored


def translate_text(text: str) -> str:
    text = text.strip()
    if not text:
        return text
    if text in _cache:
        return _cache[text]
    if not re.search(r"[A-Za-z]", text):
        _cache[text] = text
        return text

    protected_text, protected = _protect_tokens(text)
    try:
        with _translate_lock:
            translated = _translator.translate(protected_text)
            time.sleep(0.08)
    except Exception:
        translated = text
    else:
        translated = _restore_tokens(translated, protected)

    _cache[text] = translated
    return translated


def translate_prompt(prompt: str) -> str:
    batch = _extract_balanced_json_array(prompt)
    if batch is not None:
        result: list[dict[str, Any]] = []
        for item in batch:
            if not isinstance(item, dict):
                continue
            result.append(
                {
                    "id": item.get("id"),
                    "output": translate_text(str(item.get("input", ""))),
                }
            )
        return json.dumps(result, ensure_ascii=False)

    return translate_text(_extract_single_text(prompt))


def completion_response(content: str) -> dict[str, Any]:
    return {
        "id": "chatcmpl-local-babeldoc",
        "object": "chat.completion",
        "created": int(time.time()),
        "model": MODEL_NAME,
        "choices": [
            {
                "index": 0,
                "message": {"role": "assistant", "content": content},
                "finish_reason": "stop",
            }
        ],
        "usage": {
            "prompt_tokens": 0,
            "completion_tokens": 0,
            "total_tokens": 0,
        },
    }


class Handler(BaseHTTPRequestHandler):
    server_version = "BabelDocLocalTranslateProxy/1.0"

    def log_message(self, format: str, *args: Any) -> None:
        return

    def _send_json(self, status: int, payload: dict[str, Any]) -> None:
        raw = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def do_GET(self) -> None:
        if self.path.rstrip("/") == "/v1/models":
            self._send_json(
                200,
                {
                    "object": "list",
                    "data": [
                        {
                            "id": MODEL_NAME,
                            "object": "model",
                            "created": int(time.time()),
                            "owned_by": "local",
                        }
                    ],
                },
            )
            return
        self._send_json(404, {"error": {"message": "not found"}})

    def do_POST(self) -> None:
        if self.path.rstrip("/") != "/v1/chat/completions":
            self._send_json(404, {"error": {"message": "not found"}})
            return

        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length)
        try:
            body = json.loads(raw.decode("utf-8"))
            messages = body.get("messages", [])
            prompt = "\n\n".join(
                str(message.get("content", ""))
                for message in messages
                if isinstance(message, dict)
            )
            content = translate_prompt(prompt)
        except Exception as exc:
            self._send_json(500, {"error": {"message": str(exc)}})
            return

        self._send_json(200, completion_response(content))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8765)
    args = parser.parse_args()

    server = ThreadingHTTPServer((args.host, args.port), Handler)
    print(f"listening on http://{args.host}:{args.port}/v1", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
