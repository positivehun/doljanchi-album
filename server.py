#!/usr/bin/env python3
"""돌잔치 사진첩 서버.

images/ 안의 원본은 그대로 두고, 아이패드에 보낼 때만
긴 변이 1800px 이하인 JPEG으로 줄여 .cache/ 에 저장합니다.
"""

import subprocess
import threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import unquote, urlparse

ROOT = Path(__file__).resolve().parent
CACHE = ROOT / ".cache"
IMAGES = ROOT / "images"
MAX_EDGE = 1800
JPEG_QUALITY = 80
SMALL_BYTES = 1_200_000
PORT = 8765
IMAGE_EXT = {
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".gif",
    ".heic",
    ".heif",
    ".tif",
    ".tiff",
    ".avif",
}

resize_slots = threading.Semaphore(2)
file_locks = {}
file_locks_guard = threading.Lock()


def lock_for(path):
    key = str(path)
    with file_locks_guard:
        if key not in file_locks:
            file_locks[key] = threading.Lock()
        return file_locks[key]


def image_size(path):
    result = subprocess.run(
        ["sips", "-g", "pixelWidth", "-g", "pixelHeight", str(path)],
        capture_output=True,
        text=True,
        check=True,
    )
    width = height = 0
    for line in result.stdout.splitlines():
        if "pixelWidth" in line:
            width = int(line.split(":", 1)[1].strip())
        elif "pixelHeight" in line:
            height = int(line.split(":", 1)[1].strip())
    if width <= 0 or height <= 0:
        raise RuntimeError(f"크기를 읽지 못했습니다: {path.name}")
    return width, height


def cache_path(src):
    relative = src.relative_to(ROOT).as_posix()
    return CACHE / f"{relative}.jpg"


def needs_resize(src, width, height):
    if src.suffix.lower() not in {".jpg", ".jpeg"}:
        return True
    if max(width, height) > MAX_EDGE:
        return True
    return src.stat().st_size > SMALL_BYTES


def resize_image(src):
    dest = cache_path(src)
    with lock_for(src):
        if dest.exists() and dest.stat().st_mtime >= src.stat().st_mtime:
            return dest
        width, height = image_size(src)
        if not needs_resize(src, width, height):
            return src
        dest.parent.mkdir(parents=True, exist_ok=True)
        temporary = dest.with_suffix(".tmp.jpg")
        command = ["sips", "-s", "format", "jpeg", "-s", "formatOptions", str(JPEG_QUALITY)]
        if max(width, height) > MAX_EDGE:
            command.extend(["-Z", str(MAX_EDGE)])
        command.extend([str(src), "--out", str(temporary)])
        with resize_slots:
            subprocess.run(command, capture_output=True, text=True, check=True)
        temporary.replace(dest)
        return dest


def iter_originals():
    if not IMAGES.exists():
        return
    for path in sorted(IMAGES.rglob("*")):
        if path.is_file() and path.suffix.lower() in IMAGE_EXT and not path.name.startswith("."):
            yield path


def warm_cache():
    files = list(iter_originals())
    if not files:
        print("줄여 둘 사진이 없습니다.", flush=True)
        return
    print(f"표시용 사진 {len(files)}장을 준비합니다.", flush=True)
    for index, path in enumerate(files, start=1):
        try:
            resize_image(path)
            print(f"  {index}/{len(files)} {path.relative_to(ROOT)}", flush=True)
        except Exception as error:
            print(f"  실패 {path.name}: {error}", flush=True)
    print("표시용 사진 준비가 끝났습니다.", flush=True)


class AlbumHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        local = self.local_path()
        if local is None:
            self.send_error(403)
            return
        if self.should_serve_display(local):
            self.serve_display(local)
            return
        super().do_GET()

    def local_path(self):
        raw = unquote(urlparse(self.path).path).lstrip("/")
        if not raw:
            return ROOT
        local = (ROOT / raw).resolve()
        try:
            local.relative_to(ROOT)
        except ValueError:
            return None
        if CACHE in local.parents or local == CACHE:
            return None
        return local

    def should_serve_display(self, local):
        return (
            local.is_file()
            and IMAGES in local.parents
            and local.suffix.lower() in IMAGE_EXT
            and not local.name.startswith(".")
        )

    def serve_display(self, local):
        try:
            display = resize_image(local)
        except Exception as error:
            print(f"원본으로 대체합니다 ({local.name}): {error}", flush=True)
            super().do_GET()
            return

        data = display.read_bytes()
        content_type = "image/jpeg" if display.suffix.lower() in {".jpg", ".jpeg"} else self.guess_type(str(display))
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "public, max-age=3600")
        self.send_header("Last-Modified", self.date_time_string(display.stat().st_mtime))
        self.end_headers()
        self.wfile.write(data)


if __name__ == "__main__":
    threading.Thread(target=warm_cache, daemon=True).start()
    ThreadingHTTPServer.allow_reuse_address = True
    server = ThreadingHTTPServer(("0.0.0.0", PORT), AlbumHandler)
    print(f"사진첩 http://127.0.0.1:{PORT}/", flush=True)
    server.serve_forever()
