from fastapi import FastAPI, APIRouter
from routes import files
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(files.route)

@app.get("/")
def read_root():
    return {"API": "Cloud Storage API", "Version": "1.0.0", "Description": "Cloud Storage API for file storage"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8006, reload=True)