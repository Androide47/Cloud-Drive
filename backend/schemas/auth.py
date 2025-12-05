from pydantic import BaseModel


class CreateUserRequest(BaseModel):
    email: str
    first_name: str
    last_name: str
    password: str
    role: str 

class UpdateUserRequest(BaseModel):
    email: str
    first_name: str
    last_name: str
    role: str

class ChangePasswordRequest(BaseModel):
    password: str
    new_password: str

class Token(BaseModel):
    access_token: str
    token_type: str