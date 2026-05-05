# -*- coding: utf-8 -*-
from __future__ import annotations

import math
import re
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "image" / "fig-3-5-contract-address-tracing-audit.png"

W, H = 1920, 1080
S = 2

WHITE = "#FFFFFF"
INK = "#172033"
MUTED = "#5B6573"
LIGHT = "#D7DEE8"
GRID = "#EEF2F7"

BLUE = "#2563EB"
BLUE_DARK = "#1E40AF"
BLUE_SOFT = "#EFF6FF"
BLUE_BORDER = "#93C5FD"

GREEN = "#16A34A"
GREEN_DARK = "#166534"
GREEN_SOFT = "#F0FDF4"
GREEN_BORDER = "#86EFAC"

PURPLE = "#7C3AED"
PURPLE_DARK = "#5B21B6"
PURPLE_SOFT = "#F5F3FF"
PURPLE_BORDER = "#C4B5FD"

ORANGE = "#F97316"
ORANGE_DARK = "#C2410C"
ORANGE_SOFT = "#FFF7ED"
ORANGE_BORDER = "#FDBA74"

SLATE_SOFT = "#F8FAFC"


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
        r"C:\Windows\Fonts\segoeui.ttf",
    ]
)
UI_BOLD = find_font(
    [
        r"C:\Windows\Fonts\msyhbd.ttc",
        r"C:\Windows\Fonts\simhei.ttf",
        r"C:\Windows\Fonts\Dengb.ttf",
        r"C:\Windows\Fonts\segoeuib.ttf",
    ]
)
MONO_FONT = find_font(
    [
        r"C:\Windows\Fonts\consola.ttf",
        r"C:\Windows\Fonts\cour.ttf",
        r"C:\Windows\Fonts\msyh.ttc",
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


def rounded(draw: ImageDraw.ImageDraw, box, radius: int, fill, outline=None, width: int = 1):
    draw.rounded_rectangle(sc(box), radius=sc(radius), fill=fill, outline=outline, width=sc(width))


def rect(draw: ImageDraw.ImageDraw, box, fill, outline=None, width: int = 1):
    draw.rectangle(sc(box), fill=fill, outline=outline, width=sc(width))


def line(draw: ImageDraw.ImageDraw, points, fill, width: int = 3, joint: str = "curve"):
    draw.line([sc(p) for p in points], fill=fill, width=sc(width), joint=joint)


def text_size(draw: ImageDraw.ImageDraw, value: str, fnt: ImageFont.FreeTypeFont) -> tuple[int, int]:
    box = draw.textbbox((0, 0), value, font=fnt)
    return box[2] - box[0], box[3] - box[1]


def text(
    draw: ImageDraw.ImageDraw,
    xy,
    value: str,
    size: int,
    fill=INK,
    bold: bool = False,
    mono: bool = False,
    anchor: str = "la",
):
    draw.text(sc(xy), value, font=font(size, bold=bold, mono=mono), fill=fill, anchor=anchor)


def centered(
    draw: ImageDraw.ImageDraw,
    box,
    value: str,
    size: int,
    fill=INK,
    bold: bool = False,
    mono: bool = False,
    spacing: int = 8,
):
    fnt = font(size, bold=bold, mono=mono)
    lines = value.split("\n")
    metrics = [text_size(draw, item, fnt) for item in lines]
    total_h = sum(h for _, h in metrics) + sc(spacing) * (len(lines) - 1)
    y = sc((box[1] + box[3]) / 2) - total_h / 2
    cx = sc((box[0] + box[2]) / 2)
    for index, item in enumerate(lines):
        tw, th = metrics[index]
        draw.text((int(cx - tw / 2), int(y)), item, font=fnt, fill=fill)
        y += th + sc(spacing)


def fit_size(
    draw: ImageDraw.ImageDraw,
    value: str,
    size: int,
    max_width: int,
    bold: bool = False,
    mono: bool = False,
    min_size: int = 12,
) -> int:
    current = size
    while current > min_size:
        if text_size(draw, value, font(current, bold=bold, mono=mono))[0] <= sc(max_width):
            return current
        current -= 1
    return min_size


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


def draw_wrapped(
    draw: ImageDraw.ImageDraw,
    xy,
    value: str,
    size: int,
    max_width: int,
    fill=INK,
    bold=False,
    mono=False,
    line_gap: int = 11,
):
    fnt = font(size, bold=bold, mono=mono)
    x, y = xy
    for raw_line in value.split("\n"):
        for item in wrap_text(draw, raw_line, size, max_width, bold=bold, mono=mono):
            draw.text(sc((x, y)), item, font=fnt, fill=fill)
            y += text_size(draw, item, fnt)[1] / S + line_gap
    return y


def shadow(draw: ImageDraw.ImageDraw, box, radius: int = 16):
    x1, y1, x2, y2 = box
    for offset, alpha in [(4, 16), (8, 9), (12, 5)]:
        overlay = Image.new("RGBA", (W * S, H * S), (0, 0, 0, 0))
        od = ImageDraw.Draw(overlay)
        od.rounded_rectangle(
            sc((x1 + offset, y1 + offset, x2 + offset, y2 + offset)),
            radius=sc(radius),
            fill=(15, 23, 42, alpha),
        )
        img.alpha_composite(overlay)


def arrow(draw: ImageDraw.ImageDraw, points, color: str, width: int = 5, head: int = 18):
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


def dashed_arrow(
    draw: ImageDraw.ImageDraw,
    points,
    color: str,
    width: int = 4,
    dash: int = 16,
    gap: int = 10,
    head: int = 17,
):
    for segment_index in range(len(points) - 1):
        x1, y1 = points[segment_index]
        x2, y2 = points[segment_index + 1]
        length = math.hypot(x2 - x1, y2 - y1)
        if length == 0:
            continue
        ux = (x2 - x1) / length
        uy = (y2 - y1) / length
        limit = length - (head if segment_index == len(points) - 2 else 0)
        cursor = 0
        while cursor < limit:
            start = (x1 + ux * cursor, y1 + uy * cursor)
            end = (x1 + ux * min(cursor + dash, limit), y1 + uy * min(cursor + dash, limit))
            line(draw, [start, end], color, width=width)
            cursor += dash + gap

    p1 = sc(points[-2])
    p2 = sc(points[-1])
    angle = math.atan2(p2[1] - p1[1], p2[0] - p1[0])
    h = sc(head)
    wing = math.radians(28)
    p3 = (p2[0] - h * math.cos(angle - wing), p2[1] - h * math.sin(angle - wing))
    p4 = (p2[0] - h * math.cos(angle + wing), p2[1] - h * math.sin(angle + wing))
    draw.polygon([p2, p3, p4], fill=color)


def label(
    draw: ImageDraw.ImageDraw,
    center,
    value: str,
    color: str,
    fill: str = WHITE,
    size: int = 20,
    mono: bool = False,
):
    fitted = fit_size(draw, value, size, 340, bold=True, mono=mono, min_size=14)
    fnt = font(fitted, bold=True, mono=mono)
    tw, th = text_size(draw, value, fnt)
    cx, cy = sc(center)
    pad_x = sc(14)
    pad_y = sc(8)
    box = (cx - tw // 2 - pad_x, cy - th // 2 - pad_y, cx + tw // 2 + pad_x, cy + th // 2 + pad_y)
    draw.rounded_rectangle(box, radius=sc(9), fill=fill, outline=color, width=sc(2))
    draw.text((cx, cy + sc(1)), value, font=fnt, fill=color, anchor="mm")


def line_label(
    draw: ImageDraw.ImageDraw,
    center,
    value: str,
    color: str,
    fill: str = WHITE,
    size: int = 17,
    mono: bool = False,
    max_width: int = 300,
):
    fitted = fit_size(draw, value, size, max_width, bold=True, mono=mono, min_size=13)
    fnt = font(fitted, bold=True, mono=mono)
    tw, th = text_size(draw, value, fnt)
    cx, cy = sc(center)
    pad_x = sc(14)
    pad_y = sc(8)
    box = (cx - tw // 2 - pad_x, cy - th // 2 - pad_y, cx + tw // 2 + pad_x, cy + th // 2 + pad_y)
    draw.rounded_rectangle(box, radius=sc(9), fill=fill, outline=color, width=sc(2))
    draw.text((cx, cy + sc(1)), value, font=fnt, fill=color, anchor="mm")


def section_header(draw: ImageDraw.ImageDraw, x: int, y: int, title: str, color: str, fill: str, border: str):
    rounded(draw, (x, y, x + 230, y + 58), 29, fill=fill, outline=border, width=2)
    centered(draw, (x, y, x + 230, y + 58), title, 28, fill=color, bold=True)


def draw_badge(draw: ImageDraw.ImageDraw, box, value: str, color: str, fill: str):
    rounded(draw, box, 9, fill=fill, outline=color, width=2)
    centered(draw, box, value, 16, fill=color, bold=True)


def draw_server(draw: ImageDraw.ImageDraw, box, title: str, body: str):
    shadow(draw, box, 14)
    rounded(draw, box, 14, fill=BLUE_SOFT, outline=BLUE, width=3)
    x1, y1, x2, _ = box
    rounded(draw, (x1 + 24, y1 + 32, x1 + 78, y1 + 86), 9, fill=WHITE, outline=BLUE_BORDER, width=2)
    rect(draw, (x1 + 34, y1 + 47, x1 + 68, y1 + 53), fill=BLUE_BORDER)
    rect(draw, (x1 + 34, y1 + 63, x1 + 68, y1 + 69), fill=BLUE_BORDER)
    text(draw, (x1 + 102, y1 + 48), title, 25, fill=BLUE_DARK, bold=True, anchor="lm")
    draw_badge(draw, (x2 - 72, y1 + 24, x2 - 22, y1 + 52), "后端", BLUE_DARK, WHITE)
    draw_wrapped(draw, (x1 + 102, y1 + 74), body, 16, x2 - x1 - 128, fill=MUTED, line_gap=10)


def draw_contract(draw: ImageDraw.ImageDraw, box, title: str, body: str, purple_edge: bool = False):
    shadow(draw, box, 14)
    outline = PURPLE if purple_edge else GREEN
    rounded(draw, box, 14, fill=GREEN_SOFT, outline=outline, width=3)
    x1, y1, x2, _ = box
    rounded(draw, (x1 + 24, y1 + 32, x1 + 78, y1 + 86), 10, fill=WHITE, outline=GREEN_BORDER, width=2)
    centered(draw, (x1 + 24, y1 + 32, x1 + 78, y1 + 86), "{}", 23, fill=GREEN_DARK, bold=True, mono=True)
    text(draw, (x1 + 102, y1 + 48), title, 25, fill=GREEN_DARK, bold=True, anchor="lm")
    draw_wrapped(draw, (x1 + 102, y1 + 74), body, 16, x2 - x1 - 128, fill=MUTED, line_gap=10)


def draw_store_call(draw: ImageDraw.ImageDraw, box):
    shadow(draw, box, 12)
    rounded(draw, box, 12, fill=WHITE, outline=GREEN, width=3)
    x1, y1, x2, y2 = box
    text(draw, (x1 + 20, y1 + 21), "调用方法", 16, fill=GREEN_DARK, bold=True, anchor="lm")
    rounded(draw, (x1 + 96, y1 + 9, x2 - 16, y2 - 9), 9, fill=GREEN_SOFT, outline=GREEN_BORDER, width=1)
    code = "LogRegistry.storeLog(taskId, logHash)"
    code_size = fit_size(draw, code, 18, x2 - x1 - 132, bold=True, mono=True, min_size=14)
    centered(draw, (x1 + 96, y1 + 9, x2 - 16, y2 - 9), code, code_size, fill=GREEN_DARK, bold=True, mono=True)


def draw_table(draw: ImageDraw.ImageDraw, box):
    shadow(draw, box, 16)
    rounded(draw, box, 16, fill=WHITE, outline=LIGHT, width=2)
    x1, y1, x2, _ = box
    rounded(draw, (x1, y1, x2, y1 + 58), 16, fill=SLATE_SOFT, outline=None)
    rect(draw, (x1, y1 + 42, x2, y1 + 58), fill=SLATE_SOFT)
    text(draw, (x1 + 30, y1 + 35), "log_hash_records", 27, fill=INK, bold=True, mono=True, anchor="lm")
    text(draw, (x2 - 30, y1 + 35), "本地记录表", 19, fill=MUTED, bold=True, anchor="rm")

    rows = [
        ("task_id", "审计任务标识", BLUE, BLUE_SOFT),
        ("log_hash", "日志哈希摘要", BLUE, BLUE_SOFT),
        ("contract_address", "写入时的 LogRegistry 地址", PURPLE, PURPLE_SOFT),
        ("transaction_hash", "链上交易哈希", GREEN, GREEN_SOFT),
        ("block_number", "写入区块高度", GREEN, GREEN_SOFT),
        ("on_chain_status", "链上写入状态", GREEN, GREEN_SOFT),
    ]
    row_h = 36
    start_y = y1 + 70
    for index, (field, meaning, color, fill) in enumerate(rows):
        y = start_y + index * row_h
        rounded(draw, (x1 + 24, y, x2 - 24, y + 30), 7, fill=fill, outline=color if field == "contract_address" else LIGHT, width=2)
        text(draw, (x1 + 44, y + 15), field, 17, fill=color if field == "contract_address" else INK, bold=True, mono=True, anchor="lm")
        text(draw, (x1 + 300, y + 15), meaning, 16, fill=MUTED, anchor="lm")


def draw_address_chip(draw: ImageDraw.ImageDraw, box):
    shadow(draw, box, 14)
    rounded(draw, box, 14, fill=PURPLE_SOFT, outline=PURPLE, width=3)
    x1, y1, x2, _ = box
    text(draw, (x1 + 30, y1 + 36), "读取字段", 22, fill=PURPLE_DARK, bold=True, anchor="lm")
    rounded(draw, (x2 - 160, y1 + 22, x2 - 24, y1 + 58), 18, fill=WHITE, outline=PURPLE_BORDER, width=2)
    centered(draw, (x2 - 160, y1 + 22, x2 - 24, y1 + 58), "历史地址", 17, fill=PURPLE_DARK, bold=True)
    code = "log_hash_records.contract_address"
    code_size = fit_size(draw, code, 18, x2 - x1 - 70, bold=True, mono=True, min_size=15)
    text(draw, (x1 + 30, y1 + 84), code, code_size, fill=PURPLE_DARK, bold=True, mono=True, anchor="lm")


def draw_bridge_label(draw: ImageDraw.ImageDraw, box, value: str, color: str):
    rounded(draw, box, 12, fill=WHITE, outline=color, width=2)
    centered(draw, box, value, 16, fill=color, bold=True)


def draw_target_card(draw: ImageDraw.ImageDraw, box):
    shadow(draw, box, 14)
    rounded(draw, box, 14, fill=PURPLE_SOFT, outline=PURPLE, width=3)
    x1, y1, x2, _ = box
    text(draw, (x1 + 30, y1 + 40), "连接目标", 22, fill=PURPLE_DARK, bold=True, anchor="lm")
    text(draw, (x1 + 30, y1 + 78), "历史 LogRegistry 地址", 20, fill=PURPLE_DARK, bold=True, anchor="lm")


def draw_notice_card(
    draw: ImageDraw.ImageDraw,
    box,
    color: str,
    fill: str,
    title: str,
    body: str,
    icon: str,
):
    shadow(draw, box, 12)
    rounded(draw, box, 12, fill=fill, outline=color, width=2)
    x1, y1, x2, _ = box
    rounded(draw, (x1 + 28, y1 + 34, x1 + 76, y1 + 82), 24, fill=color, outline=color, width=1)
    if icon == "!":
        centered(draw, (x1 + 28, y1 + 34, x1 + 76, y1 + 82), "!", 25, fill=WHITE, bold=True)
    else:
        line(draw, [(x1 + 40, y1 + 58), (x1 + 52, y1 + 70), (x1 + 70, y1 + 45)], WHITE, width=5)

    title_max = x2 - x1 - 155
    title_size = fit_size(draw, title, 22, title_max, bold=True, min_size=18)
    text(draw, (x1 + 112, y1 + 43), title, title_size, fill=color, bold=True, anchor="lm")
    draw_wrapped(draw, (x1 + 112, y1 + 86), body, 16, title_max, fill=INK, line_gap=15)


def main():
    OUT.parent.mkdir(parents=True, exist_ok=True)

    global img
    img = Image.new("RGBA", (W * S, H * S), WHITE)
    draw = ImageDraw.Draw(img)

    for x in range(80, W, 80):
        line(draw, [(x, 0), (x, H)], GRID, width=1)
    for y in range(80, H, 80):
        line(draw, [(0, y), (W, y)], GRID, width=1)

    rect(draw, (38, 38, 1882, 1042), fill=None, outline="#E5E7EB", width=2)

    left_panel = (70, 80, 915, 775)
    right_panel = (1005, 80, 1850, 775)
    rounded(draw, left_panel, 20, fill="#FBFDFF", outline="#DBEAFE", width=2)
    rounded(draw, right_panel, 20, fill="#FCFDFD", outline="#DCFCE7", width=2)

    section_header(draw, 110, 124, "日志提交阶段", BLUE_DARK, BLUE_SOFT, BLUE_BORDER)
    section_header(draw, 1045, 124, "审计阶段", BLUE_DARK, BLUE_SOFT, BLUE_BORDER)

    server_box = (120, 205, 430, 365)
    contract_box = (585, 205, 895, 365)
    store_call = (320, 380, 720, 448)
    table_box = (115, 468, 860, 748)

    draw_server(draw, server_box, "Server", "生成 taskId 与 logHash\n提交链上存证")
    draw_contract(draw, contract_box, "LogRegistry", "接收哈希摘要\n保存写入记录")
    arrow(draw, [(430, 285), (585, 285)], GREEN, width=5, head=18)
    line_label(draw, (508, 285), "调用", GREEN, size=18, max_width=120)
    draw_store_call(draw, store_call)

    draw_table(draw, table_box)
    arrow(draw, [(260, 365), (260, 392), (185, 392), (185, 456), (350, 468)], BLUE, width=5, head=18)
    line_label(draw, (185, 424), "写入业务与链上元数据", BLUE, size=16, max_width=270)
    arrow(draw, [(735, 365), (735, 392), (835, 392), (835, 456), (650, 468)], GREEN, width=5, head=18)
    line_label(draw, (835, 424), "保存交易上下文", GREEN, size=16, max_width=220)

    audit_box = (1070, 205, 1380, 365)
    historical_contract = (1510, 205, 1790, 365)
    address_chip = (1065, 455, 1450, 588)
    historical_addr = (1548, 455, 1790, 588)
    onchain_box = (1250, 670, 1695, 750)

    draw_server(draw, audit_box, "审计服务", "读取本地存证记录\n准备链上哈希校验")
    draw_contract(draw, historical_contract, "LogRegistry", "连接历史合约地址\n查询当时写入记录", purple_edge=True)
    draw_address_chip(draw, address_chip)
    draw_target_card(draw, historical_addr)

    shadow(draw, onchain_box, 12)
    rounded(draw, onchain_box, 12, fill=GREEN_SOFT, outline=GREEN, width=3)
    centered(draw, onchain_box, "查询 onChainHash", 25, fill=GREEN_DARK, bold=True)

    arrow(draw, [(1222, 365), (1222, 455)], PURPLE, width=5, head=18)
    line_label(draw, (1222, 405), "读取 contract_address", PURPLE, size=16, max_width=260)
    dashed_arrow(draw, [(860, 600), (940, 600), (940, 522), (1065, 522)], PURPLE, width=4, head=17)
    line_label(draw, (940, 600), "历史地址字段", PURPLE, size=16, max_width=200)
    line(draw, [(1450, 522), (1536, 522)], PURPLE, width=5)
    draw_bridge_label(draw, (1460, 503, 1530, 541), "定位", PURPLE)
    arrow(draw, [(1530, 522), (1548, 522)], PURPLE, width=5, head=13)
    arrow(draw, [(1679, 455), (1679, 365)], PURPLE, width=5, head=18)
    line_label(draw, (1679, 405), "连接历史合约", PURPLE, size=16, max_width=210)
    arrow(draw, [(1770, 365), (1830, 365), (1830, 710), (1695, 710)], GREEN, width=5, head=18)
    line_label(draw, (1830, 626), "读取链上哈希", GREEN, size=16, max_width=210)

    risk_path = (1090, 605, 1455, 645)
    rounded(draw, risk_path, 18, fill=ORANGE_SOFT, outline=ORANGE_BORDER, width=2)
    centered(draw, risk_path, "当前环境变量地址：仅作风险对比", 17, fill=ORANGE_DARK, bold=True)

    bottom = (90, 800, 1830, 1000)
    rounded(draw, bottom, 18, fill=WHITE, outline=LIGHT, width=2)
    draw_notice_card(
        draw,
        (120, 825, 860, 976),
        ORANGE,
        ORANGE_SOFT,
        "风险提示：仅读取当前环境变量地址",
        "Hardhat 本地链重启或多次部署后，当前地址可能不等于历史写入地址。\n这会导致历史日志被误判。",
        "!",
    )
    draw_notice_card(
        draw,
        (1060, 825, 1800, 976),
        PURPLE,
        PURPLE_SOFT,
        "回溯策略：使用 contract_address 定位历史写入合约",
        "审计时读取 log_hash_records.contract_address，连接对应 LogRegistry。\n随后再查询 onChainHash。",
        "check",
    )
    arrow(draw, [(885, 902), (1030, 902)], PURPLE, width=5, head=18)
    line_label(draw, (958, 902), "对比", PURPLE, size=16, max_width=100)

    img_rgb = img.convert("RGB").resize((W, H), Image.Resampling.LANCZOS)
    img_rgb.save(OUT, "PNG", optimize=True)
    print(OUT)
    print(img_rgb.size)


if __name__ == "__main__":
    main()
