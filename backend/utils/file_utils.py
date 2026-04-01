import os
import uuid
import aiofiles
from fastapi import UploadFile

TEMP_DIR = "temp_files"

def ensure_temp_dir():
    os.makedirs(TEMP_DIR, exist_ok=True)

async def save_upload(file: UploadFile) -> str:
    ensure_temp_dir()
    ext = os.path.splitext(file.filename or "upload")[1].lower()
    unique_name = f"{uuid.uuid4().hex}{ext}"
    save_path = os.path.join(TEMP_DIR, unique_name)
    async with aiofiles.open(save_path, "wb") as out_file:
        while chunk := await file.read(1024 * 1024):
            await out_file.write(chunk)
    return save_path

def cleanup_file(path: str):
    try:
        if path and os.path.exists(path):
            os.remove(path)
    except Exception:
        pass