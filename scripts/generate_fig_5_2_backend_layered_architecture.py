# -*- coding: utf-8 -*-
from __future__ import annotations

import math
import re
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "image" / "fig-5-2-backend-layered-architecture.png"

W, H = 1920, 1080
S = 2

WHITE = "#FFFFFF"
INK = "#172033"
MUTED = "#111827"
LIGHT_TEXT = "#FFFFFF"
PAGE_LINE = "#E5EAF2"

SLATE = "#475569"
SLATE_SOFT = "#F8FAFC"
SLATE_BORDER = "#CBD5E1"

BLUE = "#2563EB"
BLUE_DARK = "#1D4ED8"
BLUE_SOFT = "#EFF6FF"
BLUE_BORDER = "#93C5FD"

TEAL = "#0F766E"
TEAL_SOFT = "#ECFDF5"
TEAL_BORDER = "#7DD3FC"

GREEN = "#16A34A"
GREEN_DARK = "#166534"
GREEN_SOFT = "#F0FDF4"
GREEN_BORDER = "#86EFAC"

AMBER = "#D97706"
AMBER_SOFT = "#FFF7ED"
AMBER_BORDER = "#FDBA74"

PURPLE = "#7C3AED"
PURPLE_DARK = "#5B21B6"
PURPLE_SOFT = "#F5F3FF"
PURPLE_BORDER = "#C4B5FD"

RED = "#DC2626"
RED_SOFT = "#FEF2F2"
RED_BORDER = "#FCA5A5"


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
        r"C:\Windows\Fonts\segoeui.ttf",
    ]
)
MONO_BOLD = find_font(
    [
        r"C:\Windows\Fonts\consolab.ttf",
        r"C:\Windows\Fonts\courbd.ttf",
        r"C:\Windows\Fonts\msyhbd.ttc",
        r"C:\Windows\Fonts\segoeuib.ttf",
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


def rect(draw: ImageDraw.ImageDraw, box, fill, outline=None, width: int = 1):
    draw.rectangle(sc(box), fill=fill, outline=outline, width=sc(width))


def rounded(draw: ImageDraw.ImageDraw, box, radius: int, fill, outline=None, width: int = 1):
    draw.rounded_rectangle(sc(box), radius=sc(radius), fill=fill, outline=outline, width=sc(width))


def line(draw: ImageDraw.ImageDraw, points, fill, width: int = 3, joint: str = "curve"):
    draw.line([sc(p) for p in points], fill=fill, width=sc(width), joint=joint)


def tokenized(value: str) -> list[str]:
    return re.findall(r"[A-Za-z0-9_./-]+|\s+|.", value)


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


def centered_lines(
    draw: ImageDraw.ImageDraw,
    box,
    lines: list[str],
    sizes: list[int],
    colors: list[str] | None = None,
    bolds: list[bool] | None = None,
    monos: list[bool] | None = None,
    line_gap: int = 10,
    pad_x: int = 28,
):
    x1, y1, x2, y2 = [sc(v) for v in box]
    max_w = (x2 - x1) / S - pad_x * 2
    prepared: list[tuple[str, ImageFont.FreeTypeFont, str]] = []
    for index, value in enumerate(lines):
        size = sizes[min(index, len(sizes) - 1)]
        color = colors[min(index, len(colors) - 1)] if colors else INK
        bold = bolds[min(index, len(bolds) - 1)] if bolds else False
        mono = monos[min(index, len(monos) - 1)] if monos else False
        for part in wrap_text(draw, value, size, int(max_w), bold=bold, mono=mono):
            prepared.append((part, font(size, bold=bold, mono=mono), color))

    heights = [text_size(draw, item, fnt)[1] for item, fnt, _ in prepared]
    total_h = sum(heights) + sc(line_gap) * max(0, len(prepared) - 1)
    y = y1 + ((y2 - y1) - total_h) // 2 - sc(1)
    cx = x1 + (x2 - x1) // 2
    for (item, fnt, color), th in zip(prepared, heights):
        tw, _ = text_size(draw, item, fnt)
        draw.text((cx - tw // 2, y), item, font=fnt, fill=color)
        y += th + sc(line_gap)


def shadow(base: Image.Image, box, radius: int = 18):
    x1, y1, x2, y2 = box
    for offset, alpha in [(4, 13), (9, 7)]:
        overlay = Image.new("RGBA", (W * S, H * S), (0, 0, 0, 0))
        od = ImageDraw.Draw(overlay)
        od.rounded_rectangle(
            sc((x1 + offset, y1 + offset, x2 + offset, y2 + offset)),
            radius=sc(radius),
            fill=(15, 23, 42, alpha),
        )
        base.alpha_composite(overlay)


def arrow(draw: ImageDraw.ImageDraw, points, color: str, width: int = 4, head: int = 18):
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


def vertical_arrow_between(draw: ImageDraw.ImageDraw, upper: Node, lower: Node, color: str):
    x = (upper.box[0] + upper.box[2]) // 2
    y1 = upper.box[3] + 8
    y2 = lower.box[1] - 10
    if y2 - y1 < 24:
        y1 = upper.box[3] + 3
        y2 = lower.box[1] - 3
    arrow(draw, [(x, y1), (x, y2)], color, width=5, head=18)


def label_chip(draw: ImageDraw.ImageDraw, center, value: str, color: str, fill: str):
    fnt = font(21, bold=True)
    tw, th = text_size(draw, value, fnt)
    cx, cy = sc(center)
    pad_x = sc(15)
    pad_y = sc(7)
    box = (cx - tw // 2 - pad_x, cy - th // 2 - pad_y, cx + tw // 2 + pad_x, cy + th // 2 + pad_y)
    draw.rounded_rectangle(box, radius=sc(8), fill=fill, outline=color, width=sc(2))
    draw.text((cx, cy + sc(1)), value, font=fnt, fill=color, anchor="mm")


def draw_section_label(draw: ImageDraw.ImageDraw, box, title: str, color: str):
    x1, y1, x2, _ = box
    draw_text(draw, (x1 + 8, y1 - 34), title, 28, fill=color, bold=True)
    line(draw, [(x1 + 8, y1 - 4), (x2 - 8, y1 - 4)], fill=PAGE_LINE, width=2)


@dataclass(frozen=True)
class Node:
    name: str
    box: tuple[int, int, int, int]
    fill: str
    border: str
    header: str | None = None
    accent: str | None = None
    lines: tuple[str, ...] = ()
    mono_lines: bool = False

    @property
    def left(self) -> tuple[int, int]:
        x1, y1, _, y2 = self.box
        return x1, (y1 + y2) // 2

    @property
    def right(self) -> tuple[int, int]:
        _, y1, x2, y2 = self.box
        return x2, (y1 + y2) // 2

    @property
    def top(self) -> tuple[int, int]:
        x1, y1, x2, _ = self.box
        return (x1 + x2) // 2, y1

    @property
    def bottom(self) -> tuple[int, int]:
        x1, _, x2, y2 = self.box
        return (x1 + x2) // 2, y2


def draw_node(draw: ImageDraw.ImageDraw, node: Node, base: Image.Image | None = None):
    if base is not None:
        shadow(base, node.box, radius=14)
    rounded(draw, node.box, 14, fill=node.fill, outline=node.border, width=3)
    x1, y1, x2, y2 = node.box

    if node.accent:
        rounded(draw, (x1, y1, x1 + 13, y2), 14, fill=node.accent, outline=None)
        rect(draw, (x1 + 6, y1, x1 + 13, y2), fill=node.accent, outline=None)

    if node.header:
        draw_text(draw, (x1 + 30, y1 + 20), node.header, 29, fill=INK, bold=True)
        line(draw, [(x1 + 30, y1 + 58), (x2 - 30, y1 + 58)], fill=node.border, width=2)
        if node.lines:
            y = y1 + 80
            fnt_size = 23 if len(node.lines) <= 4 else 21
            for item in node.lines:
                draw_text(
                    draw,
                    (x1 + 42, y),
                    item,
                    fnt_size,
                    fill=MUTED,
                    mono=node.mono_lines,
                    anchor="la",
                )
                y += 36
        return

    _, y1, _, y2 = node.box
    compact = (y2 - y1) <= 72 and len(node.lines) == 2
    sizes = [24, 16] if compact else [29] + [22] * max(0, len(node.lines) - 1)
    gap = 0 if compact else 9
    centered_lines(
        draw,
        node.box,
        list(node.lines),
        sizes,
        colors=[INK] + [MUTED] * max(0, len(node.lines) - 1),
        bolds=[True] + [False] * max(0, len(node.lines) - 1),
        monos=[False] + [node.mono_lines] * max(0, len(node.lines) - 1),
        line_gap=gap,
        pad_x=24,
    )


def draw_layer_node(
    draw: ImageDraw.ImageDraw,
    node: Node,
    columns: int,
    base: Image.Image | None = None,
    margin_x: int = 56,
    y_offset: int = 72,
):
    if base is not None:
        shadow(base, node.box, radius=14)
    rounded(draw, node.box, 14, fill=node.fill, outline=node.border, width=3)
    x1, y1, x2, y2 = node.box

    if node.accent:
        rounded(draw, (x1, y1, x1 + 13, y2), 14, fill=node.accent, outline=None)
        rect(draw, (x1 + 6, y1, x1 + 13, y2), fill=node.accent, outline=None)

    draw_text(draw, (x1 + 30, y1 + 18), node.header or node.name, 28, fill=INK, bold=True)
    line(draw, [(x1 + 30, y1 + 56), (x2 - 30, y1 + 56)], fill=node.border, width=2)

    items = list(node.lines)
    if not items:
        return

    gap_x = 22
    gap_y = 10
    chip_h = 34
    content_w = x2 - x1 - margin_x * 2
    chip_w = (content_w - gap_x * (columns - 1)) / columns
    y_start = y1 + y_offset
    for index, item in enumerate(items):
        row = index // columns
        col = index % columns
        bx1 = x1 + margin_x + col * (chip_w + gap_x)
        by1 = y_start + row * (chip_h + gap_y)
        chip = (bx1, by1, bx1 + chip_w, by1 + chip_h)
        rounded(draw, chip, 8, fill=WHITE, outline=node.border, width=1)
        size = 20 if node.mono_lines else 21
        centered_lines(
            draw,
            chip,
            [item],
            [size],
            colors=[MUTED],
            monos=[node.mono_lines],
            line_gap=0,
            pad_x=8,
        )


def draw_compact_layer_node(draw: ImageDraw.ImageDraw, node: Node, base: Image.Image | None = None):
    if base is not None:
        shadow(base, node.box, radius=14)
    rounded(draw, node.box, 14, fill=node.fill, outline=node.border, width=3)

    x1, y1, x2, y2 = node.box
    title = node.lines[0]
    subtitle = node.lines[1] if len(node.lines) > 1 else ""
    cx = (x1 + x2) // 2
    h = y2 - y1
    draw_text(draw, (cx, y1 + h * 0.38), title, 25, fill=INK, bold=True, anchor="mm")
    if subtitle:
        draw_text(draw, (cx, y1 + h * 0.71), subtitle, 15, fill=MUTED, anchor="mm")


def draw_database(draw: ImageDraw.ImageDraw, box, title: str, subtitle: str, accent: str):
    x1, y1, x2, y2 = box
    draw.rounded_rectangle(sc(box), radius=sc(14), fill=WHITE, outline=accent, width=sc(3))
    cx = (x1 + x2) // 2
    top = y1 + 20
    ellipse_h = 24
    body_bottom = y1 + 82
    body = (x1 + 70, top + ellipse_h // 2, x2 - 70, body_bottom)
    draw.rectangle(sc(body), fill=GREEN_SOFT, outline=accent, width=sc(3))
    draw.ellipse(sc((x1 + 70, top, x2 - 70, top + ellipse_h)), fill=GREEN_SOFT, outline=accent, width=sc(3))
    draw.arc(sc((x1 + 70, body_bottom - ellipse_h // 2, x2 - 70, body_bottom + ellipse_h // 2)), start=0, end=180, fill=accent, width=sc(3))
    draw_text(draw, (cx, y1 + 108), title, 31, fill=INK, bold=True, anchor="mm")
    draw_text(draw, (cx, y1 + 145), subtitle, 21, fill=MUTED, anchor="mm")


def draw_contract(draw: ImageDraw.ImageDraw, box, title: str, subtitle: str, accent: str):
    x1, y1, x2, y2 = box
    rounded(draw, box, 14, fill=WHITE, outline=accent, width=3)
    draw_text(draw, ((x1 + x2) // 2, y1 + 57), title, 34, fill=INK, bold=True, anchor="mm")
    line(draw, [(x1 + 74, y1 + 86), (x2 - 74, y1 + 86)], fill=PURPLE_BORDER, width=2)
    draw_text(draw, ((x1 + x2) // 2, y1 + 113), subtitle, 21, fill=MUTED, anchor="mm")


def draw_backend_frame(draw: ImageDraw.ImageDraw, base: Image.Image, box):
    shadow(base, box, radius=22)
    rounded(draw, box, 22, fill="#FBFDFF", outline="#BFD0E7", width=3)
    x1, y1, x2, _ = box
    draw_text(draw, (x1 + 36, y1 + 28), "Express 后端分层", 31, fill=BLUE_DARK, bold=True)
    draw_text(draw, (x2 - 36, y1 + 30), "Node.js / Express", 24, fill=MUTED, anchor="ra")
    line(draw, [(x1 + 36, y1 + 70), (x2 - 36, y1 + 70)], fill="#D8E5F4", width=2)


def draw_background_grid(draw: ImageDraw.ImageDraw):
    for x in range(80, W, 160):
        line(draw, [(x, 58), (x, H - 58)], fill="#F5F7FA", width=1)
    for y in range(80, H, 120):
        line(draw, [(70, y), (W - 70, y)], fill="#F5F7FA", width=1)


def main():
    OUT.parent.mkdir(parents=True, exist_ok=True)

    img = Image.new("RGBA", (W * S, H * S), WHITE)
    draw = ImageDraw.Draw(img)
    draw_background_grid(draw)

    left_group = (80, 145, 390, 805)
    backend_group = (475, 45, 1365, 1070)
    right_group = (1450, 615, 1840, 1010)

    draw_section_label(draw, left_group, "外部调用方", SLATE)
    draw_section_label(draw, right_group, "外部资源", SLATE)
    draw_backend_frame(draw, img, backend_group)

    callers = [
        Node("agent", (110, 245, 360, 345), SLATE_SOFT, SLATE_BORDER, lines=("Agent", "任务代理调用")),
        Node("web", (110, 455, 360, 555), SLATE_SOFT, SLATE_BORDER, lines=("Web 前端", "页面操作请求")),
        Node("benchmark", (110, 665, 360, 765), SLATE_SOFT, SLATE_BORDER, lines=("性能测试脚本", "批量压测请求")),
    ]
    for node in callers:
        draw_node(draw, node)

    routes = Node(
        "routes",
        (535, 130, 1305, 300),
        BLUE_SOFT,
        BLUE_BORDER,
        header="routes",
        accent=BLUE,
        lines=(
            "POST /api/logs",
            "GET /api/logs",
            "POST /api/audits/run",
            "GET /api/alerts",
        ),
        mono_lines=True,
    )
    controllers = Node(
        "controllers",
        (535, 335, 1305, 460),
        TEAL_SOFT,
        "#99F6E4",
        header="controllers",
        accent=TEAL,
        lines=("参数读取", "校验", "响应封装"),
    )
    services = Node(
        "services",
        (535, 515, 1305, 685),
        AMBER_SOFT,
        AMBER_BORDER,
        header="services",
        accent=AMBER,
        lines=("日志服务", "区块链服务", "审计执行服务", "告警服务", "总览服务"),
    )
    repositories = Node(
        "repositories",
        (535, 740, 1305, 860),
        BLUE_SOFT,
        BLUE_BORDER,
        header="repositories",
        accent=BLUE,
        lines=("日志读写", "审计与告警记录访问"),
    )
    db_layer = Node(
        "db",
        (535, 900, 1305, 965),
        GREEN_SOFT,
        GREEN_BORDER,
        lines=("db", "SQLite 连接与查询执行"),
    )
    blockchain = Node(
        "blockchain",
        (535, 995, 1305, 1060),
        PURPLE_SOFT,
        PURPLE_BORDER,
        lines=("blockchain", "LogRegistry 合约调用"),
    )

    draw_layer_node(draw, routes, columns=2, base=img, margin_x=70, y_offset=64)
    draw_layer_node(draw, controllers, columns=3, base=img)
    draw_layer_node(draw, services, columns=3, base=img)
    draw_layer_node(draw, repositories, columns=2, base=img)
    for node in [db_layer, blockchain]:
        draw_compact_layer_node(draw, node, base=img)

    sqlite_box = (1480, 675, 1810, 837)
    contract_box = (1480, 920, 1810, 1055)
    draw_database(draw, sqlite_box, "SQLite", "本地日志、审计、告警数据", GREEN_DARK)
    draw_contract(draw, contract_box, "LogRegistry", "日志哈希上链与查询", PURPLE_DARK)

    # External requests enter the routes layer.
    for caller, y_mid in zip(callers, [270, 505, 740]):
        start = caller.right
        end_y = routes.box[1] + 45 + (y_mid - 250) * 0.11
        arrow(draw, [start, (430, start[1]), (430, end_y), (routes.box[0] - 8, end_y)], BLUE, width=4, head=16)

    label_chip(draw, (352, 210), "HTTP / API", BLUE, BLUE_SOFT)

    # Internal request processing flow.
    vertical_arrow_between(draw, routes, controllers, BLUE)
    vertical_arrow_between(draw, controllers, services, TEAL)
    vertical_arrow_between(draw, services, repositories, AMBER)
    vertical_arrow_between(draw, repositories, db_layer, GREEN_DARK)

    # Services invoke the blockchain adapter directly; keep this branch inside the backend frame.
    sx, sy = services.left
    arrow(draw, [(sx, sy), (510, sy), (510, blockchain.left[1]), blockchain.left], PURPLE_DARK, width=4, head=16)

    # Connections to external resources.
    arrow(draw, [db_layer.right, (1420, db_layer.right[1]), (1420, 756), (sqlite_box[0] - 10, 756)], GREEN_DARK, width=5, head=18)
    arrow(draw, [blockchain.right, (contract_box[0] - 10, blockchain.right[1])], PURPLE_DARK, width=5, head=18)
    label_chip(draw, (1418, 716), "SQL", GREEN_DARK, GREEN_SOFT)
    label_chip(draw, (1392, 1000), "合约 ABI", PURPLE_DARK, PURPLE_SOFT)

    validate_layout(
        nodes=[*callers, routes, controllers, services, repositories, db_layer, blockchain],
        resource_boxes=[sqlite_box, contract_box],
        text_values=[
            "外部调用方",
            "Agent",
            "Web 前端",
            "性能测试脚本",
            "Express 后端分层",
            "routes",
            "POST /api/logs",
            "GET /api/logs",
            "POST /api/audits/run",
            "GET /api/alerts",
            "controllers",
            "参数读取",
            "校验",
            "响应封装",
            "services",
            "日志服务",
            "区块链服务",
            "审计执行服务",
            "告警服务",
            "总览服务",
            "repositories",
            "db",
            "blockchain",
            "SQLite",
            "LogRegistry",
        ],
    )

    img = img.convert("RGB").resize((W, H), Image.Resampling.LANCZOS)
    img.save(OUT, quality=95)
    print(f"saved: {OUT}")
    print(f"size: {W}x{H}")
    print("validation: passed")


def boxes_overlap(a, b, gap: int = 0) -> bool:
    ax1, ay1, ax2, ay2 = a
    bx1, by1, bx2, by2 = b
    return not (ax2 + gap <= bx1 or bx2 + gap <= ax1 or ay2 + gap <= by1 or by2 + gap <= ay1)


def validate_layout(nodes: list[Node], resource_boxes: list[tuple[int, int, int, int]], text_values: list[str]):
    if W != 1920 or H != 1080:
        raise AssertionError("Output canvas must be 1920x1080.")

    forbidden = ["图 5-2", "图5-2", "MySQL", "Redis", "Kafka", "Docker", "Kubernetes", "水印", "二维码"]
    joined = "\n".join(text_values)
    for item in forbidden:
        if item in joined:
            raise AssertionError(f"Forbidden text found: {item}")

    required = [
        "Agent",
        "Web 前端",
        "性能测试脚本",
        "routes",
        "controllers",
        "services",
        "repositories",
        "db",
        "blockchain",
        "POST /api/logs",
        "GET /api/logs",
        "POST /api/audits/run",
        "GET /api/alerts",
        "SQLite",
        "LogRegistry",
    ]
    for item in required:
        if item not in joined:
            raise AssertionError(f"Required text missing: {item}")

    boxes = [(node.name, node.box) for node in nodes]
    boxes.extend((f"resource_{index}", box) for index, box in enumerate(resource_boxes))
    for index, (name_a, box_a) in enumerate(boxes):
        for name_b, box_b in boxes[index + 1 :]:
            if boxes_overlap(box_a, box_b, gap=8):
                raise AssertionError(f"Overlapping layout boxes: {name_a} and {name_b}")

    for name, (x1, y1, x2, y2) in boxes:
        if not (0 <= x1 < x2 <= W and 0 <= y1 < y2 <= H):
            raise AssertionError(f"Box outside canvas: {name}")


if __name__ == "__main__":
    main()
