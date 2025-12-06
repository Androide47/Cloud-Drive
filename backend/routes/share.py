from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import uuid
import os
import shutil
from settings.database import SessionLocal
from models.shared_link import SharedLink
from typing import Annotated
from auth.auth import get_current_user, get_db
from fastapi.responses import FileResponse

router = APIRouter(
    prefix="/share",
    tags=["Share"]
)

RAID_DIR = r"/home/androide47/Documentos"
db_dependency = Annotated[Session, Depends(get_db)]
user_dependency = Annotated[dict, Depends(get_current_user)]

@router.post("/create")
async def create_share_link(data: dict, user: user_dependency, db: db_dependency):
    # expect data = {"path": "relative/path/to/file"}
    file_path = data.get("path")
    if not file_path:
        raise HTTPException(status_code=400, detail="Path is required")
        
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    # Validate file existence
    full_path = os.path.join(RAID_DIR, file_path)
    if not os.path.exists(full_path):
        raise HTTPException(status_code=404, detail="File not found")
        
    # Generate token
    token = str(uuid.uuid4())
    expires_at = datetime.utcnow() + timedelta(hours=24)
    
    new_share = SharedLink(
        token=token,
        file_path=file_path,
        created_at=datetime.utcnow(),
        expires_at=expires_at,
        user_id=user["user_id"]
    )
    
    db.add(new_share)
    db.commit()
    
    # Construct full URL? Frontend needs just the token usually to build the link
    # But user asked for "link". We'll return the token mostly.
    return {"token": token, "expires_at": expires_at}

@router.get("/{token}/info")
async def get_share_info(token: str, db: db_dependency):
    share = db.query(SharedLink).filter(SharedLink.token == token, SharedLink.is_active == True).first()
    
    if not share:
        raise HTTPException(status_code=404, detail="Link not found")
        
    if datetime.utcnow() > share.expires_at:
        raise HTTPException(status_code=410, detail="Link expired")
        
    full_path = os.path.join(RAID_DIR, share.file_path)
    if not os.path.exists(full_path):
        raise HTTPException(status_code=404, detail="File no longer exists")
        
    # Get file stats
    stats = os.stat(full_path)
    is_dir = os.path.isdir(full_path)
    
    return {
        "filename": os.path.basename(share.file_path),
        "size": stats.st_size,
        "is_dir": is_dir,
        "created_at": share.created_at,
        "expires_at": share.expires_at
    }

@router.get("/{token}/download")
async def download_shared_file(token: str, db: db_dependency, background_tasks: BackgroundTasks):
    share = db.query(SharedLink).filter(SharedLink.token == token, SharedLink.is_active == True).first()
    
    if not share:
        raise HTTPException(status_code=404, detail="Link not found")
        
    if datetime.utcnow() > share.expires_at:
        raise HTTPException(status_code=410, detail="Link expired")
        
    full_path = os.path.join(RAID_DIR, share.file_path)
    if not os.path.exists(full_path):
        raise HTTPException(status_code=404, detail="File no longer exists")

    filename = os.path.basename(share.file_path)
    
    if os.path.isdir(full_path):
        # Zip folder logic
        archive_name = filename
        zip_base_name = os.path.join("/tmp", f"{share.token}_{archive_name}")
        
        try:
            zip_path = shutil.make_archive(zip_base_name, 'zip', full_path)
            background_tasks.add_task(os.remove, zip_path)
            return FileResponse(zip_path, filename=f"{archive_name}.zip", media_type="application/zip")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error creating zip: {str(e)}")
        
    return FileResponse(full_path, filename=filename, media_type="application/octet-stream")

@router.get("/list")
async def list_shared_links(user: user_dependency, db: db_dependency):
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    links = db.query(SharedLink).filter(SharedLink.user_id == user["user_id"], SharedLink.is_active == True).all()
    
    return [
        {
            "token": link.token,
            "file_path": link.file_path,
            "created_at": link.created_at,
            "expires_at": link.expires_at,
            "is_expired": datetime.utcnow() > link.expires_at
        }
        for link in links
    ]

@router.delete("/{token}")
async def delete_share_link(token: str, user: user_dependency, db: db_dependency):
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    link = db.query(SharedLink).filter(SharedLink.token == token, SharedLink.user_id == user["user_id"]).first()
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
        
    link.is_active = False 
    db.commit()
    return {"status": "success"}
