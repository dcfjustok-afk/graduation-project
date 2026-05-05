from pathlib import Path
import math

from PIL import Image, ImageDraw, ImageFont


OUT = Path("image/fig-2-1-blockchain-evidence-structure.png")
WIDTH, HEIGHT = 1920, 1080
SCALE = 2


def s(value):
    if isinstance(value, tuple):
        return tuple(int(round(item * SCALE)) for item in value)
    return int(round(value * SCALE))


def load_font(size, bold=False):
    normal = [
        r"C:\Windows\Fonts\NotoSansSC-VF.ttf",
        r"C:\Windows\Fonts\msyh.ttc",
        r"C:\Windows\Fonts\simhei.ttf",
    ]
    bold_faces = [
        r"C:\Windows\Fonts\msyhbd.ttc",
        r"C:\Windows\Fonts\NotoSansSC-VF.ttf",
        r"C:\Windows\Fonts\simhei.ttf",
    ]
    for path in (bold_faces if bold else normal):
        try:
            return ImageFont.truetype(path, s(size))
        except OSError:
            continue
    return ImageFont.load_default()


FONT = {
    "pill": load_font(20, True),
    "card_title": load_font(25, True),
    "body": load_font(18),
    "small": load_font(17),
    "tiny": load_font(15),
    "process": load_font(23, True),
    "process_small": load_font(18),
    "block_head": load_font(23, True),
    "block_text": load_font(16),
    "mark": load_font(24, True),
}

COLOR = {
    "text": "#1F2937",
    "muted": "#64748B",
    "line": "#CBD5E1",
    "line_dark": "#94A3B8",
    "blue": "#2563EB",
    "blue_dark": "#1D4ED8",
    "blue_soft": "#EFF6FF",
    "blue_border": "#93C5FD",
    "cyan": "#0891B2",
    "cyan_soft": "#ECFEFF",
    "cyan_border": "#67E8F9",
    "green": "#16A34A",
    "green_soft": "#F0FDF4",
    "green_border": "#86EFAC",
    "orange": "#F97316",
    "orange_soft": "#FFF7ED",
    "slate_soft": "#F8FAFC",
    "white": "#FFFFFF",
}


img = Image.new("RGB", (WIDTH * SCALE, HEIGHT * SCALE), "white")
draw = ImageDraw.Draw(img)


def text_size(text, font):
    box = draw.textbbox((0, 0), text, font=font)
    return box[2] - box[0], box[3] - box[1]


def rounded(xy, fill, outline=None, width=1, radius=12):
    draw.rounded_rectangle(
        s(xy),
        radius=s(radius),
        fill=fill,
        outline=outline,
        width=s(width),
    )


def draw_line(points, fill, width=2):
    draw.line([s(point) for point in points], fill=fill, width=s(width), joint="curve")


def draw_text(x, y, text, font, fill=None, spacing=4, anchor=None):
    draw.multiline_text(
        s((x, y)),
        text,
        font=font,
        fill=fill or COLOR["text"],
        spacing=s(spacing),
        anchor=anchor,
    )


def centered(cx, cy, text, font, fill=None, spacing=4):
    lines = text.split("\n")
    widths = []
    heights = []
    for line in lines:
        w, h = text_size(line, font)
        widths.append(w)
        heights.append(h)
    total_height = sum(heights) + s(spacing) * (len(lines) - 1)
    y = s(cy) - total_height / 2
    for index, line in enumerate(lines):
        x = s(cx) - widths[index] / 2
        draw.text((int(x), int(y)), line, font=font, fill=fill or COLOR["text"])
        y += heights[index] + s(spacing)


def arrow(start, end, fill, width=4, head=15):
    x1, y1 = start
    x2, y2 = end
    draw_line([start, end], fill, width)
    angle = math.atan2(y2 - y1, x2 - x1)
    p1 = (x2 + math.cos(angle + math.pi * 0.82) * head, y2 + math.sin(angle + math.pi * 0.82) * head)
    p2 = (x2 + math.cos(angle - math.pi * 0.82) * head, y2 + math.sin(angle - math.pi * 0.82) * head)
    draw.polygon([s(end), s(p1), s(p2)], fill=fill)


def dashed_arrow(start, end, fill, width=3, dash=13, gap=8, head=13):
    x1, y1 = start
    x2, y2 = end
    length = math.hypot(x2 - x1, y2 - y1)
    if length == 0:
        return
    ux = (x2 - x1) / length
    uy = (y2 - y1) / length
    cursor = 0
    while cursor < length - head:
        p1 = (x1 + ux * cursor, y1 + uy * cursor)
        p2 = (x1 + ux * min(cursor + dash, length - head), y1 + uy * min(cursor + dash, length - head))
        draw_line([p1, p2], fill, width)
        cursor += dash + gap
    angle = math.atan2(y2 - y1, x2 - x1)
    p1 = (x2 + math.cos(angle + math.pi * 0.82) * head, y2 + math.sin(angle + math.pi * 0.82) * head)
    p2 = (x2 + math.cos(angle - math.pi * 0.82) * head, y2 + math.sin(angle - math.pi * 0.82) * head)
    draw.polygon([s(end), s(p1), s(p2)], fill=fill)


def dashed_polyline(points, fill, width=3, dash=13, gap=8, head=13):
    for segment_index in range(len(points) - 1):
        start = points[segment_index]
        end = points[segment_index + 1]
        x1, y1 = start
        x2, y2 = end
        length = math.hypot(x2 - x1, y2 - y1)
        if length == 0:
            continue
        ux = (x2 - x1) / length
        uy = (y2 - y1) / length
        is_last = segment_index == len(points) - 2
        segment_limit = max(0, length - (head if is_last else 0))
        cursor = 0
        while cursor < segment_limit:
            p1 = (x1 + ux * cursor, y1 + uy * cursor)
            p2 = (x1 + ux * min(cursor + dash, segment_limit), y1 + uy * min(cursor + dash, segment_limit))
            draw_line([p1, p2], fill, width)
            cursor += dash + gap

    x1, y1 = points[-2]
    x2, y2 = points[-1]
    angle = math.atan2(y2 - y1, x2 - x1)
    p1 = (x2 + math.cos(angle + math.pi * 0.82) * head, y2 + math.sin(angle + math.pi * 0.82) * head)
    p2 = (x2 + math.cos(angle - math.pi * 0.82) * head, y2 + math.sin(angle - math.pi * 0.82) * head)
    draw.polygon([s(points[-1]), s(p1), s(p2)], fill=fill)


def pill(x, y, w, h, label, fill, outline, text_fill):
    rounded((x, y, x + w, y + h), fill, outline, width=2, radius=h / 2)
    centered(x + w / 2, y + h / 2, label, FONT["pill"], text_fill)


def doc_icon(x, y, color):
    rounded((x, y, x + 43, y + 49), COLOR["white"], color, width=2, radius=5)
    draw_line([(x + 10, y + 16), (x + 32, y + 16)], color, width=2)
    draw_line([(x + 10, y + 25), (x + 32, y + 25)], color, width=2)
    draw_line([(x + 10, y + 34), (x + 27, y + 34)], color, width=2)


def decode_check():
    samples = [
        "\u94fe\u4e0b\u4e1a\u52a1\u6570\u636e",
        "SHA-256 \u6458\u8981\u751f\u6210",
        "\u524d\u4e00\u533a\u5757\u54c8\u5e0c",
    ]
    if any("?" in item for item in samples):
        raise RuntimeError("Chinese labels were not decoded correctly.")


decode_check()

# Soft page structure.
draw_line([(70, 705), (1850, 705)], "#E2E8F0", width=1)
draw_line([(70, 1000), (1850, 1000)], "#E2E8F0", width=1)

left_panel = (70, 80, 485, 665)
middle_panel = (540, 80, 1045, 665)
right_panel = (1095, 80, 1850, 665)
bottom_panel = (70, 725, 1850, 1000)

rounded(left_panel, COLOR["blue_soft"], "#BFDBFE", width=2, radius=18)
rounded(middle_panel, COLOR["cyan_soft"], "#A5F3FC", width=2, radius=18)
rounded(right_panel, COLOR["green_soft"], "#BBF7D0", width=2, radius=18)
rounded(bottom_panel, COLOR["white"], "#D1D5DB", width=2, radius=18)

pill(100, 105, 205, 44, "\u94fe\u4e0b\u4e1a\u52a1\u6570\u636e", COLOR["white"], COLOR["blue_border"], COLOR["blue_dark"])
pill(570, 105, 255, 44, "\u6458\u8981\u751f\u6210\u4e0e\u4ea4\u6613\u63d0\u4ea4", COLOR["white"], COLOR["cyan_border"], COLOR["cyan"])
pill(1125, 105, 250, 44, "\u533a\u5757\u94fe\u5b58\u8bc1\u7ed3\u6784", COLOR["white"], COLOR["green_border"], COLOR["green"])
pill(100, 747, 205, 44, "\u540e\u7eed\u5ba1\u8ba1\u6821\u9a8c", COLOR["white"], "#FDBA74", COLOR["orange"])

# Left: off-chain business data.
cards = [
    ("\u65e5\u5fd7\u539f\u6587", "\u64cd\u4f5c\u65f6\u95f4\u3001\u7528\u6237\u3001\u4e8b\u4ef6", "#DBEAFE", COLOR["blue"]),
    ("\u6570\u636e\u5e93\u8bb0\u5f55", "\u4e1a\u52a1\u8868\u8bb0\u5f55\u3001\u5173\u952e\u5b57\u6bb5", "#E0F2FE", COLOR["cyan"]),
    ("\u4e1a\u52a1\u6807\u8bc6", "\u4e1a\u52a1\u7f16\u53f7\u3001\u5bf9\u8c61 ID\u3001\u6765\u6e90", "#DCFCE7", COLOR["green"]),
    ("\u91c7\u96c6\u5143\u6570\u636e", "\u6587\u4ef6\u540d\u3001\u5927\u5c0f\u3001\u91c7\u96c6\u65f6\u95f4", COLOR["slate_soft"], "#94A3B8"),
]
for index, (title, body, fill, accent) in enumerate(cards):
    y = 185 + index * 108
    rounded((118, y, 438, y + 92), COLOR["white"], "#BFDBFE", width=2, radius=12)
    draw.rounded_rectangle(s((118, y, 127, y + 92)), radius=s(8), fill=accent)
    doc_icon(140, y + 22, accent)
    draw_text(200, y + 19, title, FONT["card_title"], COLOR["text"])
    draw_text(200, y + 57, body, FONT["body"], COLOR["muted"])

rounded((118, 610, 438, 638), COLOR["white"], "#BFDBFE", width=1, radius=14)
centered(278, 624, "\u539f\u59cb\u6570\u636e\u4e0d\u76f4\u63a5\u5199\u5165\u533a\u5757\u94fe", FONT["small"], COLOR["muted"])

# Middle: hash generation and transaction submission.
processes = [
    ("\u8bfb\u53d6\u5f85\u5b58\u8bc1\u6570\u636e", "\u9009\u53d6\u5173\u952e\u5b57\u6bb5\u4e0e\u4e1a\u52a1\u6807\u8bc6", COLOR["blue"]),
    ("SHA-256 \u6458\u8981\u751f\u6210", "\u5f97\u5230\u56fa\u5b9a\u957f\u5ea6\u54c8\u5e0c\u503c", COLOR["cyan"]),
    ("\u6784\u9020\u5b58\u8bc1\u4ea4\u6613", "\u5199\u5165\u6458\u8981\u3001\u65f6\u95f4\u6233\u7b49\u4fe1\u606f", COLOR["green"]),
    ("\u63d0\u4ea4\u533a\u5757\u94fe\u7f51\u7edc", "\u4ea4\u6613\u6253\u5305\u8fdb\u5165\u65b0\u533a\u5757", COLOR["blue_dark"]),
]
for index, (title, body, accent) in enumerate(processes):
    y = 180 + index * 110
    rounded((615, y, 970, y + 86), COLOR["white"], "#A5F3FC", width=2, radius=16)
    draw.ellipse(s((637, y + 22, 679, y + 64)), fill=accent)
    centered(658, y + 43, str(index + 1), FONT["mark"], "white")
    draw_text(700, y + 18, title, FONT["process"], COLOR["text"])
    draw_text(700, y + 55, body, FONT["process_small"], COLOR["muted"])
    if index < 3:
        arrow((792, y + 92), (792, y + 103), COLOR["cyan"], width=3, head=10)

arrow((485, 372), (600, 372), COLOR["blue"], width=5, head=18)
arrow((1045, 372), (1110, 372), COLOR["green"], width=5, head=18)

# Right: blockchain blocks.
blocks = [
    ("\u533a\u5757 1", "\u4ea4\u6613\u6458\u8981\uff1aH1\n\u65f6\u95f4\u6233\uff1aT1\n\u533a\u5757\u54c8\u5e0c\uff1aBH1\n\u524d\u5757\u54c8\u5e0c\uff1aBH0"),
    ("\u533a\u5757 2", "\u4ea4\u6613\u6458\u8981\uff1aH2\n\u65f6\u95f4\u6233\uff1aT2\n\u533a\u5757\u54c8\u5e0c\uff1aBH2\n\u524d\u5757\u54c8\u5e0c\uff1aBH1"),
    ("\u533a\u5757 3", "\u4ea4\u6613\u6458\u8981\uff1aH3\n\u65f6\u95f4\u6233\uff1aT3\n\u533a\u5757\u54c8\u5e0c\uff1aBH3\n\u524d\u5757\u54c8\u5e0c\uff1aBH2"),
    ("\u533a\u5757 4", "\u4ea4\u6613\u6458\u8981\uff1aH4\n\u65f6\u95f4\u6233\uff1aT4\n\u533a\u5757\u54c8\u5e0c\uff1aBH4\n\u524d\u5757\u54c8\u5e0c\uff1aBH3"),
]
block_x0 = 1127
block_y = 202
block_w = 148
block_h = 350
block_gap = 42
for index, (heading, body) in enumerate(blocks):
    x = block_x0 + index * (block_w + block_gap)
    rounded((x + 5, block_y + 7, x + block_w + 5, block_y + block_h + 7), "#E2E8F0", None, width=0, radius=14)
    rounded((x, block_y, x + block_w, block_y + block_h), COLOR["white"], COLOR["green_border"], width=2, radius=14)
    draw.rounded_rectangle(s((x, block_y, x + block_w, block_y + 58)), radius=s(14), fill="#DCFCE7")
    draw.rectangle(s((x, block_y + 36, x + block_w, block_y + 58)), fill="#DCFCE7")
    centered(x + block_w / 2, block_y + 29, heading, FONT["block_head"], COLOR["green"])
    for row in range(3):
        y = block_y + 106 + row * 58
        draw_line([(x + 18, y), (x + block_w - 18, y)], "#E2E8F0", width=1)
    draw_text(x + 17, block_y + 80, body, FONT["block_text"], COLOR["text"], spacing=12)
    rounded((x + 18, block_y + 286, x + block_w - 18, block_y + 322), COLOR["slate_soft"], "#E2E8F0", width=1, radius=8)
    centered(x + block_w / 2, block_y + 304, "\u94fe\u5f0f\u5f15\u7528", FONT["tiny"], COLOR["muted"])
    if index < 3:
        arrow((x + block_w + 7, block_y + block_h / 2), (x + block_w + block_gap - 7, block_y + block_h / 2), COLOR["green"], width=3, head=11)

rounded((1148, 585, 1805, 626), COLOR["white"], "#BBF7D0", width=1, radius=18)
centered(
    1476,
    606,
    "\u540e\u4e00\u533a\u5757\u8bb0\u5f55\u524d\u4e00\u533a\u5757\u54c8\u5e0c\uff0c\u5f62\u6210\u94fe\u5f0f\u5173\u8054",
    FONT["small"],
    COLOR["muted"],
)

arrow((970, 552), (1128, 455), COLOR["cyan"], width=3, head=12)

# Bottom: later audit verification.
audit_nodes = [
    (130, 210, "\u8bfb\u53d6\u94fe\u4e0b\u6570\u636e", "\u65e5\u5fd7\u3001\u8bb0\u5f55\u3001\u4e1a\u52a1\u6807\u8bc6", COLOR["blue"], COLOR["blue_soft"]),
    (410, 240, "\u91cd\u65b0\u8ba1\u7b97\u6458\u8981", "SHA-256(data)", COLOR["cyan"], COLOR["cyan_soft"]),
    (735, 240, "\u67e5\u8be2\u94fe\u4e0a\u8bb0\u5f55", "\u83b7\u53d6\u4ea4\u6613\u6458\u8981", COLOR["green"], COLOR["green_soft"]),
    (1070, 210, "\u6458\u8981\u6bd4\u5bf9", "\u672c\u5730\u6458\u8981 = \u94fe\u4e0a\u6458\u8981", COLOR["orange"], COLOR["orange_soft"]),
    (1360, 230, "\u6821\u9a8c\u7ed3\u679c", "\u4e00\u81f4\uff1a\u6570\u636e\u672a\u88ab\u7be1\u6539", COLOR["green"], COLOR["green_soft"]),
]
node_y = 835
node_h = 78
for index, (x, w, title, body, accent, fill) in enumerate(audit_nodes):
    rounded((x, node_y, x + w, node_y + node_h), fill, accent, width=2, radius=14)
    centered(x + w / 2, node_y + 28, title, FONT["card_title"], accent)
    centered(x + w / 2, node_y + 58, body, FONT["small"], COLOR["muted"])
    if index < len(audit_nodes) - 1:
        next_x = audit_nodes[index + 1][0]
        arrow((x + w + 12, node_y + node_h / 2), (next_x - 12, node_y + node_h / 2), COLOR["line_dark"], width=3, head=12)

rounded((1630, 835, 1778, 913), COLOR["orange_soft"], COLOR["orange"], width=2, radius=14)
centered(1704, 864, "\u5f02\u5e38\u5904\u7406", FONT["card_title"], COLOR["orange"])
centered(1704, 895, "\u4e0d\u4e00\u81f4\uff1a\u9700\u590d\u6838", FONT["small"], COLOR["muted"])
arrow((1590, node_y + node_h / 2), (1620, node_y + node_h / 2), COLOR["orange"], width=3, head=12)

dashed_polyline([(277, 665), (345, 725), (345, 810), (235, 830)], COLOR["blue"], width=3, dash=12, gap=9, head=12)
dashed_polyline([(1480, 665), (1325, 715), (980, 795), (855, 830)], COLOR["green"], width=3, dash=14, gap=9, head=12)

OUT.parent.mkdir(parents=True, exist_ok=True)
img = img.resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS)
img.save(OUT, "PNG", optimize=True)
print(OUT.resolve())
print(img.size)
