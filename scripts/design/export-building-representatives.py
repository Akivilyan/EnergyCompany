from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[2]
ASSET_ROOT = ROOT / "docs/design/ui/assets/buildings/representative-v1"
SOURCE_DIR = ASSET_ROOT / "source"
MASTER_DIR = ASSET_ROOT / "master"
SHADOW_DIR = ASSET_ROOT / "shadow"
THUMBNAIL_DIR = ASSET_ROOT / "thumbnail"
PREVIEW_DIR = ASSET_ROOT / "preview"

MASTER_SIZE = 512
MASTER_ANCHOR = (256, 468)
THUMBNAIL_SIZE = 256
THUMBNAIL_ANCHOR = (128, 234)


@dataclass(frozen=True)
class AssetSpec:
    key: str
    label: str
    source_name: str
    max_width: int
    max_height: int
    shadow_width: int
    shadow_height: int


ASSETS = (
    AssetSpec(
        key="wind-tier1",
        label="WIND I",
        source_name="building-wind-tier1-alpha-source-v1.png",
        max_width=300,
        max_height=456,
        shadow_width=154,
        shadow_height=20,
    ),
    AssetSpec(
        key="solar-tier1",
        label="SOLAR I",
        source_name="building-solar-tier1-alpha-source-v1.png",
        max_width=360,
        max_height=338,
        shadow_width=238,
        shadow_height=24,
    ),
    AssetSpec(
        key="thermal-tier1",
        label="THERMAL I",
        source_name="building-thermal-tier1-alpha-source-v1.png",
        max_width=430,
        max_height=374,
        shadow_width=318,
        shadow_height=28,
    ),
)


def ensure_dirs() -> None:
    for directory in (MASTER_DIR, SHADOW_DIR, THUMBNAIL_DIR, PREVIEW_DIR):
        directory.mkdir(parents=True, exist_ok=True)


def subject_bbox(image: Image.Image, threshold: int = 8) -> tuple[int, int, int, int]:
    alpha = image.getchannel("A")
    mask = alpha.point(lambda value: 255 if value > threshold else 0)
    bbox = mask.getbbox()
    if bbox is None:
        raise ValueError("image has no visible subject")
    return bbox


def fit_subject(
    source: Image.Image,
    *,
    canvas_size: int,
    anchor: tuple[int, int],
    max_width: int,
    max_height: int,
) -> tuple[Image.Image, tuple[int, int, int, int]]:
    bbox = subject_bbox(source)
    subject = source.crop(bbox)
    scale = min(max_width / subject.width, max_height / subject.height)
    resized = subject.resize(
        (max(1, round(subject.width * scale)), max(1, round(subject.height * scale))),
        Image.Resampling.LANCZOS,
    )
    x = anchor[0] - resized.width // 2
    y = anchor[1] - resized.height
    canvas = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    canvas.alpha_composite(resized, (x, y))
    return canvas, subject_bbox(canvas)


def build_shadow(width: int, height: int) -> Image.Image:
    shadow = Image.new("RGBA", (MASTER_SIZE, MASTER_SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(shadow)
    cx, cy = MASTER_ANCHOR[0], MASTER_ANCHOR[1] - 5
    draw.ellipse(
        (cx - width // 2, cy - height // 2, cx + width // 2, cy + height // 2),
        fill=(90, 126, 151, 72),
    )
    return shadow.filter(ImageFilter.GaussianBlur(radius=7))


def build_thumbnail(
    master: Image.Image,
    shadow: Image.Image,
) -> tuple[Image.Image, tuple[int, int, int, int]]:
    bbox = subject_bbox(master)
    max_subject = 210
    scale = min(max_subject / (bbox[2] - bbox[0]), max_subject / (bbox[3] - bbox[1]))
    scaled_size = max(1, round(MASTER_SIZE * scale))
    resized_master = master.resize(
        (scaled_size, scaled_size),
        Image.Resampling.LANCZOS,
    )
    resized_shadow = shadow.resize(
        (scaled_size, scaled_size),
        Image.Resampling.LANCZOS,
    )
    thumbnail = Image.new("RGBA", (THUMBNAIL_SIZE, THUMBNAIL_SIZE), (0, 0, 0, 0))
    x = round(THUMBNAIL_ANCHOR[0] - MASTER_ANCHOR[0] * scale)
    y = round(THUMBNAIL_ANCHOR[1] - MASTER_ANCHOR[1] * scale)
    thumbnail.alpha_composite(resized_shadow, (x, y))
    thumbnail.alpha_composite(resized_master, (x, y))
    return thumbnail, subject_bbox(thumbnail)


def load_font(size: int) -> ImageFont.ImageFont:
    candidates = (
        Path("C:/Windows/Fonts/segoeuib.ttf"),
        Path("C:/Windows/Fonts/arialbd.ttf"),
    )
    for path in candidates:
        if path.exists():
            return ImageFont.truetype(str(path), size=size)
    return ImageFont.load_default()


def build_preview(items: list[dict[str, object]]) -> None:
    width, height = 1536, 640
    preview = Image.new("RGB", (width, height), (210, 240, 181))
    draw = ImageDraw.Draw(preview)
    ground_y = 548
    draw.rectangle((0, ground_y, width, height), fill=(197, 225, 171))
    draw.line((0, ground_y, width, ground_y), fill=(241, 250, 232), width=3)
    font = load_font(28)
    small_font = load_font(18)

    for index, item in enumerate(items):
        x0 = index * MASTER_SIZE
        draw.rounded_rectangle(
            (x0 + 18, 18, x0 + MASTER_SIZE - 18, height - 18),
            radius=24,
            outline=(255, 255, 255),
            width=3,
        )
        shadow = Image.open(item["shadow_path"]).convert("RGBA")
        master = Image.open(item["master_path"]).convert("RGBA")
        preview.paste(shadow, (x0, 80), shadow)
        preview.paste(master, (x0, 80), master)
        draw.text((x0 + 28, 30), item["label"], font=font, fill=(30, 74, 108))
        draw.text(
            (x0 + 28, 596),
            f"anchor 256,468 | {item['content_bbox'][2] - item['content_bbox'][0]}x"
            f"{item['content_bbox'][3] - item['content_bbox'][1]}",
            font=small_font,
            fill=(48, 86, 104),
        )

    preview.save(PREVIEW_DIR / "building-representative-master-preview-v1.png", optimize=True)


def build_thumbnail_preview(items: list[dict[str, object]]) -> None:
    width, height = 960, 352
    preview = Image.new("RGB", (width, height), (224, 244, 207))
    draw = ImageDraw.Draw(preview)
    font = load_font(22)

    for index, item in enumerate(items):
        x0 = 32 + index * 304
        draw.rounded_rectangle(
            (x0, 30, x0 + 272, 320),
            radius=20,
            fill=(238, 249, 229),
            outline=(255, 255, 255),
            width=3,
        )
        thumbnail = Image.open(item["thumbnail_path"]).convert("RGBA")
        preview.paste(thumbnail, (x0 + 8, 50), thumbnail)
        draw.text((x0 + 20, 280), item["label"], font=font, fill=(30, 74, 108))

    preview.save(
        PREVIEW_DIR / "building-representative-thumbnail-preview-v1.png",
        optimize=True,
    )


def main() -> None:
    ensure_dirs()
    manifest_items: list[dict[str, object]] = []

    for spec in ASSETS:
        source_path = SOURCE_DIR / spec.source_name
        source = Image.open(source_path).convert("RGBA")
        master, content_bbox = fit_subject(
            source,
            canvas_size=MASTER_SIZE,
            anchor=MASTER_ANCHOR,
            max_width=spec.max_width,
            max_height=spec.max_height,
        )
        master_path = MASTER_DIR / f"building-{spec.key}-master-v1.png"
        master.save(master_path, optimize=True)

        shadow = build_shadow(spec.shadow_width, spec.shadow_height)
        shadow_path = SHADOW_DIR / f"building-{spec.key}-shadow-v1.png"
        shadow.save(shadow_path, optimize=True)

        thumbnail, thumbnail_bbox = build_thumbnail(master, shadow)
        thumbnail_path = THUMBNAIL_DIR / f"building-{spec.key}-thumbnail-v1.png"
        thumbnail.save(thumbnail_path, optimize=True)

        manifest_items.append(
            {
                "key": spec.key,
                "label": spec.label,
                "source": str(source_path.relative_to(ASSET_ROOT)).replace("\\", "/"),
                "master": str(master_path.relative_to(ASSET_ROOT)).replace("\\", "/"),
                "shadow": str(shadow_path.relative_to(ASSET_ROOT)).replace("\\", "/"),
                "thumbnail": str(thumbnail_path.relative_to(ASSET_ROOT)).replace("\\", "/"),
                "masterSize": [MASTER_SIZE, MASTER_SIZE],
                "anchorPx": list(MASTER_ANCHOR),
                "anchorNormalized": [
                    round(MASTER_ANCHOR[0] / MASTER_SIZE, 4),
                    round(MASTER_ANCHOR[1] / MASTER_SIZE, 4),
                ],
                "contentBBox": list(content_bbox),
                "thumbnailSize": [THUMBNAIL_SIZE, THUMBNAIL_SIZE],
                "thumbnailAnchorPx": list(THUMBNAIL_ANCHOR),
                "thumbnailContentBBox": list(thumbnail_bbox),
            }
        )

    manifest = {
        "version": 1,
        "camera": "A-prime: 38deg high three-quarter, gentle weak perspective",
        "lighting": "L3: near-overhead noon, sky fill",
        "masterCanvas": [MASTER_SIZE, MASTER_SIZE],
        "sharedAnchorPx": list(MASTER_ANCHOR),
        "items": manifest_items,
    }
    (ASSET_ROOT / "manifest-v1.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    preview_items = [
        {
            **item,
            "master_path": ASSET_ROOT / item["master"],
            "shadow_path": ASSET_ROOT / item["shadow"],
            "thumbnail_path": ASSET_ROOT / item["thumbnail"],
            "content_bbox": item["contentBBox"],
        }
        for item in manifest_items
    ]
    build_preview(preview_items)
    build_thumbnail_preview(preview_items)

    for item in manifest_items:
        print(
            f"{item['key']}: master={item['masterSize']} bbox={item['contentBBox']} "
            f"anchor={item['anchorNormalized']} thumbnail={item['thumbnailSize']}"
        )


if __name__ == "__main__":
    main()
