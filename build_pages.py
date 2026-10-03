#!/usr/bin/env python3
"""GitHub Pages용 표시 사진과 photos.json을 만듭니다.

원본 images/ 는 그대로 두고, 화면용 JPEG만 display/ 에 복사합니다.
"""

import json
import re
import shutil
import subprocess
from pathlib import Path

from server import IMAGE_EXT, IMAGES, resize_image

ROOT = Path(__file__).resolve().parent
DISPLAY = ROOT / "display"
PHOTOS_PER_MONTH = 5


def sort_names(names):
    script = """
const fs = require("fs");
const names = JSON.parse(fs.readFileSync(0, "utf8"));
names.sort((a, b) => a.localeCompare(b, "ko", { numeric: true }));
process.stdout.write(JSON.stringify(names));
"""
    result = subprocess.run(
        ["node", "-e", script],
        input=json.dumps(names),
        text=True,
        capture_output=True,
        check=True,
    )
    return json.loads(result.stdout)


def assign_files(names):
    picked = [None] * PHOTOS_PER_MONTH
    used = set()
    for name in names:
        matched = re.match(r"^(\d+)\.[^.]+$", name)
        if not matched:
            continue
        number = int(matched.group(1))
        if number < 1 or number > PHOTOS_PER_MONTH or picked[number - 1]:
            continue
        picked[number - 1] = name
        used.add(name)

    rest = [name for name in names if name not in used]
    cursor = 0
    for index, name in enumerate(picked):
        if name or cursor >= len(rest):
            continue
        picked[index] = rest[cursor]
        cursor += 1
    return picked


def main():
    if DISPLAY.exists():
        shutil.rmtree(DISPLAY)
    manifest = {}

    if not IMAGES.exists():
        raise SystemExit("images 폴더가 없습니다.")

    for folder in sorted(path for path in IMAGES.iterdir() if path.is_dir()):
        names = [
            path.name
            for path in folder.iterdir()
            if path.is_file() and path.suffix.lower() in IMAGE_EXT and not path.name.startswith(".")
        ]
        if not names:
            continue
        chosen = [name for name in assign_files(sort_names(names)) if name]
        if not chosen:
            continue
        month_dir = DISPLAY / folder.name
        month_dir.mkdir(parents=True, exist_ok=True)
        paths = []
        for index, name in enumerate(chosen, start=1):
            source = resize_image(folder / name)
            target = month_dir / f"{index}.jpg"
            shutil.copy2(source, target)
            paths.append(f"display/{folder.name}/{index}.jpg")
        manifest[folder.name] = paths
        print(f"{folder.name}: {len(paths)}장", flush=True)

    (ROOT / "photos.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    (ROOT / ".nojekyll").write_text("", encoding="utf-8")
    print(f"photos.json 개월 수: {len(manifest)}", flush=True)


if __name__ == "__main__":
    main()
