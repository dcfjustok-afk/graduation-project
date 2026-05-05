from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "image" / "fig-3-4-logregistry-data-structure.png"

W, H = 1920, 1080
S = 2

WHITE = "#FFFFFF"
INK = "#1F2937"
MUTED = "#5B6573"
LIGHT_BORDER = "#D7DEE8"
PANEL_FILL = "#FBFCFE"
GRID_LINE = "#EEF2F7"

GREEN = "#2E7D32"
GREEN_DARK = "#1B5E20"
GREEN_FILL = "#EAF7EF"
GREEN_SOFT = "#F4FBF6"

BLUE = "#2563EB"
BLUE_DARK = "#1E40AF"
BLUE_FILL = "#EAF1FF"

ORANGE = "#F59E0B"
ORANGE_DARK = "#B45309"
ORANGE_FILL = "#FFF4DE"


def find_font(candidates: list[str]) -> str | None:
    for candidate in candidates:
        path = Path(candidate)
        if path.exists():
            return str(path)
    return None


UI_FONT = find_font(
    [
        r"C:\Windows\Fonts\segoeui.ttf",
        r"C:\Windows\Fonts\arial.ttf",
        r"C:\Windows\Fonts\msyh.ttc",
    ]
)
UI_BOLD = find_font(
    [
        r"C:\Windows\Fonts\segoeuib.ttf",
        r"C:\Windows\Fonts\arialbd.ttf",
        r"C:\Windows\Fonts\msyhbd.ttc",
    ]
)
MONO_FONT = find_font(
    [
        r"C:\Windows\Fonts\consola.ttf",
        r"C:\Windows\Fonts\cour.ttf",
        r"C:\Windows\Fonts\segoeui.ttf",
    ]
)


def font(size: int, bold: bool = False, mono: bool = False) -> ImageFont.FreeTypeFont:
    path = MONO_FONT if mono else (UI_BOLD if bold else UI_FONT)
    if path:
        return ImageFont.truetype(path, size * S)
    return ImageFont.load_default(size * S)


def sc(values):
    if isinstance(values, (tuple, list)):
        return tuple(int(round(v * S)) for v in values)
    return int(round(values * S))


def rounded(draw: ImageDraw.ImageDraw, box, radius: int, fill, outline=None, width: int = 1):
    draw.rounded_rectangle(sc(box), radius=sc(radius), fill=fill, outline=outline, width=sc(width))


def rect(draw: ImageDraw.ImageDraw, box, fill, outline=None, width: int = 1):
    draw.rectangle(sc(box), fill=fill, outline=outline, width=sc(width))


def line(draw: ImageDraw.ImageDraw, points, fill, width: int = 3, joint: str = "curve"):
    draw.line([sc(p) for p in points], fill=fill, width=sc(width), joint=joint)


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


def centered_text(draw: ImageDraw.ImageDraw, box, value: str, size: int, fill=INK, bold=False, mono=False):
    fnt = font(size, bold=bold, mono=mono)
    cx = (box[0] + box[2]) / 2
    cy = (box[1] + box[3]) / 2
    draw.text(sc((cx, cy)), value, font=fnt, fill=fill, anchor="mm")


def label_on_line(
    draw: ImageDraw.ImageDraw,
    center,
    value: str,
    color: str,
    fill: str = WHITE,
    size: int = 24,
):
    fnt = font(size, bold=True)
    tw, th = text_size(draw, value, fnt)
    pad_x = sc(12)
    pad_y = sc(7)
    cx, cy = sc(center)
    box = (cx - tw // 2 - pad_x, cy - th // 2 - pad_y, cx + tw // 2 + pad_x, cy + th // 2 + pad_y)
    draw.rounded_rectangle(box, radius=sc(8), fill=fill, outline=color, width=sc(2))
    draw.text((cx, cy + sc(1)), value, font=fnt, fill=color, anchor="mm")


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


def shadow(draw: ImageDraw.ImageDraw, box, radius: int = 18):
    x1, y1, x2, y2 = box
    for i, alpha in enumerate([18, 12, 7]):
        offset = 4 + i * 3
        color = (31, 41, 55, alpha)
        overlay = Image.new("RGBA", (W * S, H * S), (0, 0, 0, 0))
        od = ImageDraw.Draw(overlay)
        od.rounded_rectangle(sc((x1 + offset, y1 + offset, x2 + offset, y2 + offset)), radius=sc(radius), fill=color)
        img.alpha_composite(overlay)


def draw_panel_header(draw, box, title: str, subtitle: str, color: str):
    x1, y1, x2, _ = box
    rounded(draw, (x1, y1, x2, y1 + 70), 18, fill=WHITE, outline=None)
    draw_text(draw, (x1 + 30, y1 + 24), title, 32, fill=color, bold=True, mono=True)
    draw_text(draw, (x1 + 30, y1 + 54), subtitle, 20, fill=MUTED)


def draw_record_row(draw, box, index: int, y: int):
    x1, _, x2, _ = box
    row = (x1 + 24, y, x2 - 24, y + 82)
    rounded(draw, row, 10, fill=WHITE, outline=LIGHT_BORDER, width=2)
    rounded(draw, (row[0] + 18, row[1] + 18, row[0] + 80, row[1] + 64), 8, fill=GREEN_FILL, outline=GREEN, width=2)
    centered_text(draw, (row[0] + 18, row[1] + 18, row[0] + 80, row[1] + 64), f"[{index}]", 24, fill=GREEN_DARK, bold=True, mono=True)
    draw_text(draw, (row[0] + 104, row[1] + 36), f"recordId {index}", 25, fill=INK, bold=True, mono=True, anchor="lm")
    draw_text(draw, (row[0] + 104, row[1] + 62), "LogRecord", 20, fill=MUTED, mono=True, anchor="lm")
    draw_text(draw, (row[2] - 30, row[1] + 42), ">", 28, fill=GREEN, bold=True, anchor="mm")


def draw_mapping_row(draw, box, y: int, task_label: str, ids: str):
    x1, _, x2, _ = box
    row = (x1 + 24, y, x2 - 24, y + 82)
    rounded(draw, row, 10, fill=WHITE, outline=LIGHT_BORDER, width=2)
    rounded(draw, (row[0] + 18, row[1] + 18, row[0] + 160, row[1] + 64), 8, fill=GREEN_FILL, outline=GREEN, width=2)
    centered_text(draw, (row[0] + 18, row[1] + 18, row[0] + 160, row[1] + 64), task_label, 23, fill=GREEN_DARK, bold=True, mono=True)
    draw_text(draw, (row[0] + 184, row[1] + 42), "->", 24, fill=MUTED, mono=True, anchor="lm")
    rounded(draw, (row[0] + 230, row[1] + 18, row[2] - 18, row[1] + 64), 8, fill=BLUE_FILL, outline=BLUE, width=2)
    centered_text(draw, (row[0] + 230, row[1] + 18, row[2] - 18, row[1] + 64), ids, 21, fill=BLUE_DARK, bold=True, mono=True)


def main():
    OUT.parent.mkdir(parents=True, exist_ok=True)

    global img
    img = Image.new("RGBA", (W * S, H * S), WHITE)
    draw = ImageDraw.Draw(img)

    # Very light drafting grid for an engineering drawing feel.
    for x in range(80, W, 80):
        line(draw, [(x, 0), (x, H)], GRID_LINE, width=1)
    for y in range(80, H, 80):
        line(draw, [(0, y), (W, y)], GRID_LINE, width=1)

    storage = (70, 235, 1850, 800)
    shadow(draw, storage, 20)
    rounded(draw, storage, 20, fill=WHITE, outline=GREEN, width=3)
    rounded(draw, (100, 255, 396, 303), 12, fill=GREEN_FILL, outline=GREEN, width=2)
    centered_text(draw, (100, 255, 396, 303), "LogRegistry contract", 25, fill=GREEN_DARK, bold=True)
    draw_text(draw, (126, 322), "on-chain storage", 20, fill=MUTED, anchor="lm")

    # Legend.
    legend = (1290, 70, 1815, 145)
    rounded(draw, legend, 14, fill=WHITE, outline=LIGHT_BORDER, width=2)
    legend_items = [
        (GREEN, "contract data"),
        (ORANGE, "write"),
        (BLUE, "query"),
    ]
    item_x = [1320, 1545, 1695]
    for lx, (color, label) in zip(item_x, legend_items):
        rounded(draw, (lx, 94, lx + 30, 124), 6, fill=color, outline=color)
        draw_text(draw, (lx + 42, 110), label, 21, fill=INK, anchor="lm")

    # Write operation.
    store = (815, 80, 1105, 153)
    shadow(draw, store, 16)
    rounded(draw, store, 16, fill=ORANGE_FILL, outline=ORANGE, width=3)
    centered_text(draw, store, "storeLog", 31, fill=ORANGE_DARK, bold=True, mono=True)

    # Left records array panel.
    left = (120, 340, 590, 720)
    shadow(draw, left, 18)
    rounded(draw, left, 18, fill=PANEL_FILL, outline=GREEN, width=3)
    draw_panel_header(draw, left, "records[]", "sequential LogRecord storage", GREEN_DARK)
    for idx, y in enumerate([425, 520, 615]):
        draw_record_row(draw, left, idx, y)

    # Center LogRecord struct card.
    center = (745, 350, 1175, 710)
    shadow(draw, center, 22)
    rounded(draw, center, 22, fill=GREEN_SOFT, outline=GREEN, width=4)
    rounded(draw, (775, 378, 1145, 447), 14, fill=GREEN_FILL, outline=GREEN, width=2)
    centered_text(draw, (775, 378, 1145, 429), "LogRecord", 38, fill=GREEN_DARK, bold=True, mono=True)
    centered_text(draw, (775, 422, 1145, 447), "struct", 18, fill=MUTED, mono=True)

    fields = ["taskId", "logHash", "createdAt", "submitter"]
    for i, name in enumerate(fields):
        y = 472 + i * 48
        rounded(draw, (795, y, 1125, y + 36), 8, fill=WHITE, outline="#CAD7CB", width=2)
        draw_text(draw, (820, y + 18), name, 24, fill=INK, bold=True, mono=True, anchor="lm")

    # Right taskId to recordIds mapping panel.
    right = (1330, 340, 1800, 720)
    shadow(draw, right, 18)
    rounded(draw, right, 18, fill=PANEL_FILL, outline=GREEN, width=3)
    draw_panel_header(draw, right, "taskIdToRecordIds", "taskId indexes one or more recordId", GREEN_DARK)
    draw_mapping_row(draw, right, 425, "taskId A", "[0, 2]")
    draw_mapping_row(draw, right, 520, "taskId B", "[1]")
    draw_mapping_row(draw, right, 615, "taskId C", "[...]")

    # Structural relation from array entries to the struct definition.
    arrow(draw, [(590, 525), (690, 525), (745, 525)], GREEN, width=4, head=15)
    label_on_line(draw, (670, 493), "element type", GREEN, fill=WHITE, size=19)
    arrow(draw, [(1330, 555), (1235, 555), (1175, 555)], GREEN, width=4, head=15)
    label_on_line(draw, (1255, 523), "recordId index", GREEN, fill=WHITE, size=19)

    # Write arrows from storeLog.
    arrow(draw, [(870, 153), (705, 205), (590, 275), (520, 340)], ORANGE, width=6, head=20)
    label_on_line(draw, (690, 198), "append LogRecord", ORANGE, fill=WHITE, size=22)
    arrow(draw, [(1050, 153), (1215, 205), (1320, 275), (1400, 340)], ORANGE, width=6, head=20)
    label_on_line(draw, (1235, 198), "append recordId", ORANGE, fill=WHITE, size=22)

    # Query operations.
    get_log = (250, 890, 640, 962)
    shadow(draw, get_log, 16)
    rounded(draw, get_log, 16, fill=BLUE_FILL, outline=BLUE, width=3)
    centered_text(draw, get_log, "getLog(recordId)", 28, fill=BLUE_DARK, bold=True, mono=True)

    get_logs = (1240, 890, 1670, 962)
    shadow(draw, get_logs, 16)
    rounded(draw, get_logs, 16, fill=BLUE_FILL, outline=BLUE, width=3)
    centered_text(draw, get_logs, "getLogsByTaskId(taskId)", 25, fill=BLUE_DARK, bold=True, mono=True)

    arrow(draw, [(445, 890), (445, 820), (445, 720)], BLUE, width=6, head=20)
    label_on_line(draw, (610, 842), "read by recordId", BLUE, fill=WHITE, size=21)

    arrow(draw, [(1455, 890), (1455, 835), (1730, 835), (1730, 720)], BLUE, width=6, head=20)
    label_on_line(draw, (1625, 864), "read by taskId", BLUE, fill=WHITE, size=21)

    arrow(draw, [(1510, 720), (1510, 775), (720, 775), (560, 720)], BLUE, width=5, head=18)
    label_on_line(draw, (1060, 748), "recordIds locate records[]", BLUE, fill=WHITE, size=21)

    # Minimal engineering border, no figure caption.
    rect(draw, (38, 38, 1882, 1042), fill=None, outline="#E5E7EB", width=2)

    img = img.convert("RGB").resize((W, H), Image.Resampling.LANCZOS)
    img.save(OUT, "PNG", optimize=True)
    print(OUT)


if __name__ == "__main__":
    main()
