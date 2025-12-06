from fastapi import FastAPI, File, UploadFile, HTTPException, APIRouter, Depends, Query, BackgroundTasks
from typing import Annotated
from auth.auth import get_current_user
from fastapi.responses import FileResponse
import os
user_dependency = Annotated[dict, Depends(get_current_user)]
import shutil
from pydantic import BaseModel

RAID_DIR = r"/home/androide47/Documentos"

os.makedirs(RAID_DIR, exist_ok=True)

route = APIRouter(
    prefix="/files",
    tags=["Files"]
)

import uuid
import threading
import zipfile

# Global job store
zip_jobs = {}

def zip_directory_task(source_dir, output_zip, job_id):
    try:
        total_files = 0
        for root, dirs, files in os.walk(source_dir):
            total_files += len(files)
            
        if total_files == 0:
            # Empty folder or only dirs
            with zipfile.ZipFile(output_zip, 'w', zipfile.ZIP_DEFLATED) as zipf:
                pass
            zip_jobs[job_id]['progress'] = 100
            zip_jobs[job_id]['status'] = 'complete'
            return

        processed_files = 0
        with zipfile.ZipFile(output_zip, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for root, dirs, files in os.walk(source_dir):
                for file in files:
                    file_path = os.path.join(root, file)
                    arcname = os.path.relpath(file_path, source_dir)
                    zipf.write(file_path, arcname)
                    processed_files += 1
                    # Update progress
                    progress = int((processed_files / total_files) * 100)
                    zip_jobs[job_id]['progress'] = progress
        
        zip_jobs[job_id]['status'] = 'complete'
    except Exception as e:
        zip_jobs[job_id]['status'] = 'error'
        zip_jobs[job_id]['error'] = str(e)

@route.post("/zip/{filename:path}")
async def start_zip(filename: str, user: user_dependency):
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    source_path = os.path.join(RAID_DIR, filename)
    if not os.path.isdir(source_path):
         raise HTTPException(status_code=404, detail="Directory not found")
         
    job_id = str(uuid.uuid4())
    # Create temp zip path
    zip_name = f"{os.path.basename(filename)}.zip"
    output_zip = os.path.join("/tmp", f"{job_id}_{zip_name}")
    
    zip_jobs[job_id] = {
        "status": "processing",
        "progress": 0,
        "filepath": output_zip,
        "filename": zip_name
    }
    
    # Start background thread
    thread = threading.Thread(target=zip_directory_task, args=(source_path, output_zip, job_id))
    thread.start()
    
    return {"job_id": job_id}

@route.get("/zip/status/{job_id}")
async def get_zip_status(job_id: str, user: user_dependency):
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    job = zip_jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    return job

@route.get("/zip/download/{job_id}")
async def download_zip_result(job_id: str, user: user_dependency, background_tasks: BackgroundTasks):
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")

    job = zip_jobs.get(job_id)
    if not job or job['status'] != 'complete':
        raise HTTPException(status_code=400, detail="Job not complete or found")
        
    file_path = job['filepath']
    filename = job['filename']
    
    # Cleanup job from dict (file cleanup via background task)
    del zip_jobs[job_id]
    
    background_tasks.add_task(os.remove, file_path)
    return FileResponse(file_path, filename=filename, media_type="application/zip")



user_dependency = Annotated[dict, Depends(get_current_user)]

class CreateFolderRequest(BaseModel):
    path: str
    folder_name: str

@route.post("/upload")
async def upload(user: user_dependency, file: UploadFile = File(...), path: str = Query(default="")):
    # Security check for path traversal
    safe_path = os.path.normpath(os.path.join(RAID_DIR, path))
    if not safe_path.startswith(RAID_DIR):
         raise HTTPException(status_code=403, detail="Access denied")
    
    if not os.path.exists(safe_path):
        os.makedirs(safe_path, exist_ok=True)

    print(f"Starting upload for file: {file.filename} to {safe_path}")
    safe_filename = os.path.basename(file.filename)
    file_path = os.path.join(safe_path, safe_filename)
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
async def list_files(user: user_dependency, path: str = Query(default=""), q: str = Query(default=None)):
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    # Validate path to prevent directory traversal
    safe_path = os.path.normpath(os.path.join(RAID_DIR, path))
    if not safe_path.startswith(RAID_DIR):
        raise HTTPException(status_code=403, detail="Access denied")

    try:
        items = []
        
        if q:
            # Recursive search mode
            search_query = q.lower()
            MAX_RESULTS = 50
            
            for root, dirs, files in os.walk(RAID_DIR):
                if len(items) >= MAX_RESULTS:
                    break
                
                # Exclude hidden directories from traversal
                dirs[:] = [d for d in dirs if not d.startswith('.')]
                
                # Calculate relative path from RAID_DIR to current root
                rel_dir = os.path.relpath(root, RAID_DIR)
                if rel_dir == ".":
                    rel_dir = ""

                # Search directories
                for d in dirs:
                    if len(items) >= MAX_RESULTS:
                        break
                    if search_query in d.lower():
                        full_rel_path = os.path.join(rel_dir, d) if rel_dir else d
                        items.append({"name": full_rel_path, "type": "directory"})

                # Search files
                for f in files:
                    if len(items) >= MAX_RESULTS:
                        break
                    if not f.startswith('.') and search_query in f.lower():
                        full_rel_path = os.path.join(rel_dir, f) if rel_dir else f
                        items.append({"name": full_rel_path, "type": "file"})
            
            # Limit results for performance? (optional, skipping for now)
        else:
            # Normal browse mode
            if not os.path.exists(safe_path):
                 return {"items": [], "count": 0} # Or raise 404, but empty list is safer for UI

            with os.scandir(safe_path) as entries:
                for entry in entries:
                    if entry.is_dir():
                        items.append({"name": entry.name, "type": "directory"})
                    elif entry.is_file():
                        items.append({"name": entry.name, "type": "file"})
            
            # Sort: Directories first, then files. Alphabetical order.
            items.sort(key=lambda x: (x["type"] != "directory", x["name"].lower()))

        return {"items": items, "count": len(items)}
    except Exception as e:
        print(f"Error listing files: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@route.post("/mkdir")
async def create_directory(request: CreateFolderRequest, user: user_dependency):
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    safe_path = os.path.normpath(os.path.join(RAID_DIR, request.path))
    if not safe_path.startswith(RAID_DIR):
        raise HTTPException(status_code=403, detail="Access denied")
    
    new_folder_path = os.path.join(safe_path, request.folder_name)
    
    try:
        os.makedirs(new_folder_path, exist_ok=False)
        return {"status": "success", "message": f"Folder {request.folder_name} created successfully"}
    except FileExistsError:
        raise HTTPException(status_code=400, detail="Folder already exists")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
from fastapi import BackgroundTasks

# ... (imports)

@route.get("/download/{filename:path}")
async def download(filename: str, user: user_dependency, background_tasks: BackgroundTasks):
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    file_path = os.path.join(RAID_DIR, filename)
    
    if os.path.isfile(file_path):
        return FileResponse(file_path, filename=os.path.basename(filename), media_type="application/octet-stream")
    
    elif os.path.isdir(file_path):
        # Create a zip file for the directory
        archive_name = os.path.basename(filename)
        # Use a temp directory or just /tmp. 
        # mktemp is deprecated, but we can standard /tmp location with a unique name if needed, 
        # but simpler is /tmp + Safe Name for now.
        # Actually shutil.make_archive adds the extension .zip automatically
        zip_base_name = os.path.join("/tmp", archive_name)
        
        try:
            # root_dir is the parent directory, base_dir is the directory itself to zip relative to root
            # shutil.make_archive(zip_base_name, 'zip', file_path) # This zips contents OF file_path
            
            zip_path = shutil.make_archive(zip_base_name, 'zip', file_path)
            
            # Add cleanup task
            background_tasks.add_task(os.remove, zip_path)
            
            return FileResponse(zip_path, filename=f"{archive_name}.zip", media_type="application/zip")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error creating zip: {str(e)}")
            
    else:
        raise HTTPException(status_code=404, detail="File or directory not found")

@route.delete("/delete/{filename}")
async def delete(filename: str,user: user_dependency):
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    file_path = os.path.join(RAID_DIR, filename)
    if not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        os.remove(file_path)
        return {"status": "success", "message": f"File {filename} deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@route.get("/usage")
async def disk_usage(user: user_dependency):
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        # Usa shutil.disk_usage() en la ruta de tu RAID
        total, used, free = shutil.disk_usage(RAID_DIR)
        
        # Opcional: obtener la ruta real para el frontend
        raid_path = os.path.abspath(RAID_DIR)

        return {
            "path": raid_path,
            "total_bytes": total, 
            "used_bytes": used,
            "free_bytes": free,
            # También puedes devolver valores en GB para el frontend
            "total_gb": round(total / (1024**3), 2),
            "used_gb": round(used / (1024**3), 2),
            "free_gb": round(free / (1024**3), 2)
        }
    except Exception as e:
        # Esto captura errores como que la ruta no existe o problemas de permisos
        raise HTTPException(status_code=500, detail=f"Error al obtener el uso del disco: {str(e)}")