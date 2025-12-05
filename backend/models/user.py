from settings.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String)
    last_name = Column(String)
    email = Column(String)
    username = Column(String)
    hashed_password = Column(String)
    files = relationship("File", back_populates="owner")