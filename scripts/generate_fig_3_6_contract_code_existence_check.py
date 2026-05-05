# -*- coding: utf-8 -*-
from __future__ import annotations

import math
import re
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "image" / "fig-3-6-contract-code-existence-check.png"

W, H = 1920, 1080
S = 2

WHITE = "#FFFFFF"
INK = "#172033"
MUTED = "#5B6472"
BORDER = "#334155"
FILL = "#F8FAFC"
STEP_FILL = "#EFF6FF"
STEP_BORDER = "#2563EB"
DECISION_FILL = "#FFF7ED"
DECISION_BORDER = "#EA580C"
GREEN = "#16A34A"
GREEN_FILL = "#ECFDF5"
GREEN_BORDER = "#15803D"
RED = "#DC2626"
RED_FILL = "#FEF2F2"
RED_BORDER = "#B91C1C"
YELLOW = "#D97706"
NOTE_FILL = "#F8FAFC"
NOTE_BORDER = "#94A3B8"


def find_font(candidates: list[str]) -> str | None:
    for candidate in candidates:
        path = Path(candidate)
        if path.exists():
            return str(path)
    return None


UI_FONT = find_font(
    [
        r"C:\Windows\Fonts\msyh.ttc",
        r"C:\Windows\Fonts\simhei.ttf",
        r"C:\Windows\Fonts\Deng.ttf",
    ]
)
UI_BOLD = find_font(
    [
        r"C:\Windows\Fonts\msyhbd.ttc",
        r"C:\Windows\Fonts\simhei.ttf",
        r"C:\Windows\Fonts\Dengb.ttf",
    ]
)
MONO_FONT = find_font(
    [
        r"C:\Windows\Fonts\consola.ttf",
        r"C:\Windows\Fonts\cour.ttf",
    ]
)


def font(size: int, bold: bool = False, mono: bool = False) -> ImageFont.FreeTypeFont:
    path = MONO_FONT if mono else (UI_BOLD if bold else UI_FONT)
    if path:
        return ImageFont.truetype(path, size * S)
    return ImageFont.load_default(size * S)


def sc(value):
    if isinstance(value, (tuple, list)):
        return tuple(int(round(v * S)) for v in value)
    return int(round(value * S))


def text_size(draw: ImageDraw.ImageDraw, value: str, fnt: ImageFont.FreeTypeFont) -> tuple[int, int]:
    box = draw.textbbox((0, 0), value, font=fnt)
    return box[2] - box[0], box[3] - box[1]


def tokenized(value: str) -> list[str]:
    return re.findall(r"[A-Za-z0-9_./()]+|\s+|.", value)


def wrap_text(draw: ImageDraw.ImageDraw, value: str, size: int, max_width: int, bold=False, mono=False) -> list[str]:
    fnt = font(size, bold=bold, mono=mono)
    if text_size(draw, value, fnt)[0] <= sc(max_width):
        return [value]

    lines: list[str] = []
    current = ""
    for token in tokenized(value):
        trial = current + token
        if current and text_size(draw, trial, fnt)[0] > sc(max_width):
            lines.append(current.strip())
            current = token.strip()
        else:
            current = trial
    if current:
        lines.append(current.strip())
    return lines


def centered_lines(
    draw: ImageDraw.ImageDraw,
    box,
    lines: list[str],
    sizes: list[int],
    colors: list[str] | None = None,
    bolds: list[bool] | None = None,
    monos: list[bool] | None = None,
    line_gap: int = 10,
    pad_x: int = 30,
    wrap: bool = True,
):
    x1, y1, x2, y2 = [sc(v) for v in box]
    max_w = x2 - x1 - sc(pad_x * 2)
    prepared = []
    for index, value in enumerate(lines):
        size = sizes[index]
        bold = bolds[index] if bolds else False
        mono = monos[index] if monos else False
        color = colors[index] if colors else INK
        parts = wrap_text(draw, value, size, max_w / S, bold=bold, mono=mono) if wrap else [value]
        for part in parts:
            prepared.append((part, font(size, bold=bold, mono=mono), color))

    heights = [text_size(draw, item, fnt)[1] for item, fnt, _ in prepared]
    total_h = sum(heights) + sc(line_gap) * max(0, len(prepared) - 1)
    y = y1 + ((y2 - y1) - total_h) // 2 - sc(2)
    cx = x1 + (x2 - x1) // 2
    for (item, fnt, color), h in zip(prepared, heights):
        tw, _ = text_size(draw, item, fnt)
        draw.text((cx - tw // 2, y), item, font=fnt, fill=color)
        y += h + sc(line_gap)


def rounded(draw: ImageDraw.ImageDraw, box, radius: int, fill, outline=None, width: int = 1):
    draw.rounded_rectangle(sc(box), radius=sc(radius), fill=fill, outline=outline, width=sc(width))


def arrow(draw: ImageDraw.ImageDraw, points, color: str, width: int = 5, head: int = 20):
    scaled = [sc(p) for p in points]
    draw.line(scaled, fill=color, width=sc(width), joint="curve")
    p1 = scaled[-2]
    p2 = scaled[-1]
    angle = math.atan2(p2[1] - p1[1], p2[0] - p1[0])
    h = sc(head)
    wing = math.radians(28)
    p3 = (p2[0] - h * math.cos(angle - wing), p2[1] - h * math.sin(angle - wing))
    p4 = (p2[0] - h * math.cos(angle + wing), p2[1] - h * math.sin(angle + wing))
    draw.polygon([p2, p3, p4], fill=color)


def node(draw, box, lines, sizes, fill, outline, bolds=None, monos=None, line_gap=10, pad_x=30):
    rounded(draw, box, 16, fill=fill, outline=outline, width=4)
    centered_lines(draw, box, lines, sizes, bolds=bolds, monos=monos, line_gap=line_gap, pad_x=pad_x, wrap=False)


def diamond(draw, cx: int, cy: int, w: int, h: int, fill: str, outline: str):
    points = [(cx, cy - h / 2), (cx + w / 2, cy), (cx, cy + h / 2), (cx - w / 2, cy)]
    draw.polygon([sc(p) for p in points], fill=fill)
    draw.line([sc(p) for p in points + [points[0]]], fill=outline, width=sc(4), joint="curve")


def branch_label(draw, center, value: str, color: str, fill: str):
    fnt = font(21, bold=True)
    tw, th = text_size(draw, value, fnt)
    cx, cy = sc(center)
    pad_x = sc(16)
    pad_y = sc(8)
    box = (cx - tw // 2 - pad_x, cy - th // 2 - pad_y, cx + tw // 2 + pad_x, cy + th // 2 + pad_y)
    draw.rounded_rectangle(box, radius=sc(9), fill=fill, outline=color, width=sc(2))
    draw.text((cx, cy + sc(1)), value, font=fnt, fill=color, anchor="mm")


def draw_note(draw, box):
    rounded(draw, box, 14, fill=NOTE_FILL, outline=NOTE_BORDER, width=3)
    x1, y1, x2, _ = box
    rounded(draw, (x1 + 32, y1 + 28, x1 + 44, y1 + 120), 6, fill=YELLOW, outline=None)
    draw.text(sc((x1 + 70, y1 + 30)), "机制说明", font=font(30, bold=True), fill=INK)
    note = (
        "用于避免 Hardhat 本地链重启后，历史 contract_address 指向空地址却被误判为可用合约。"
        "先通过 provider.getCode(address) 校验链上字节码，再决定是否继续执行日志写入或查询。"
    )
    fnt = font(23)
    x = x1 + 70
    y = y1 + 80
    current = ""
    for token in tokenized(note):
        trial = current + token
        if current and text_size(draw, trial, fnt)[0] > sc(x2 - x - 50):
            draw.text(sc((x, y)), current.strip(), font=fnt, fill=MUTED)
            y += 33
            current = token.strip()
        else:
            current = trial
    if current:
        draw.text(sc((x, y)), current.strip(), font=fnt, fill=MUTED)


def main():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    img = Image.new("RGB", (W * S, H * S), WHITE)
    draw = ImageDraw.Draw(img)

    read_box = (80, 420, 390, 560)
    call_box = (470, 420, 870, 560)
    diamond_center = (1080, 490)
    green_box = (1500, 150, 1860, 340)
    red_box = (1500, 620, 1860, 810)
    note_box = (90, 828, 1830, 1000)

    node(draw, read_box, ["读取", "contract_address"], [34, 30], FILL, BORDER, bolds=[True, False], monos=[False, True], line_gap=12)
    node(
        draw,
        call_box,
        ["调用", "provider.getCode(address)"],
        [34, 24],
        STEP_FILL,
        STEP_BORDER,
        bolds=[True, False],
        monos=[False, True],
        line_gap=12,
        pad_x=24,
    )
    diamond(draw, diamond_center[0], diamond_center[1], 300, 230, DECISION_FILL, DECISION_BORDER)
    centered_lines(
        draw,
        (970, 410, 1190, 570),
        ["返回字节码", "是否为空？"],
        [32, 32],
        bolds=[True, True],
        line_gap=12,
        pad_x=8,
        wrap=False,
    )
    node(
        draw,
        green_box,
        ["存在合约代码", "可继续调用", "storeLog", "getLog / getLogsByTaskId"],
        [31, 28, 25, 23],
        GREEN_FILL,
        GREEN_BORDER,
        bolds=[True, False, False, False],
        monos=[False, False, True, True],
        line_gap=9,
        pad_x=24,
    )
    node(
        draw,
        red_box,
        ["不存在合约代码", "停止链上读写", "审计结果标记为 pending", "或记录异常说明"],
        [31, 29, 29, 29],
        RED_FILL,
        RED_BORDER,
        bolds=[True, False, False, False],
        line_gap=10,
        pad_x=24,
    )

    arrow(draw, [(390, 490), (458, 490)], STEP_BORDER, width=5)
    arrow(draw, [(870, 490), (928, 490)], STEP_BORDER, width=5)

    green_line = [(1160, 435), (1440, 435), (1440, 245), (1488, 245)]
    red_line = [(1160, 545), (1440, 545), (1440, 715), (1488, 715)]
    arrow(draw, green_line, GREEN, width=6)
    arrow(draw, red_line, RED, width=6)
    branch_label(draw, (1300, 435), "否：非空字节码", GREEN, "#F0FDF4")
    branch_label(draw, (1300, 545), "是：0x 或空字节码", RED, "#FFF7ED")

    draw_note(draw, note_box)

    img = img.resize((W, H), Image.Resampling.LANCZOS)
    img.save(OUT, "PNG", optimize=True)
    print(OUT)
    print(img.size)


if __name__ == "__main__":
    main()
