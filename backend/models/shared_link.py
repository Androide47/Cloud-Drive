from settings.database import Base
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from datetime import datetime

class SharedLink(Base):
    __tablename__ = "shared_links"

    id = Column(Integer, primary_key=True, index=True)
    token = Column(String, unique=True, index=True)
    file_path = Column(String)  # Relative path to RAID_DIR
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime)
    user_id = Column(Integer, ForeignKey("users.id"))
    is_active = Column(Boolean, default=True)
