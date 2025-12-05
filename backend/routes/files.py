from fastapi import FastAPI, File, UploadFile, HTTPException, APIRouter
from fastapi.responses import FileResponse
import os
import shutil

RAID_DIR = r"/mnt/cloud_storage"

os.makedirs(RAID_DIR, exist_ok=True)

route = APIRouter(
    prefix="/files",
    tags=["Files"]
)
@route.post("/upload")
async def upload(file: UploadFile = File(...)):
    print(f"Starting upload for file: {file.filename}")
    safe_filename = os.path.basename(file.filename)
    file_path = os.path.join(RAID_DIR, safe_filename)
    print(f"Saving to: {file_path}")

    try:
        with open(file_path, "wb") as buffer:
            print("Copying file object...")
            shutil.copyfileobj(file.file, buffer)
            print("Copy completed.")
    except Exception as e:
        print(f"Error during upload: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        file.file.close()

    return {"status": "success", "message": f"File {safe_filename} uploaded successfully"}
    
@route.get("/list")
async def list_files():
    try:
        files =[ f for f in os.listdir(RAID_DIR) if os.path.isfile(os.path.join(RAID_DIR, f))] 
        return {"files": files, "count": len(files)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@route.get("/download/{filename}")
async def download(filename: str):
    file_path = os.path.join(RAID_DIR, filename)
    if not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(file_path, filename=filename, media_type="application/octet-stream")

@route.delete("/delete/{filename}")
async def delete(filename: str):
    file_path = os.path.join(RAID_DIR, filename)
    if not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        os.remove(file_path)
        return {"status": "success", "message": f"File {filename} deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
