from __future__ import annotations

from pathlib import Path
from typing import Callable

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[2]
ASSET_ROOT = ROOT / "docs/design/ui/assets/icons"
RUNTIME_ROOT = ASSET_ROOT / "runtime"
PREVIEW_ROOT = ASSET_ROOT / "preview/runtime-v1"
MASTER_SIZE = 512
OUTPUT_SIZE = 128

FONT_BOLD = Path("C:/Windows/Fonts/seguisb.ttf")
FONT_UI = Path("C:/Windows/Fonts/msyh.ttc")


def font(path: Path, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(path), size)


def gradient(size: int, top: tuple[int, int, int], bottom: tuple[int, int, int]) -> Image.Image:
    image = Image.new("RGBA", (size, size))
    px = image.load()
    for y in range(size):
        t = y / max(size - 1, 1)
        color = tuple(round(top[i] * (1 - t) + bottom[i] * t) for i in range(3)) + (255,)
        for x in range(size):
            px[x, y] = color
    return image


def paint(
    canvas: Image.Image,
    mask: Image.Image,
    top: tuple[int, int, int],
    bottom: tuple[int, int, int],
    *,
    outline: int = 12,
    glow: int = 20,
) -> None:
    if glow:
        glow_mask = mask.filter(ImageFilter.GaussianBlur(glow)).point(lambda p: round(p * 0.32))
        glow_layer = Image.new("RGBA", canvas.size, (*top, 0))
        glow_layer.putalpha(glow_mask)
        canvas.alpha_composite(glow_layer)

    expanded = mask.filter(ImageFilter.MaxFilter(outline * 2 + 1))
    rim = Image.new("RGBA", canvas.size, (255, 255, 255, 0))
    rim.putalpha(expanded)
    canvas.alpha_composite(rim)

    fill = gradient(MASTER_SIZE, top, bottom)
    fill.putalpha(mask)
    canvas.alpha_composite(fill)


def mask_from(draw_fn: Callable[[ImageDraw.ImageDraw], None]) -> Image.Image:
    mask = Image.new("L", (MASTER_SIZE, MASTER_SIZE), 0)
    draw_fn(ImageDraw.Draw(mask))
    return mask


def add_white(canvas: Image.Image, draw_fn: Callable[[ImageDraw.ImageDraw], None]) -> None:
    layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    draw_fn(ImageDraw.Draw(layer))
    canvas.alpha_composite(layer)


def text_mask(value: str, face: Path, size: int, center: tuple[int, int]) -> Image.Image:
    f = font(face, size)
    mask = Image.new("L", (MASTER_SIZE, MASTER_SIZE), 0)
    d = ImageDraw.Draw(mask)
    box = d.textbbox((0, 0), value, font=f, stroke_width=0)
    x = center[0] - (box[2] - box[0]) / 2 - box[0]
    y = center[1] - (box[3] - box[1]) / 2 - box[1]
    d.text((x, y), value, font=f, fill=255)
    return mask


def sparkle_mask(cx: int, cy: int, r: int = 42) -> Image.Image:
    return mask_from(
        lambda d: d.polygon(
            [(cx, cy - r), (cx + r // 3, cy - r // 3), (cx + r, cy),
             (cx + r // 3, cy + r // 3), (cx, cy + r),
             (cx - r // 3, cy + r // 3), (cx - r, cy),
             (cx - r // 3, cy - r // 3)],
            fill=255,
        )
    )


def icon_calendar() -> Image.Image:
    c = Image.new("RGBA", (MASTER_SIZE, MASTER_SIZE), (0, 0, 0, 0))
    body = mask_from(lambda d: d.rounded_rectangle((100, 140, 412, 430), 54, fill=255))
    paint(c, body, (32, 220, 255), (0, 111, 241))
    for x in (168, 294):
        tab = mask_from(lambda d, x=x: d.rounded_rectangle((x, 72, x + 52, 184), 24, fill=255))
        paint(c, tab, (83, 237, 255), (17, 118, 235), outline=9, glow=10)
    add_white(c, lambda d: [d.ellipse((x - 25, 280, x + 25, 330), fill="white") for x in (180, 256, 332)])
    return c


def icon_instant() -> Image.Image:
    c = Image.new("RGBA", (MASTER_SIZE, MASTER_SIZE), (0, 0, 0, 0))
    circle = mask_from(lambda d: d.ellipse((78, 78, 434, 434), fill=255))
    paint(c, circle, (255, 112, 76), (239, 47, 57), outline=11, glow=22)
    f = font(FONT_BOLD, 188)
    add_white(c, lambda d: d.text((256, 254), "1×", font=f, fill="white", anchor="mm", stroke_width=2))
    return c


def icon_detail() -> Image.Image:
    c = Image.new("RGBA", (MASTER_SIZE, MASTER_SIZE), (0, 0, 0, 0))
    ring = mask_from(lambda d: d.ellipse((90, 70, 350, 330), outline=255, width=58))
    handle = mask_from(lambda d: d.line((320, 305, 430, 415), fill=255, width=68))
    paint(c, ring, (42, 229, 255), (0, 118, 237))
    paint(c, handle, (42, 229, 255), (0, 118, 237), outline=11)
    return c


def icon_turn_income() -> Image.Image:
    c = Image.new("RGBA", (MASTER_SIZE, MASTER_SIZE), (0, 0, 0, 0))
    coin = mask_from(lambda d: d.ellipse((142, 142, 370, 370), fill=255))
    paint(c, coin, (255, 225, 57), (247, 146, 10), outline=10, glow=12)
    add_white(c, lambda d: d.ellipse((165, 165, 347, 347), outline=(255, 246, 178, 255), width=8))
    add_white(c, lambda d: d.text((256, 254), "$", font=font(FONT_BOLD, 132), fill="white", anchor="mm"))

    arrow_mask = Image.new("L", (MASTER_SIZE, MASTER_SIZE), 0)
    d = ImageDraw.Draw(arrow_mask)
    d.arc((74, 66, 438, 438), 205, 330, fill=255, width=36)
    d.arc((74, 66, 438, 438), 25, 150, fill=255, width=36)
    d.polygon([(402, 148), (445, 151), (426, 110)], fill=255)
    d.polygon([(110, 360), (67, 361), (88, 403)], fill=255)
    paint(c, arrow_mask, (63, 224, 255), (0, 118, 239), outline=8, glow=10)
    return c


def icon_continuous_decrease() -> Image.Image:
    c = Image.new("RGBA", (MASTER_SIZE, MASTER_SIZE), (0, 0, 0, 0))
    zig = Image.new("L", c.size, 0)
    d = ImageDraw.Draw(zig)
    d.line([(95, 130), (205, 256), (267, 220), (375, 348)], fill=255, width=56, joint="curve")
    d.polygon([(342, 334), (410, 388), (389, 304)], fill=255)
    paint(c, zig, (255, 116, 70), (244, 53, 40), outline=11, glow=18)
    baseline = mask_from(lambda d: d.rounded_rectangle((120, 410, 392, 435), 12, fill=255))
    paint(c, baseline, (180, 239, 255), (76, 175, 248), outline=7, glow=7)
    return c


def icon_confirm() -> Image.Image:
    c = Image.new("RGBA", (MASTER_SIZE, MASTER_SIZE), (0, 0, 0, 0))
    check = Image.new("L", c.size, 0)
    d = ImageDraw.Draw(check)
    d.line([(105, 260), (214, 371), (414, 143)], fill=255, width=74, joint="curve")
    paint(c, check, (99, 247, 195), (0, 166, 111), outline=12, glow=20)
    return c


def icon_funds() -> Image.Image:
    c = Image.new("RGBA", (MASTER_SIZE, MASTER_SIZE), (0, 0, 0, 0))
    coin = mask_from(lambda d: d.ellipse((80, 80, 432, 432), fill=255))
    paint(c, coin, (255, 225, 68), (247, 146, 10), outline=12, glow=18)
    add_white(c, lambda d: d.ellipse((112, 112, 400, 400), outline=(255, 248, 190, 255), width=10))
    add_white(c, lambda d: d.text((256, 254), "$", font=font(FONT_BOLD, 200), fill="white", anchor="mm"))
    return c


def icon_energy() -> Image.Image:
    c = Image.new("RGBA", (MASTER_SIZE, MASTER_SIZE), (0, 0, 0, 0))
    bolt = mask_from(lambda d: d.polygon([(258, 50), (140, 276), (238, 276), (190, 462), (384, 218), (278, 218), (343, 50)], fill=255))
    paint(c, bolt, (44, 229, 255), (0, 116, 242), outline=13, glow=23)
    return c


def icon_exp() -> Image.Image:
    c = Image.new("RGBA", (MASTER_SIZE, MASTER_SIZE), (0, 0, 0, 0))
    text = text_mask("EXP", FONT_BOLD, 176, (256, 257))
    paint(c, text, (239, 92, 255), (118, 42, 226), outline=13, glow=20)
    return c


def icon_build() -> Image.Image:
    c = Image.new("RGBA", (MASTER_SIZE, MASTER_SIZE), (0, 0, 0, 0))
    hammer = Image.new("L", c.size, 0)
    d = ImageDraw.Draw(hammer)
    d.rounded_rectangle((205, 178, 275, 444), 28, fill=255)
    d.rounded_rectangle((128, 82, 386, 200), 35, fill=255)
    hammer = hammer.rotate(-42, resample=Image.Resampling.BICUBIC, center=(256, 256))
    paint(c, hammer, (255, 190, 39), (243, 104, 8), outline=12, glow=19)
    return c


def icon_upgrade() -> Image.Image:
    c = Image.new("RGBA", (MASTER_SIZE, MASTER_SIZE), (0, 0, 0, 0))
    chevron = Image.new("L", c.size, 0)
    d = ImageDraw.Draw(chevron)
    d.line([(104, 318), (256, 165), (408, 318)], fill=255, width=75, joint="curve")
    paint(c, chevron, (81, 244, 203), (0, 177, 139), outline=12, glow=18)
    spark = sparkle_mask(390, 390, 42)
    paint(c, spark, (116, 255, 221), (15, 197, 146), outline=8, glow=10)
    return c


def icon_lock() -> Image.Image:
    c = Image.new("RGBA", (MASTER_SIZE, MASTER_SIZE), (0, 0, 0, 0))
    shackle = mask_from(lambda d: d.arc((150, 56, 362, 290), 180, 360, fill=255, width=58))
    body = mask_from(lambda d: d.rounded_rectangle((112, 214, 400, 428), 40, fill=255))
    paint(c, shackle, (202, 119, 255), (112, 51, 225), outline=11, glow=15)
    paint(c, body, (189, 93, 255), (96, 37, 218), outline=11, glow=15)
    add_white(c, lambda d: (d.ellipse((233, 292, 279, 338), fill="white"), d.rounded_rectangle((246, 320, 266, 374), 9, fill="white")))
    return c


def icon_complete() -> Image.Image:
    c = Image.new("RGBA", (MASTER_SIZE, MASTER_SIZE), (0, 0, 0, 0))
    pole = mask_from(lambda d: d.rounded_rectangle((116, 80, 154, 438), 18, fill=255))
    flag = mask_from(lambda d: d.polygon([(148, 105), (385, 105), (350, 198), (385, 292), (148, 292)], fill=255))
    paint(c, pole, (102, 248, 191), (3, 168, 102), outline=9, glow=12)
    paint(c, flag, (96, 244, 180), (0, 176, 104), outline=10, glow=16)
    spark = sparkle_mask(390, 380, 38)
    paint(c, spark, (128, 255, 211), (20, 189, 127), outline=7, glow=9)
    return c


def icon_warning() -> Image.Image:
    c = Image.new("RGBA", (MASTER_SIZE, MASTER_SIZE), (0, 0, 0, 0))
    triangle = Image.new("L", c.size, 0)
    d = ImageDraw.Draw(triangle)
    d.polygon([(256, 72), (454, 420), (58, 420)], fill=255)
    triangle = triangle.filter(ImageFilter.GaussianBlur(2))
    paint(c, triangle, (255, 106, 66), (238, 45, 47), outline=12, glow=20)
    add_white(c, lambda d: (d.rounded_rectangle((234, 180, 278, 320), 20, fill="white"), d.ellipse((232, 344, 280, 392), fill="white")))
    return c


GENERATED = {
    "common/icon-calendar-v1.png": icon_calendar,
    "common/icon-instant-v1.png": icon_instant,
    "common/icon-detail-v1.png": icon_detail,
    "common/icon-turn-income-v1.png": icon_turn_income,
    "common/icon-continuous-decrease-v1.png": icon_continuous_decrease,
    "common/icon-confirm-v1.png": icon_confirm,
    "resources/icon-funds-v1.png": icon_funds,
    "resources/icon-energy-v1.png": icon_energy,
    "resources/icon-company-exp-v1.png": icon_exp,
    "action-state/icon-build-v1.png": icon_build,
    "action-state/icon-upgrade-v1.png": icon_upgrade,
    "action-state/icon-lock-v1.png": icon_lock,
    "action-state/icon-complete-v1.png": icon_complete,
    "action-state/icon-warning-v1.png": icon_warning,
}


COPIED = {
    "level/icon-level-01-blue-v1.png": ASSET_ROOT / "level/icon-level-01-blue-v1.png",
    "level/icon-level-02-green-v1.png": ASSET_ROOT / "level/icon-level-02-green-v1.png",
    "level/icon-level-03-yellow-v1.png": ASSET_ROOT / "level/icon-level-03-yellow-v1.png",
    "level/icon-level-04-orange-v1.png": ASSET_ROOT / "level/icon-level-04-orange-v1.png",
    "level/icon-level-05-red-v1.png": ASSET_ROOT / "level/icon-level-05-red-v1.png",
    "tech-point/icon-tech-point-normal-v1.png": ASSET_ROOT / "tech-point/icon-tech-point-normal-v1.png",
    "tech-point/icon-tech-point-selected-v1.png": ASSET_ROOT / "tech-point/icon-tech-point-selected-v1.png",
    "tech-point/icon-tech-point-locked-v1.png": ASSET_ROOT / "tech-point/icon-tech-point-locked-v1.png",
    "clean-supply/icon-clean-supply-fully-clean-v1.png": ASSET_ROOT / "source/clean-supply-fully-clean-master-v1-alpha.png",
    "clean-supply/icon-clean-supply-needs-improvement-v1.png": ASSET_ROOT / "source/clean-supply-needs-improvement-master-v1-alpha.png",
}


LABELS = {
    "icon-calendar-v1.png": "日历 A",
    "icon-instant-v1.png": "即时 A",
    "icon-detail-v1.png": "详情 A",
    "icon-turn-income-v1.png": "回合收入 B",
    "icon-continuous-decrease-v1.png": "持续减少 A",
    "icon-confirm-v1.png": "确认 A",
    "icon-funds-v1.png": "资金",
    "icon-energy-v1.png": "电力",
    "icon-company-exp-v1.png": "公司 EXP",
    "icon-build-v1.png": "建设 B",
    "icon-upgrade-v1.png": "升级 A",
    "icon-lock-v1.png": "锁定 A",
    "icon-complete-v1.png": "完成 A",
    "icon-warning-v1.png": "警告 A",
    "icon-level-01-blue-v1.png": "等级 I",
    "icon-level-02-green-v1.png": "等级 II",
    "icon-level-03-yellow-v1.png": "等级 III",
    "icon-level-04-orange-v1.png": "等级 IV",
    "icon-level-05-red-v1.png": "等级 V",
    "icon-tech-point-normal-v1.png": "科技点",
    "icon-tech-point-selected-v1.png": "科技点选中",
    "icon-tech-point-locked-v1.png": "科技点锁定",
    "icon-clean-supply-fully-clean-v1.png": "完全清洁",
    "icon-clean-supply-needs-improvement-v1.png": "待改善",
}


def save_runtime(relative: str, image: Image.Image) -> Path:
    path = RUNTIME_ROOT / relative
    path.parent.mkdir(parents=True, exist_ok=True)
    image.resize((OUTPUT_SIZE, OUTPUT_SIZE), Image.Resampling.LANCZOS).save(path, optimize=True)
    return path


def export() -> list[Path]:
    outputs: list[Path] = []
    for relative, maker in GENERATED.items():
        outputs.append(save_runtime(relative, maker()))
    for relative, source in COPIED.items():
        with Image.open(source) as image:
            outputs.append(save_runtime(relative, image.convert("RGBA")))

    PREVIEW_ROOT.mkdir(parents=True, exist_ok=True)
    for path in outputs:
        with Image.open(path) as image:
            for size in (32, 48, 64):
                dest = PREVIEW_ROOT / f"{path.stem}-{size}.png"
                image.resize((size, size), Image.Resampling.LANCZOS).save(dest, optimize=True)
    return outputs


def contact_sheet(outputs: list[Path]) -> None:
    width, height = 1400, 960
    bg = Image.new("RGBA", (width, height), (11, 79, 170, 255))
    d = ImageDraw.Draw(bg)
    for y in range(height):
        t = y / height
        color = (round(10 + 75 * t), round(63 + 105 * t), round(156 + 90 * t), 255)
        d.line((0, y, width, y), fill=color)
    d.rounded_rectangle((34, 34, width - 34, height - 34), 46, fill=(225, 246, 255, 222), outline=(255, 255, 255, 255), width=4)
    d.text((70, 58), "正式功能图标 · 128px 轻量运行时预览 v1", font=font(FONT_UI, 38), fill=(11, 57, 142, 255))
    d.text((70, 112), "32 / 48 / 64px 仅用于缩小验收；高分辨率概念稿不进入游戏包", font=font(FONT_UI, 22), fill=(30, 86, 152, 255))

    cols = 6
    cell_w, cell_h = 208, 180
    start_x, start_y = 72, 170
    label_font = font(FONT_UI, 19)
    for index, path in enumerate(outputs):
        row, col = divmod(index, cols)
        x = start_x + col * cell_w
        y = start_y + row * cell_h
        d.rounded_rectangle((x, y, x + 172, y + 150), 24, fill=(238, 250, 255, 205), outline=(255, 255, 255, 220), width=2)
        with Image.open(path) as icon:
            icon = icon.convert("RGBA").resize((96, 96), Image.Resampling.LANCZOS)
            bg.alpha_composite(icon, (x + 38, y + 10))
        label = LABELS[path.name]
        box = d.textbbox((0, 0), label, font=label_font)
        d.text((x + 86 - (box[2] - box[0]) / 2, y + 116), label, font=label_font, fill=(10, 58, 139, 255))

    out = ASSET_ROOT / "preview/functional-icon-runtime-final-preview-v1.png"
    out.parent.mkdir(parents=True, exist_ok=True)
    bg.convert("RGB").save(out, optimize=True)


def size_contact_sheet(outputs: list[Path]) -> None:
    width, height = 1400, 900
    bg = Image.new("RGBA", (width, height), (23, 101, 194, 255))
    d = ImageDraw.Draw(bg)
    d.rounded_rectangle((30, 30, width - 30, height - 30), 44, fill=(225, 246, 255, 235), outline="white", width=4)
    d.text((66, 54), "正式功能图标 · 32 / 48 / 64px 实际尺寸预览 v1", font=font(FONT_UI, 36), fill=(11, 57, 142, 255))
    d.text((66, 104), "左至右为 32px、48px、64px；图标文件保持 128px 运行时母版", font=font(FONT_UI, 21), fill=(30, 86, 152, 255))

    cols = 6
    cell_w, cell_h = 215, 172
    start_x, start_y = 66, 154
    label_font = font(FONT_UI, 17)
    size_font = font(FONT_UI, 13)
    for index, path in enumerate(outputs):
        row, col = divmod(index, cols)
        x = start_x + col * cell_w
        y = start_y + row * cell_h
        d.rounded_rectangle((x, y, x + 178, y + 142), 22, fill=(240, 252, 255, 220), outline=(255, 255, 255, 230), width=2)
        with Image.open(path) as source:
            source = source.convert("RGBA")
            cursor = x + 12
            for size in (32, 48, 64):
                icon = source.resize((size, size), Image.Resampling.LANCZOS)
                bg.alpha_composite(icon, (cursor, y + 20 + (64 - size) // 2))
                d.text((cursor + size // 2, y + 90), str(size), font=size_font, fill=(42, 95, 155, 255), anchor="mm")
                cursor += size + 8
        label = LABELS[path.name]
        d.text((x + 89, y + 119), label, font=label_font, fill=(10, 58, 139, 255), anchor="mm")

    out = ASSET_ROOT / "preview/functional-icon-runtime-size-preview-v1.png"
    bg.convert("RGB").save(out, optimize=True)


if __name__ == "__main__":
    generated = export()
    contact_sheet(generated)
    size_contact_sheet(generated)
    print(f"exported {len(generated)} runtime icons and {len(generated) * 3} size previews")
