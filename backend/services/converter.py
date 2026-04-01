import subprocess
import os
from pathlib import Path

def pdf_to_docx(input_path, output_path):
    from pdf2docx import Converter
    cv = Converter(input_path)
    cv.convert(output_path, start=0, end=None)
    cv.close()

def docx_to_pdf(input_path, output_path):
    output_dir = str(Path(output_path).parent)
    lo_result = _libreoffice_convert(input_path, output_dir, "pdf")
    if lo_result:
        lo_output = Path(output_dir) / (Path(input_path).stem + ".pdf")
        if lo_output.exists() and str(lo_output) != output_path:
            os.rename(str(lo_output), output_path)
        return
    raise RuntimeError("DOCX to PDF requires LibreOffice. Install from https://www.libreoffice.org")

def pptx_to_pdf(input_path, output_path):
    output_dir = str(Path(output_path).parent)
    lo_result = _libreoffice_convert(input_path, output_dir, "pdf")
    if lo_result:
        lo_output = Path(output_dir) / (Path(input_path).stem + ".pdf")
        if lo_output.exists() and str(lo_output) != output_path:
            os.rename(str(lo_output), output_path)
        return
    raise RuntimeError("PPTX to PDF requires LibreOffice. Install from https://www.libreoffice.org")

def image_to_pdf(input_path, output_path):
    from PIL import Image
    img = Image.open(input_path)
    if img.mode in ("RGBA", "P", "LA"):
        img = img.convert("RGB")
    img.save(output_path, "PDF", resolution=100.0)

def docx_to_txt(input_path, output_path):
    from docx import Document
    doc = Document(input_path)
    lines = [para.text for para in doc.paragraphs]
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

def pdf_to_txt(input_path, output_path):
    import fitz
    doc = fitz.open(input_path)
    text_parts = []
    for page in doc:
        text_parts.append(page.get_text())
    doc.close()
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(text_parts))

CONVERSION_MAP = {
    "pdf-to-docx":  pdf_to_docx,
    "docx-to-pdf":  docx_to_pdf,
    "pptx-to-pdf":  pptx_to_pdf,
    "jpg-to-pdf":   image_to_pdf,
    "jpeg-to-pdf":  image_to_pdf,
    "png-to-pdf":   image_to_pdf,
    "docx-to-txt":  docx_to_txt,
    "pdf-to-txt":   pdf_to_txt,
}

def convert_file(conversion_type, input_path, output_path):
    handler = CONVERSION_MAP.get(conversion_type)
    if not handler:
        raise ValueError(f"No handler for: {conversion_type}")
    handler(input_path, output_path)

def _libreoffice_convert(input_path, output_dir, output_format):
    for lo_cmd in [
        r"C:\Program Files\LibreOffice\program\soffice.exe",
        "soffice", "libreoffice"
    ]:
        try:
            result = subprocess.run(
                [lo_cmd, "--headless", "--convert-to", output_format,
                 "--outdir", output_dir, input_path],
                capture_output=True, text=True, timeout=60
            )
            if result.returncode == 0:
                return True
        except (FileNotFoundError, subprocess.TimeoutExpired):
            continue
    return False