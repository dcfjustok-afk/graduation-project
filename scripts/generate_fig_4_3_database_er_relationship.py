from __future__ import annotations

import math
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "image" / "fig-4-3-database-er-relationship.png"

W, H = 1920, 1080
S = 2

WHITE = "#FFFFFF"
INK = "#1F2937"
MUTED = "#64748B"
BORDER = "#B7C5D8"
ROW_LINE = "#E1E8F0"
HEADER_FILL = "#EEF6FF"
HEADER_STROKE = "#2F5D8C"
TABLE_FILL = "#FFFFFF"
ROW_ALT = "#FAFCFF"
GRID_LINE = "#F3F6FA"

PK_FILL = "#EAF3FF"
PK_STROKE = "#2563EB"
PK_TEXT = "#1D4ED8"
FK_FILL = "#FFF7E6"
FK_STROKE = "#D97706"
FK_TEXT = "#B45309"

REL_BLUE = "#2563EB"
REL_TEAL = "#0891B2"
REL_AMBER = "#D97706"
REL_RED = "#DC2626"

HEADER_H = 64
TOP_PAD = 12
ROW_H = 40
BOTTOM_PAD = 16
DRAW_RELATION_LABELS = False


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
        r"C:\Windows\Fonts\segoeui.ttf",
        r"C:\Windows\Fonts\arial.ttf",
    ]
)
UI_BOLD = find_font(
    [
        r"C:\Windows\Fonts\msyhbd.ttc",
        r"C:\Windows\Fonts\NotoSansSC-VF.ttf",
        r"C:\Windows\Fonts\segoeuib.ttf",
        r"C:\Windows\Fonts\arialbd.ttf",
    ]
)
MONO_FONT = find_font(
    [
        r"C:\Windows\Fonts\consola.ttf",
        r"C:\Windows\Fonts\cour.ttf",
        r"C:\Windows\Fonts\segoeui.ttf",
    ]
)
MONO_BOLD = find_font(
    [
        r"C:\Windows\Fonts\consolab.ttf",
        r"C:\Windows\Fonts\courbd.ttf",
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


def rect(draw: ImageDraw.ImageDraw, box, fill, outline=None, width: int = 1):
    draw.rectangle(sc(box), fill=fill, outline=outline, width=sc(width))


def rounded(draw: ImageDraw.ImageDraw, box, radius: int, fill, outline=None, width: int = 1):
    draw.rounded_rectangle(sc(box), radius=sc(radius), fill=fill, outline=outline, width=sc(width))


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


def draw_shadow(draw: ImageDraw.ImageDraw, base: Image.Image, box):
    x1, y1, x2, y2 = box
    for offset, alpha in [(5, 14), (9, 8)]:
        overlay = Image.new("RGBA", (W * S, H * S), (0, 0, 0, 0))
        od = ImageDraw.Draw(overlay)
        od.rectangle(sc((x1 + offset, y1 + offset, x2 + offset, y2 + offset)), fill=(31, 41, 55, alpha))
        base.alpha_composite(overlay)


@dataclass(frozen=True)
class Table:
    name: str
    x: int
    y: int
    w: int
    fields: tuple[str, ...]
    fks: tuple[str, ...] = ()
    note: str | None = None

    @property
    def h(self) -> int:
        return HEADER_H + TOP_PAD + len(self.fields) * ROW_H + BOTTOM_PAD

    @property
    def box(self) -> tuple[int, int, int, int]:
        return self.x, self.y, self.x + self.w, self.y + self.h

    def field_y(self, field: str) -> float:
        idx = self.fields.index(field)
        return self.y + HEADER_H + TOP_PAD + idx * ROW_H + ROW_H / 2

    def anchor(self, field: str, side: str, y_offset: int = 0) -> tuple[float, float]:
        y = self.field_y(field) + y_offset
        if side == "left":
            return self.x, y
        if side == "right":
            return self.x + self.w, y
        raise ValueError(side)


TABLES = {
    "logs": Table(
        "logs",
        90,
        125,
        430,
        (
            "id",
            "task_id",
            "source_type",
            "source_path",
            "log_content",
            "log_level",
            "collected_at",
            "status",
        ),
    ),
    "log_hash_records": Table(
        "log_hash_records",
        700,
        85,
        540,
        (
            "id",
            "log_id",
            "task_id",
            "log_hash",
            "contract_address",
            "transaction_hash",
            "block_number",
            "on_chain_status",
        ),
        fks=("log_id",),
    ),
    "audit_records": Table(
        "audit_records",
        1380,
        175,
        460,
        (
            "id",
            "log_id",
            "log_hash_record_id",
            "audit_status",
            "expected_hash",
            "actual_hash",
            "audited_at",
        ),
        fks=("log_hash_record_id",),
    ),
    "alerts": Table(
        "alerts",
        1320,
        650,
        500,
        (
            "id",
            "alert_type",
            "related_log_id",
            "related_audit_id",
            "severity",
            "status",
        ),
        fks=("related_log_id", "related_audit_id"),
    ),
    "agent_states": Table(
        "agent_states",
        90,
        650,
        550,
        (
            "id",
            "source_path",
            "last_offset",
            "last_heartbeat_at",
            "last_sync_at",
            "status",
        ),
        note="用于记录 Agent 状态",
    ),
}


RELATIONSHIPS = (
    (
        "logs",
        "id",
        "log_hash_records",
        "log_id",
        REL_BLUE,
        [(520, 221), (700, 221)],
        "log_id",
        (610, 196),
    ),
    (
        "log_hash_records",
        "id",
        "audit_records",
        "log_hash_record_id",
        REL_TEAL,
        [(1240, 181), (1290, 181), (1290, 351), (1380, 351)],
        "log_hash_record_id",
        (1298, 262),
    ),
    (
        "logs",
        "id",
        "alerts",
        "related_log_id",
        REL_AMBER,
        [(520, 229), (560, 229), (560, 590), (1230, 590), (1230, 826), (1320, 826)],
        "related_log_id",
        (960, 568),
    ),
    (
        "audit_records",
        "id",
        "alerts",
        "related_audit_id",
        REL_RED,
        [(1840, 271), (1880, 271), (1880, 866), (1820, 866)],
        "related_audit_id",
        (1810, 596),
    ),
)


def draw_badge(draw: ImageDraw.ImageDraw, x: int, cy: float, label: str, fill: str, stroke: str, color: str):
    box = (x, cy - 12, x + 42, cy + 12)
    rounded(draw, box, 4, fill=fill, outline=stroke, width=1)
    draw_text(draw, (x + 21, cy + 1), label, 14, fill=color, bold=True, mono=True, anchor="mm")


def draw_table(draw: ImageDraw.ImageDraw, base: Image.Image, table: Table):
    x1, y1, x2, y2 = table.box
    draw_shadow(draw, base, table.box)
    rect(draw, table.box, fill=TABLE_FILL, outline=BORDER, width=2)
    rect(draw, (x1, y1, x2, y1 + HEADER_H), fill=HEADER_FILL, outline=HEADER_STROKE, width=2)
    draw_text(draw, (x1 + 24, y1 + HEADER_H / 2 + 1), table.name, 28, fill=HEADER_STROKE, bold=True, mono=True, anchor="lm")
    if table.note:
        note_font = font(20, bold=True)
        tw, th = text_size(draw, table.note, note_font)
        note_box = (x2 - tw / S - 42, y1 + 17, x2 - 20, y1 + 47)
        rounded(draw, note_box, 5, fill="#F8FAFC", outline="#CBD5E1", width=1)
        draw.text(sc(((note_box[0] + note_box[2]) / 2, (note_box[1] + note_box[3]) / 2 + 1)), table.note, font=note_font, fill=MUTED, anchor="mm")

    rows_top = y1 + HEADER_H + TOP_PAD
    for idx, field in enumerate(table.fields):
        row_top = rows_top + idx * ROW_H
        row_bottom = row_top + ROW_H
        if idx % 2 == 1:
            rect(draw, (x1 + 1, row_top, x2 - 1, row_bottom), fill=ROW_ALT, outline=None)
        rect(draw, (x1, row_bottom, x2, row_bottom + 1), fill=ROW_LINE, outline=None)
        cy = (row_top + row_bottom) / 2
        if field == "id":
            draw_badge(draw, x1 + 20, cy, "PK", PK_FILL, PK_STROKE, PK_TEXT)
        elif field in table.fks:
            draw_badge(draw, x1 + 20, cy, "FK", FK_FILL, FK_STROKE, FK_TEXT)
        else:
            rect(draw, (x1 + 20, cy - 1, x1 + 62, cy + 1), fill="#D8E0EA", outline=None)
        draw_text(draw, (x1 + 80, cy + 1), field, 23, fill=INK, mono=True, anchor="lm")


def arrow_head(draw: ImageDraw.ImageDraw, p1, p2, color: str, size: int = 16):
    x1, y1 = sc(p1)
    x2, y2 = sc(p2)
    angle = math.atan2(y2 - y1, x2 - x1)
    h = sc(size)
    wing = math.radians(31)
    p3 = (x2 - h * math.cos(angle - wing), y2 - h * math.sin(angle - wing))
    p4 = (x2 - h * math.cos(angle + wing), y2 - h * math.sin(angle + wing))
    draw.polygon([(x2, y2), p3, p4], fill=color)


def draw_relation(draw: ImageDraw.ImageDraw, route, color: str):
    scaled = [sc(p) for p in route]
    draw.line(scaled, fill=color, width=sc(3), joint="curve")
    sx, sy = sc(route[0])
    draw.ellipse((sx - sc(5), sy - sc(5), sx + sc(5), sy + sc(5)), fill=WHITE, outline=color, width=sc(3))
    arrow_head(draw, route[-2], route[-1], color)


def draw_label(draw: ImageDraw.ImageDraw, center, label: str, color: str):
    fnt = font(18, bold=True, mono=True)
    tw, th = text_size(draw, label, fnt)
    cx, cy = sc(center)
    padx, pady = sc(12), sc(7)
    box = (cx - tw // 2 - padx, cy - th // 2 - pady, cx + tw // 2 + padx, cy + th // 2 + pady)
    draw.rounded_rectangle(box, radius=sc(5), fill=WHITE, outline=color, width=sc(2))
    draw.text((cx, cy + sc(1)), label, font=fnt, fill=color, anchor="mm")


def main():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    img = Image.new("RGBA", (W * S, H * S), WHITE)
    draw = ImageDraw.Draw(img)

    for x in range(80, W, 80):
        rect(draw, (x, 0, x + 1, H), fill=GRID_LINE, outline=None)
    for y in range(80, H, 80):
        rect(draw, (0, y, W, y + 1), fill=GRID_LINE, outline=None)

    for table in TABLES.values():
        draw_table(draw, img, table)

    for _, _, _, _, color, route, label, center in RELATIONSHIPS:
        draw_relation(draw, route, color)
        if DRAW_RELATION_LABELS:
            draw_label(draw, center, label, color)

    img = img.resize((W, H), Image.Resampling.LANCZOS).convert("RGB")
    img.save(OUT, "PNG", optimize=True)
    print(OUT)


if __name__ == "__main__":
    main()
