from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.convert import router as convert_router
import uvicorn

app = FastAPI(title="File Converter API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(convert_router, prefix="/api")

@app.get("/")
def root():
    return {"message": "File Converter API is running"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)