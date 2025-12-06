from datetime import timedelta, timezone, datetime
from typing_extensions import Annotated
from fastapi import APIRouter, Depends, status, HTTPException
from pydantic import BaseModel
from models.user import User
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from settings.database import SessionLocal
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from jose import jwt, JWTError
from schemas.auth import CreateUserRequest, UpdateUserRequest, ChangePasswordRequest, Token

router = APIRouter(
    prefix="/auth",
    tags=["auth"],
)

SECRET_KEY = "YourSecretKey Here"
ALGORITHM = "YourAlgorithm Here" #Example HS256
ACCESS_TOKEN_EXPIRE_MINUTES = 30

bcrypt_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_bearer = OAuth2PasswordBearer(tokenUrl='auth/token')

def autenticate_user(email:str, password:str, db):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return False
    if not bcrypt_context.verify(password, user.hashed_password):
        return False
    return user

def create_access_token(email: str, user_id: int, expires_delta=timedelta):
    encode = {'sub': email, 'id': user_id}
    expires = datetime.now(timezone.utc) + expires_delta
    encode.update({'exp': expires})
    return jwt.encode(encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: Annotated[str, Depends(oauth2_bearer)]):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        user_id: int = payload.get("id")
        if email is None or user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    return {"email": email, "user_id": user_id}

    
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

db_dependency = Annotated[Session, Depends(get_db)]

@router.get("/profile", status_code=status.HTTP_200_OK)
async def get_user_profile(user: Annotated[dict, Depends(get_current_user)],
                          db: db_dependency):
    if user is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    user_model = db.query(User).filter(User.id == user["user_id"]).first()
    if user_model is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Return user data (excluding password ideally, but Pydantic response model can handle filtering if we had one)
    # For now returning the model directly, FastAPI will serialize it. 
    # Be careful not to return hashed_password if the response model isn't set.
    # We should use a response model.
    return {
        "id": user_model.id,
        "email": user_model.email,
        "first_name": user_model.first_name,
        "last_name": user_model.last_name,
        "role": user_model.role
    }

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def create_user(db: db_dependency, 
                      create_user_request: CreateUserRequest):
    create_user_model = User(
        email=create_user_request.email,
        first_name=create_user_request.first_name,
        last_name=create_user_request.last_name,
        hashed_password=bcrypt_context.hash(create_user_request.password),
        role=create_user_request.role
    )

    db.add(create_user_model)
    db.commit()

    if create_user_model is not None:
        return create_user_model
    raise HTTPException(status_code=400, detail="User creation failed.")

@router.put("/update", status_code=status.HTTP_200_OK)
async def update_user(user: Annotated[dict, Depends(get_current_user)],
                      db: db_dependency,
                      update_user_request: UpdateUserRequest):
    if user is None:
        raise HTTPException(status_code=401, detail="Authentication required")
        
    user_model = db.query(User).filter(User.id == user["user_id"]).first()
    if user_model is None:
        raise HTTPException(status_code=404, detail="User not found")
    user_model.email = update_user_request.email
    user_model.first_name = update_user_request.first_name
    user_model.last_name = update_user_request.last_name
    user_model.role = update_user_request.role
    db.commit()
    return user_model

@router.put("/change_password", status_code=status.HTTP_200_OK)
async def change_password(user: Annotated[dict, Depends(get_current_user)],
                          db: db_dependency,
                          change_password_request: ChangePasswordRequest):
    if user is None:
        raise HTTPException(status_code=401, detail="Authentication required")
        
    user_model = db.query(User).filter(User.id == user["user_id"]).first()
    if user_model is None:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Verify current password
    if not bcrypt_context.verify(change_password_request.password, user_model.hashed_password):
        raise HTTPException(status_code=401, detail="Current password is incorrect")
        
    # Update password
    user_model.hashed_password = bcrypt_context.hash(change_password_request.new_password)
    db.commit()
    return {"message": "Password updated successfully"}

@router.post("/token", response_model=Token, status_code=status.HTTP_200_OK)
async def login_for_access_token(form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
                                 db: db_dependency):
    authentication = autenticate_user(form_data.username, form_data.password, db)
    if not authentication:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    token = create_access_token(
        email=authentication.email,
        user_id=authentication.id,
        expires_delta=timedelta(minutes=30)
    )
    return {"access_token": token, "token_type": "bearer"}