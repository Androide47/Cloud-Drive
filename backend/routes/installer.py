from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
import os

router = APIRouter()

INSTALLER_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "installer", "cloud_drive_installer.txt")

@router.get("/download")
async def download_installer():
    if not os.path.exists(INSTALLER_PATH):
        raise HTTPException(status_code=404, detail="Installer not found")
    
    return FileResponse(
        path=INSTALLER_PATH,
        filename="CloudDriveInstaller.txt",
        media_type="text/plain"
    )
