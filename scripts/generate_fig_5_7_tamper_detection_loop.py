# -*- coding: utf-8 -*-
from __future__ import annotations

import math
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "image" / "fig-5-7-tamper-detection-loop.png"

W, H = 1920, 1080
S = 2

WHITE = "#FFFFFF"
INK = "#1F2937"
MUTED = "#334155"
GRID = "#F3F6FA"
SHADOW = (15, 23, 42)

BLUE = "#2563EB"
BLUE_DARK = "#1D4ED8"
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

TEAL = "#0891B2"
TEAL_DARK = "#0E7490"
TEAL_SOFT = "#ECFEFF"
TEAL_BORDER = "#67E8F9"

RED = "#DC2626"
RED_DARK = "#991B1B"
RED_SOFT = "#FEF2F2"
RED_BORDER = "#FCA5A5"

AMBER = "#D97706"
AMBER_DARK = "#92400E"
AMBER_SOFT = "#FFFBEB"
AMBER_BORDER = "#FCD34D"

SLATE_SOFT = "#F8FAFC"
SLATE_BORDER = "#D8E0EA"


def find_font(candidates: list[str]) -> str | None:
    for candidate in candidates:
        path = Path(candidate)
        if path.exists():
            return str(path)
    return None


UI_FONT = find_font(
    [
        r"C:\Windows\Fonts\NotoSansSC-VF.ttf",
        r"C:\Windows\Fonts\msyh.ttc",
        r"C:\Windows\Fonts\simhei.ttf",
        r"C:\Windows\Fonts\Deng.ttf",
        r"C:\Windows\Fonts\segoeui.ttf",
    ]
)
UI_BOLD = find_font(
    [
        r"C:\Windows\Fonts\msyhbd.ttc",
        r"C:\Windows\Fonts\NotoSansSC-VF.ttf",
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
MONO_BOLD = find_font(
    [
        r"C:\Windows\Fonts\consolab.ttf",
        r"C:\Windows\Fonts\courbd.ttf",
        r"C:\Windows\Fonts\msyhbd.ttc",
    ]
)


def font(size: int, bold: bool = False, mono: bool = False) -> ImageFont.FreeTypeFont:
    path = MONO_BOLD if mono and bold else MONO_FONT if mono else UI_BOLD if bold else UI_FONT
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


def text_size(draw: ImageDraw.ImageDraw, value: str, fnt: ImageFont.FreeTypeFont) -> tuple[int, int]:
    box = draw.textbbox((0, 0), value, font=fnt)
    return box[2] - box[0], box[3] - box[1]


def draw_text(
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


def line(draw: ImageDraw.ImageDraw, points, fill, width: int = 3):
    draw.line([sc(p) for p in points], fill=fill, width=sc(width), joint="curve")


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


def dashed_arrow(draw: ImageDraw.ImageDraw, points, color: str, width: int = 4, dash: int = 16, gap: int = 10):
    for index in range(len(points) - 1):
        x1, y1 = points[index]
        x2, y2 = points[index + 1]
        length = math.hypot(x2 - x1, y2 - y1)
        if length == 0:
            continue
        ux = (x2 - x1) / length
        uy = (y2 - y1) / length
        limit = length - 18 if index == len(points) - 2 else length
        cursor = 0
        while cursor < limit:
            start = (x1 + ux * cursor, y1 + uy * cursor)
            end = (x1 + ux * min(cursor + dash, limit), y1 + uy * min(cursor + dash, limit))
            line(draw, [start, end], color, width)
            cursor += dash + gap
    p1 = sc(points[-2])
    p2 = sc(points[-1])
    angle = math.atan2(p2[1] - p1[1], p2[0] - p1[0])
    h = sc(18)
    wing = math.radians(28)
    p3 = (p2[0] - h * math.cos(angle - wing), p2[1] - h * math.sin(angle - wing))
    p4 = (p2[0] - h * math.cos(angle + wing), p2[1] - h * math.sin(angle + wing))
    draw.polygon([p2, p3, p4], fill=color)


def draw_shadow(base: Image.Image, box, radius: int = 14):
    x1, y1, x2, y2 = box
    for offset, alpha in ((5, 13), (10, 7)):
        overlay = Image.new("RGBA", (W * S, H * S), (0, 0, 0, 0))
        od = ImageDraw.Draw(overlay)
        od.rounded_rectangle(
            sc((x1 + offset, y1 + offset, x2 + offset, y2 + offset)),
            radius=sc(radius),
            fill=(*SHADOW, alpha),
        )
        base.alpha_composite(overlay)


def is_ascii(value: str) -> bool:
    return value.isascii()


def split_cjk_line(value: str, max_chars: int) -> list[str]:
    """Simple deterministic wrapping for short Chinese labels used in the figure."""
    if len(value) <= max_chars:
        return [value]
    lines: list[str] = []
    current = ""
    for char in value:
        current += char
        if len(current) >= max_chars:
            lines.append(current)
            current = ""
    if current:
        lines.append(current)
    return lines


def wrap_line(draw: ImageDraw.ImageDraw, value: str, size: int, max_width: int, mono: bool = False) -> list[str]:
    fnt = font(size, mono=mono)
    if text_size(draw, value, fnt)[0] <= sc(max_width):
        return [value]

    if not value.isascii():
        rough = max(1, int(max_width / size * 1.7))
        return split_cjk_line(value, rough)

    words = value.split(" ")
    lines: list[str] = []
    current = ""
    for word in words:
        trial = word if not current else f"{current} {word}"
        if current and text_size(draw, trial, fnt)[0] > sc(max_width):
            lines.append(current)
            current = word
        else:
            current = trial
    if current:
        lines.append(current)
    return lines


def fit_font_size(
    draw: ImageDraw.ImageDraw,
    lines: list[str],
    max_width: int,
    start: int,
    min_size: int = 15,
    mono: bool = False,
    bold: bool = False,
) -> int:
    size = start
    while size > min_size:
        fnt = font(size, bold=bold, mono=mono)
        if all(text_size(draw, line_value, fnt)[0] <= sc(max_width) for line_value in lines):
            return size
        size -= 1
    return min_size


def draw_centered_lines(
    draw: ImageDraw.ImageDraw,
    box,
    lines: list[str],
    size: int,
    fill=INK,
    bold: bool = False,
    mono: bool = False,
    gap: int = 8,
):
    fnt = font(size, bold=bold, mono=mono)
    metrics = [text_size(draw, value, fnt) for value in lines]
    total_h = sum(h for _, h in metrics) + sc(gap) * (len(lines) - 1)
    cx = sc((box[0] + box[2]) / 2)
    y = sc((box[1] + box[3]) / 2) - total_h / 2
    for index, value in enumerate(lines):
        tw, th = metrics[index]
        draw.text((int(cx - tw / 2), int(y)), value, font=fnt, fill=fill)
        y += th + sc(gap)


def draw_body_lines(
    draw: ImageDraw.ImageDraw,
    box,
    lines: tuple[str, ...],
    size: int,
    fill=MUTED,
    gap: int = 12,
):
    x1, y1, x2, y2 = box
    available_w = int(x2 - x1)
    rendered: list[tuple[str, bool]] = []
    for value in lines:
        mono = is_ascii(value)
        for wrapped in wrap_line(draw, value, size, available_w, mono=mono):
            rendered.append((wrapped, mono))

    line_heights = [text_size(draw, value, font(size, mono=mono))[1] / S for value, mono in rendered]
    total_h = sum(line_heights) + gap * (len(rendered) - 1)
    y = y1 + max(0, ((y2 - y1) - total_h) / 2)
    for index, (value, mono) in enumerate(rendered):
        draw_text(draw, (x1, y), value, size, fill, mono=mono)
        y += line_heights[index] + gap


@dataclass(frozen=True)
class Node:
    step: str
    title: tuple[str, ...]
    lines: tuple[str, ...]
    box: tuple[int, int, int, int]
    accent: str
    fill: str
    border: str
    title_size: int = 28
    body_size: int = 21


def draw_step_badge(draw: ImageDraw.ImageDraw, xy, step: str, accent: str, fill: str):
    x, y = xy
    rounded(draw, (x, y, x + 52, y + 32), 16, fill, accent, 2)
    draw_text(draw, (x + 26, y + 16), step, 18, accent, bold=True, mono=True, anchor="mm")


def draw_node(base: Image.Image, draw: ImageDraw.ImageDraw, node: Node):
    x1, y1, x2, y2 = node.box
    draw_shadow(base, node.box)
    rounded(draw, node.box, 14, WHITE, node.border, 3)
    rounded(draw, (x1, y1, x2, y1 + 12), 14, node.accent, node.accent, 1)
    rect(draw, (x1, y1 + 8, x2, y1 + 13), node.accent)
    draw_step_badge(draw, (x1 + 22, y1 + 24), node.step, node.accent, node.fill)

    title_box = (x1 + 88, y1 + 22, x2 - 22, y1 + 70)
    title_size = fit_font_size(draw, list(node.title), title_box[2] - title_box[0], node.title_size, bold=True)
    draw_centered_lines(draw, title_box, list(node.title), title_size, INK, bold=True, gap=5)

    body_box = (x1 + 32, y1 + 86, x2 - 32, y2 - 24)
    draw_body_lines(draw, body_box, node.lines, node.body_size, MUTED, gap=11)


def draw_stage_label(draw: ImageDraw.ImageDraw, box, value: str, color: str):
    rounded(draw, box, 18, SLATE_SOFT, SLATE_BORDER, 1)
    draw_text(draw, ((box[0] + box[2]) / 2, (box[1] + box[3]) / 2), value, 20, color, bold=True, anchor="mm")


def draw_pill(draw: ImageDraw.ImageDraw, box, value: str, color: str, fill: str, size: int = 20):
    rounded(draw, box, 17, fill, color, 2)
    draw_text(draw, ((box[0] + box[2]) / 2, (box[1] + box[3]) / 2), value, size, color, bold=True, mono=True, anchor="mm")


def draw_horizontal_labeled_arrow(
    draw: ImageDraw.ImageDraw,
    start_x: int,
    end_x: int,
    y: int,
    label_box,
    value: str,
    color: str,
    fill: str,
    text_color: str,
    size: int = 18,
    mono: bool = False,
    width: int = 5,
):
    line(draw, [(start_x, y), (label_box[0], y)], color, width)
    arrow(draw, [(label_box[2], y), (end_x, y)], color, width, 14)
    rounded(draw, label_box, 15, fill, color, 2)
    draw_text(
        draw,
        ((label_box[0] + label_box[2]) / 2, (label_box[1] + label_box[3]) / 2),
        value,
        size,
        text_color,
        bold=True,
        mono=mono,
        anchor="mm",
    )


def draw_vertical_labeled_elbow(
    draw: ImageDraw.ImageDraw,
    source_x: int,
    source_y: int,
    label_box,
    value: str,
    color: str,
    fill: str,
    target_points,
    size: int = 18,
):
    cx = int((label_box[0] + label_box[2]) / 2)
    line(draw, [(source_x, source_y), (cx, label_box[1])], color, 4)
    arrow(draw, [(cx, label_box[3]), *target_points], color, 4, 15)
    draw_pill(draw, label_box, value, color, fill, size=size)


def draw_compare_node(base: Image.Image, draw: ImageDraw.ImageDraw):
    box = (1040, 610, 1360, 835)
    x1, y1, x2, y2 = box
    draw_shadow(base, box)
    rounded(draw, box, 14, WHITE, RED_BORDER, 3)
    rounded(draw, (x1, y1, x2, y1 + 12), 14, RED, RED, 1)
    rect(draw, (x1, y1 + 8, x2, y1 + 13), RED)
    draw_step_badge(draw, (x1 + 22, y1 + 24), "07", RED, RED_SOFT)
    draw_text(draw, (x1 + 88, y1 + 41), "三方哈希比对", 28, INK, bold=True, anchor="lm")

    draw_pill(draw, (x1 + 34, y1 + 86, x1 + 162, y1 + 120), "actualHash", TEAL_DARK, TEAL_SOFT)
    draw_pill(draw, (x1 + 174, y1 + 86, x1 + 314, y1 + 120), "expectedHash", BLUE_DARK, BLUE_SOFT)
    draw_pill(draw, (x1 + 74, y1 + 137, x1 + 264, y1 + 171), "onChainHash", PURPLE_DARK, PURPLE_SOFT)

    draw_text(draw, ((x1 + x2) / 2, y1 + 197), "比对结果：不一致", 24, RED_DARK, bold=True, anchor="mm")


def draw_background(draw: ImageDraw.ImageDraw):
    rect(draw, (0, 0, W, H), WHITE)
    for x in range(80, W, 80):
        line(draw, [(x, 64), (x, H - 64)], GRID, 1)
    for y in range(80, H, 80):
        line(draw, [(64, y), (W - 64, y)], GRID, 1)

    rounded(draw, (72, 92, 1848, 430), 22, "#FCFDFF", SLATE_BORDER, 2)
    rounded(draw, (72, 540, 1848, 1000), 22, "#FFF9F9", RED_BORDER, 2)
    draw_stage_label(draw, (96, 112, 246, 150), "基准写入", BLUE_DARK)
    draw_stage_label(draw, (96, 562, 292, 600), "篡改检测闭环", RED_DARK)


def main():
    img = Image.new("RGBA", (W * S, H * S), WHITE)
    draw = ImageDraw.Draw(img)
    draw_background(draw)

    # Top row: original log and trusted hash baselines.
    top_nodes = [
        Node(
            "01",
            ("正常日志提交",),
            ("业务系统产生可信日志", "提交原始日志内容"),
            (140, 205, 380, 355),
            BLUE,
            BLUE_SOFT,
            BLUE_BORDER,
        ),
        Node(
            "02",
            ("logs 表",),
            ("log_content = 原始日志全文", "保留日志正文"),
            (470, 185, 760, 375),
            GREEN,
            GREEN_SOFT,
            GREEN_BORDER,
        ),
        Node(
            "03",
            ("log_hash_records",),
            ("log_hash = SHA-256(log_content)", "expectedHash 来源"),
            (850, 185, 1180, 375),
            BLUE,
            BLUE_SOFT,
            BLUE_BORDER,
            title_size=26,
            body_size=20,
        ),
        Node(
            "04",
            ("LogRegistry",),
            ("logHash 写入链上合约", "onChainHash 来源"),
            (1270, 185, 1585, 375),
            PURPLE,
            PURPLE_SOFT,
            PURPLE_BORDER,
        ),
    ]
    for node in top_nodes:
        draw_node(img, draw, node)

    arrow(draw, [(380, 280), (470, 280)], BLUE, 5)
    arrow(draw, [(760, 280), (850, 280)], GREEN, 5)
    arrow(draw, [(1180, 280), (1270, 280)], PURPLE, 5)

    # Bottom row: tamper detection loop. Equal spacing avoids overlap.
    bottom_nodes = [
        Node(
            "05",
            ("日志内容被修改",),
            ("修改 logs.log_content", "原文变为篡改后内容"),
            (155, 650, 430, 825),
            RED,
            RED_SOFT,
            RED_BORDER,
        ),
        Node(
            "06",
            ("重新计算 actualHash",),
            ("读取当前日志内容", "计算 actualHash"),
            (560, 650, 875, 825),
            TEAL,
            TEAL_SOFT,
            TEAL_BORDER,
            title_size=26,
            body_size=20,
        ),
        Node(
            "08",
            ("生成失败审计结果",),
            ("auditStatus=failed", "记录哈希比对失败"),
            (1455, 610, 1770, 770),
            RED,
            RED_SOFT,
            RED_BORDER,
            title_size=25,
            body_size=20,
        ),
        Node(
            "09",
            ("告警生成",),
            ("alertGenerated=true", "hash_mismatch 告警"),
            (1455, 815, 1770, 970),
            AMBER,
            AMBER_SOFT,
            AMBER_BORDER,
            title_size=26,
            body_size=20,
        ),
    ]
    for node in bottom_nodes[:2]:
        draw_node(img, draw, node)
    draw_compare_node(img, draw)
    for node in bottom_nodes[2:]:
        draw_node(img, draw, node)

    # Baseline sources are routed through labeled connector chips.
    draw_vertical_labeled_elbow(
        draw,
        1015,
        375,
        (950, 472, 1080, 504),
        "expectedHash",
        BLUE_DARK,
        BLUE_SOFT,
        [(1015, 528), (1138, 528), (1138, 610)],
        size=18,
    )
    draw_vertical_labeled_elbow(
        draw,
        1428,
        375,
        (1360, 458, 1496, 490),
        "onChainHash",
        PURPLE_DARK,
        PURPLE_SOFT,
        [(1428, 520), (1265, 520), (1265, 610)],
        size=18,
    )

    dashed_arrow(draw, [(615, 375), (615, 505), (292, 505), (292, 650)], RED, 4)

    draw_horizontal_labeled_arrow(
        draw,
        430,
        560,
        738,
        (452, 722, 538, 754),
        "内容改变",
        RED,
        RED_SOFT,
        RED_DARK,
        size=18,
        width=6,
    )

    arrow(draw, [(875, 738), (1040, 738)], RED, 6)
    draw_pill(draw, (912, 760, 1000, 792), "actualHash", TEAL_DARK, TEAL_SOFT, size=13)

    draw_horizontal_labeled_arrow(
        draw,
        1360,
        1455,
        690,
        (1370, 674, 1432, 706),
        "不一致",
        RED,
        RED_SOFT,
        RED_DARK,
        size=18,
        width=6,
    )
    arrow(draw, [(1612, 770), (1612, 815)], AMBER, 6)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    final = img.convert("RGB").resize((W, H), Image.Resampling.LANCZOS)
    final.save(OUT, "PNG", optimize=True)
    print(OUT)


if __name__ == "__main__":
    main()
