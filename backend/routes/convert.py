from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from services.converter import convert_file
from utils.file_utils import save_upload, cleanup_file
import os

router = APIRouter()

SUPPORTED_CONVERSIONS = {
    "pdf-to-docx":  {"input": ".pdf",  "output": ".docx"},
    "docx-to-pdf":  {"input": ".docx", "output": ".pdf"},
    "pptx-to-pdf":  {"input": ".pptx", "output": ".pdf"},
    "jpg-to-pdf":   {"input": ".jpg",  "output": ".pdf"},
    "jpeg-to-pdf":  {"input": ".jpeg", "output": ".pdf"},
    "png-to-pdf":   {"input": ".png",  "output": ".pdf"},
    "docx-to-txt":  {"input": ".docx", "output": ".txt"},
    "pdf-to-txt":   {"input": ".pdf",  "output": ".txt"},
}

@router.get("/conversions")
def list_conversions():
    return {"conversions": list(SUPPORTED_CONVERSIONS.keys())}

@router.post("/convert")
async def convert(
    file: UploadFile = File(...),
    conversion_type: str = Form(...)
):
    if conversion_type not in SUPPORTED_CONVERSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported conversion: '{conversion_type}'")

    info = SUPPORTED_CONVERSIONS[conversion_type]
    expected_ext = info["input"]
    output_ext = info["output"]

    filename = file.filename or "upload"
    _, file_ext = os.path.splitext(filename.lower())
    if file_ext != expected_ext:
        raise HTTPException(status_code=400, detail=f"Upload a '{expected_ext}' file. Got '{file_ext}'.")

    input_path = await save_upload(file)
    output_path = input_path.replace(file_ext, output_ext)

    try:
        convert_file(conversion_type, input_path, output_path)

        if not os.path.exists(output_path):
            raise HTTPException(status_code=500, detail="Conversion failed: output file not created.")

        base_name = os.path.splitext(filename)[0]
        download_name = f"{base_name}_converted{output_ext}"

        return FileResponse(
            path=output_path,
            filename=download_name,
            media_type="application/octet-stream"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Conversion error: {str(e)}")
    finally:
        cleanup_file(input_path)