from app.services import auth_service

def register(data):
    return auth_service.register(
        data["username"],
        data["email"],
        data["password"]
    )

def login(data):
    return auth_service.login(
        data["email"],
        data["password"]
    )