# -*- coding: utf-8 -*-
from __future__ import annotations

import math
import re
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "image" / "fig-5-1-agent-incremental-offset-flow.png"

W, H = 1920, 1080
S = 2

WHITE = "#FFFFFF"
INK = "#172033"
MUTED = "#5B6573"
GRID = "#F2F5F8"
LINE = "#CBD5E1"

BLUE = "#2563EB"
BLUE_DARK = "#1D4ED8"
BLUE_SOFT = "#EFF6FF"
BLUE_BORDER = "#93C5FD"

GREEN = "#16A34A"
GREEN_DARK = "#166534"
GREEN_SOFT = "#F0FDF4"
GREEN_BORDER = "#86EFAC"

AMBER = "#D97706"
AMBER_DARK = "#92400E"
AMBER_SOFT = "#FFFBEB"
AMBER_BORDER = "#FCD34D"

SLATE_SOFT = "#F8FAFC"
SLATE_BORDER = "#D7DEE8"


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
        r"C:\Windows\Fonts\Deng.ttf",
        r"C:\Windows\Fonts\simhei.ttf",
        r"C:\Windows\Fonts\segoeui.ttf",
    ]
)
UI_BOLD = find_font(
    [
        r"C:\Windows\Fonts\msyhbd.ttc",
        r"C:\Windows\Fonts\NotoSansSC-VF.ttf",
        r"C:\Windows\Fonts\Dengb.ttf",
        r"C:\Windows\Fonts\simhei.ttf",
        r"C:\Windows\Fonts\segoeuib.ttf",
    ]
)
MONO_FONT = find_font(
    [
        r"C:\Windows\Fonts\consola.ttf",
        r"C:\Windows\Fonts\cour.ttf",
        r"C:\Windows\Fonts\NotoSansSC-VF.ttf",
        r"C:\Windows\Fonts\msyh.ttc",
    ]
)
MONO_BOLD = find_font(
    [
        r"C:\Windows\Fonts\consolab.ttf",
        r"C:\Windows\Fonts\courbd.ttf",
        r"C:\Windows\Fonts\NotoSansSC-VF.ttf",
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


def text_size(draw: ImageDraw.ImageDraw, value: str, fnt: ImageFont.FreeTypeFont) -> tuple[int, int]:
    box = draw.textbbox((0, 0), value, font=fnt)
    return box[2] - box[0], box[3] - box[1]


def tokenized(value: str) -> list[str]:
    return re.findall(r"[A-Za-z0-9_./=]+|\s+|.", value)


def wrap_text(
    draw: ImageDraw.ImageDraw,
    value: str,
    size: int,
    max_width: int,
    bold: bool = False,
    mono: bool = False,
) -> list[str]:
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
    return [item for item in lines if item]


def rounded(draw: ImageDraw.ImageDraw, box, radius: int, fill, outline=None, width: int = 1):
    draw.rounded_rectangle(sc(box), radius=sc(radius), fill=fill, outline=outline, width=sc(width))


def rect(draw: ImageDraw.ImageDraw, box, fill, outline=None, width: int = 1):
    draw.rectangle(sc(box), fill=fill, outline=outline, width=sc(width))


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


def scaled_points(points):
    return [sc(p) for p in points]


def fit_font_size(
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


def fitted_center_text(
    draw: ImageDraw.ImageDraw,
    box,
    value: str,
    size: int,
    fill=INK,
    bold: bool = False,
    mono: bool = False,
    min_size: int = 12,
):
    x1, y1, x2, y2 = box
    fitted_size = fit_font_size(draw, value, size, int(x2 - x1 - 12), bold=bold, mono=mono, min_size=min_size)
    fnt = font(fitted_size, bold=bold, mono=mono)
    tw, th = text_size(draw, value, fnt)
    draw.text(
        (int(sc((x1 + x2) / 2) - tw / 2), int(sc((y1 + y2) / 2) - th / 2)),
        value,
        font=fnt,
        fill=fill,
    )


def draw_centered_lines(
    draw: ImageDraw.ImageDraw,
    box,
    lines: list[tuple[str, int, str, bool, bool]],
    gap: int = 10,
):
    measured = []
    total_h = 0
    for value, size, _fill, bold, mono in lines:
        fnt = font(size, bold=bold, mono=mono)
        tw, th = text_size(draw, value, fnt)
        measured.append((value, fnt, tw, th, _fill))
        total_h += th
    total_h += sc(gap) * (len(lines) - 1)

    cx = sc((box[0] + box[2]) / 2)
    y = sc((box[1] + box[3]) / 2) - total_h / 2
    for value, fnt, tw, th, _fill in measured:
        draw.text((int(cx - tw / 2), int(y)), value, font=fnt, fill=_fill)
        y += th + sc(gap)


def draw_wrapped_centered(
    draw: ImageDraw.ImageDraw,
    box,
    value: str,
    size: int,
    fill=INK,
    bold: bool = False,
    mono: bool = False,
    gap: int = 8,
):
    lines = []
    for raw_line in value.split("\n"):
        for item in wrap_text(draw, raw_line, size, int(box[2] - box[0] - 34), bold=bold, mono=mono):
            lines.append((item, size, fill, bold, mono))
    draw_centered_lines(draw, box, lines, gap=gap)


def draw_shadow(base: Image.Image, box, radius: int = 12):
    x1, y1, x2, y2 = box
    for offset, alpha in [(4, 14), (8, 8)]:
        overlay = Image.new("RGBA", (W * S, H * S), (0, 0, 0, 0))
        od = ImageDraw.Draw(overlay)
        od.rounded_rectangle(
            sc((x1 + offset, y1 + offset, x2 + offset, y2 + offset)),
            radius=sc(radius),
            fill=(15, 23, 42, alpha),
        )
        base.alpha_composite(overlay)


def draw_box(
    base: Image.Image,
    draw: ImageDraw.ImageDraw,
    box,
    title: str,
    body: str | None,
    accent: str,
    fill: str = WHITE,
    border: str = SLATE_BORDER,
):
    draw_shadow(base, box, radius=12)
    rounded(draw, box, 12, fill, border, 2)
    rounded(draw, (box[0] + 14, box[1] + 16, box[0] + 22, box[3] - 16), 4, accent)

    body_lines: list[tuple[str, int, str, bool, bool]] = []
    for item in wrap_text(draw, title, 28, int(box[2] - box[0] - 56), bold=True):
        body_lines.append((item, 28, INK, True, False))
    if body:
        for raw in body.split("\n"):
            for item in wrap_text(draw, raw, 22, int(box[2] - box[0] - 56), mono=False):
                body_lines.append((item, 22, MUTED, False, False))
    draw_centered_lines(draw, (box[0] + 34, box[1] + 16, box[2] - 16, box[3] - 16), body_lines, gap=9)


def draw_cylinder(
    base: Image.Image,
    draw: ImageDraw.ImageDraw,
    box,
    title: str,
    body: str,
    accent: str,
    fill: str,
    border: str,
):
    draw_shadow(base, box, radius=18)
    x1, y1, x2, y2 = box
    ellipse_h = 30
    rect(draw, (x1, y1 + ellipse_h / 2, x2, y2 - ellipse_h / 2), fill, border, 2)
    draw.ellipse(sc((x1, y1, x2, y1 + ellipse_h)), fill=fill, outline=border, width=sc(2))
    draw.arc(sc((x1, y2 - ellipse_h, x2, y2)), 0, 180, fill=border, width=sc(2))
    draw.line(scaled_points([(x1, y1 + ellipse_h / 2), (x1, y2 - ellipse_h / 2)]), fill=border, width=sc(2))
    draw.line(scaled_points([(x2, y1 + ellipse_h / 2), (x2, y2 - ellipse_h / 2)]), fill=border, width=sc(2))
    rounded(draw, (x1 + 20, y1 + 21, x1 + 28, y2 - 20), 4, accent)

    lines: list[tuple[str, int, str, bool, bool]] = []
    title_w = int(x2 - x1 - 58)
    title_size = fit_font_size(draw, title, 26, title_w, bold=True, min_size=19)
    lines.append((title, title_size, INK, True, False))
    for item in wrap_text(draw, body, 20, title_w, mono=False):
        lines.append((item, 20, MUTED, False, False))
    draw_centered_lines(draw, (x1 + 34, y1 + 28, x2 - 16, y2 - 20), lines, gap=8)


def draw_collector(base: Image.Image, draw: ImageDraw.ImageDraw, box):
    draw_shadow(base, box, radius=12)
    rounded(draw, box, 12, WHITE, BLUE_BORDER, 2)
    x1, y1, x2, y2 = box
    rounded(draw, (x1, y1, x2, y1 + 68), 12, BLUE_SOFT, BLUE_BORDER, 2)
    rect(draw, (x1, y1 + 56, x2, y1 + 69), BLUE_SOFT)
    draw_text(draw, ((x1 + x2) / 2, y1 + 22), "logCollector", 29, fill=BLUE_DARK, bold=True, anchor="ma")
    draw_text(draw, ((x1 + x2) / 2, y1 + 70), "封装采集记录", 22, fill=MUTED, anchor="ma")

    fields = [
        "taskId",
        "sourceType",
        "sourcePath",
        "logContent",
        "logLevel",
        "collectedAt",
    ]
    pill_w = 118
    gap_x = 18
    col_x = [x1 + 24, x1 + 24 + pill_w + gap_x]
    start_y = y1 + 116
    row_h = 37
    for idx, field in enumerate(fields):
        col = idx // 3
        row = idx % 3
        fx = col_x[col]
        fy = start_y + row * row_h
        rounded(draw, (fx, fy, fx + pill_w, fy + 28), 6, "#F8FAFC", "#E2E8F0", 1)
        fitted_center_text(draw, (fx + 5, fy + 2, fx + pill_w - 5, fy + 28), field, 17, fill=INK, mono=True)


def draw_diamond(base: Image.Image, draw: ImageDraw.ImageDraw, center, width: int, height: int):
    cx, cy = center
    points = [
        (cx, cy - height / 2),
        (cx + width / 2, cy),
        (cx, cy + height / 2),
        (cx - width / 2, cy),
    ]
    draw_shadow(base, (cx - width / 2, cy - height / 2, cx + width / 2, cy + height / 2), radius=14)
    draw.polygon([sc(p) for p in points], fill=WHITE, outline=BLUE_BORDER)
    draw.line([sc(points[0]), sc(points[1]), sc(points[2]), sc(points[3]), sc(points[0])], fill=BLUE_BORDER, width=sc(2))
    draw_centered_lines(
        draw,
        (cx - width / 2 + 20, cy - height / 2 + 20, cx + width / 2 - 20, cy + height / 2 - 20),
        [("提交", 27, INK, True, False), ("成功？", 27, INK, True, False)],
        gap=6,
    )


def arrow(draw: ImageDraw.ImageDraw, points, color: str = BLUE, width: int = 5, head: int = 18):
    scaled = [sc(p) for p in points]
    draw.line(scaled, fill=color, width=sc(width), joint="curve")
    p1 = scaled[-2]
    p2 = scaled[-1]
    angle = math.atan2(p2[1] - p1[1], p2[0] - p1[0])
    left = (
        p2[0] - sc(head) * math.cos(angle - math.pi / 6),
        p2[1] - sc(head) * math.sin(angle - math.pi / 6),
    )
    right = (
        p2[0] - sc(head) * math.cos(angle + math.pi / 6),
        p2[1] - sc(head) * math.sin(angle + math.pi / 6),
    )
    draw.polygon([p2, left, right], fill=color)


def label(draw: ImageDraw.ImageDraw, xy, value: str, color: str, fill: str, border: str):
    x, y = xy
    fnt = font(19, bold=True)
    tw, th = text_size(draw, value, fnt)
    box = (x, y, x + tw / S + 26, y + th / S + 14)
    rounded(draw, box, 14, fill, border, 1)
    draw.text(sc((x + 13, y + 6)), value, font=fnt, fill=color)


def draw_principle(draw: ImageDraw.ImageDraw, box, title: str, body: str, color: str, fill: str, border: str):
    rounded(draw, box, 12, fill, border, 2)
    x1, y1, x2, y2 = box
    max_w = int(x2 - x1 - 52)
    body_size = 20
    title_size = 23
    while body_size > 15:
        body_lines = wrap_text(draw, body, body_size, max_w)
        title_h = text_size(draw, title, font(title_size, bold=True))[1] / S
        body_h = sum(text_size(draw, line_value, font(body_size))[1] for line_value in body_lines) / S
        total_h = title_h + 10 + body_h + max(0, len(body_lines) - 1) * 7
        if total_h <= (y2 - y1 - 24):
            break
        body_size -= 1
    body_lines = wrap_text(draw, body, body_size, max_w)
    title_h = text_size(draw, title, font(title_size, bold=True))[1] / S
    body_line_h = text_size(draw, "字", font(body_size))[1] / S
    total_h = title_h + 10 + len(body_lines) * body_line_h + max(0, len(body_lines) - 1) * 7
    y = y1 + (y2 - y1 - total_h) / 2
    draw_text(draw, (x1 + 26, y), title, title_size, fill=color, bold=True)
    y += title_h + 10
    for line_value in body_lines:
        draw_text(draw, (x1 + 26, y), line_value, body_size, fill=INK)
        y += body_line_h + 7


def draw_background(draw: ImageDraw.ImageDraw):
    for x in range(80, W, 80):
        draw.line(scaled_points([(x, 70), (x, 1018)]), fill=GRID, width=sc(1))
    for y in range(80, 1020, 80):
        draw.line(scaled_points([(60, y), (1860, y)]), fill=GRID, width=sc(1))

    rounded(draw, (60, 92, 1860, 300), 18, "#FBFEFC", "#E7F6EC", 1)
    rounded(draw, (60, 325, 1860, 610), 18, "#FFFFFF", "#EEF2F7", 1)
    rounded(draw, (60, 668, 1860, 900), 18, "#FFFDF8", "#F8E8C7", 1)

    label(draw, (88, 112), "成功提交后", GREEN_DARK, GREEN_SOFT, GREEN_BORDER)
    label(draw, (88, 345), "Agent 增量采集", BLUE_DARK, BLUE_SOFT, BLUE_BORDER)
    label(draw, (88, 688), "提交失败时", AMBER_DARK, AMBER_SOFT, AMBER_BORDER)


def main() -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)

    global img
    img = Image.new("RGBA", (W * S, H * S), WHITE)
    draw = ImageDraw.Draw(img)

    draw_background(draw)

    source = (80, 390, 250, 520)
    offset = (300, 382, 525, 530)
    reader = (590, 370, 825, 542)
    collector = (885, 330, 1185, 580)
    submit = (1245, 390, 1395, 520)
    decision_center = (1535, 455)

    update_offset = (1285, 150, 1555, 280)
    sync_state = (1640, 150, 1840, 280)

    retry = (1365, 695, 1588, 835)
    wait = (1645, 695, 1855, 835)

    draw_box(img, draw, source, "读取", "sourcePath", BLUE, BLUE_SOFT, BLUE_BORDER)
    draw_cylinder(img, draw, offset, "offsetStore", "获取 last_offset", BLUE, "#F7FBFF", BLUE_BORDER)
    draw_box(img, draw, reader, "fileReader", "从 last_offset 之后读取新增日志", BLUE, WHITE, SLATE_BORDER)
    draw_collector(img, draw, collector)
    draw_box(img, draw, submit, "提交", "Server", BLUE, BLUE_SOFT, BLUE_BORDER)
    draw_diamond(img, draw, decision_center, 230, 200)

    draw_cylinder(img, draw, update_offset, "更新 offsetStore", "last_offset = 已提交日志末尾", GREEN, GREEN_SOFT, GREEN_BORDER)
    draw_box(img, draw, sync_state, "同步", "agent_states", GREEN, GREEN_SOFT, GREEN_BORDER)

    draw_box(img, draw, retry, "进入 retryQueue", "保留待提交日志", AMBER, AMBER_SOFT, AMBER_BORDER)
    draw_box(img, draw, wait, "等待下一轮重试", "暂不更新偏移量", AMBER, AMBER_SOFT, AMBER_BORDER)

    arrow(draw, [(250, 455), (300, 455)], BLUE)
    arrow(draw, [(525, 455), (590, 455)], BLUE)
    arrow(draw, [(825, 455), (885, 455)], BLUE)
    arrow(draw, [(1185, 455), (1245, 455)], BLUE)
    arrow(draw, [(1395, 455), (1420, 455)], BLUE)

    arrow(draw, [(1535, 355), (1535, 315), (1420, 315), (1420, 280)], GREEN)
    label(draw, (1542, 303), "成功", GREEN_DARK, GREEN_SOFT, GREEN_BORDER)
    arrow(draw, [(1555, 215), (1640, 215)], GREEN)

    arrow(draw, [(1535, 555), (1535, 642), (1477, 642), (1477, 695)], AMBER)
    label(draw, (1500, 625), "失败", AMBER_DARK, AMBER_SOFT, AMBER_BORDER)
    arrow(draw, [(1588, 765), (1645, 765)], AMBER)
    arrow(draw, [(1750, 835), (1750, 880), (1310, 880), (1310, 520)], AMBER, width=4, head=16)
    label(draw, (1462, 852), "下一轮重试", AMBER_DARK, AMBER_SOFT, AMBER_BORDER)

    draw_principle(
        draw,
        (170, 930, 900, 1010),
        "成功后更新偏移量",
        "Server 提交成功后，推进 offsetStore 中的 last_offset，并同步 agent_states。",
        GREEN_DARK,
        GREEN_SOFT,
        GREEN_BORDER,
    )
    draw_principle(
        draw,
        (1010, 930, 1750, 1010),
        "失败时保留待提交日志",
        "提交失败的日志进入 retryQueue；last_offset 保持不变，等待下一轮重试。",
        AMBER_DARK,
        AMBER_SOFT,
        AMBER_BORDER,
    )

    final = img.convert("RGB").resize((W, H), Image.Resampling.LANCZOS)
    final.save(OUT, quality=98)


if __name__ == "__main__":
    main()
