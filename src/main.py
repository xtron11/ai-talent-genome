from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from urllib.parse import urlparse, parse_qs
from datetime import datetime, timedelta
import httpx
import bcrypt
import jwt

from config import settings
from database import get_db, create_tables, User
from database.schemas import RegisterRequest, RegisterResponse, LoginRequest, LoginResponse

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# JWT настройки
JWT_SECRET = settings.JWT_SECRET
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = 24


def create_token(user_id: int, phone: str) -> str:
    payload = {
        "user_id": user_id,
        "phone": phone,
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRE_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def verify_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Токен истёк")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Недействительный токен")


async def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    """Dependency — проверяет токен и возвращает данные пользователя"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Требуется авторизация")
    token = authorization.split(" ")[1]
    return verify_token(token)


@app.on_event("startup")
async def startup():
    await create_tables()


# ─── РЕГИСТРАЦИЯ ──────────────────────────────────────────────────────────────
@app.post("/register", response_model=RegisterResponse)
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.phone == data.phone))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Пользователь с таким номером уже существует")

    password_hash = bcrypt.hashpw(
        data.password.encode("utf-8"), bcrypt.gensalt()
    ).decode("utf-8")

    user = User(phone=data.phone, password_hash=password_hash, is_verified=True)
    db.add(user)
    await db.commit()
    await db.refresh(user)

    return RegisterResponse(success=True, message="Регистрация прошла успешно")


# ─── ЛОГИН → возвращает JWT токен ─────────────────────────────────────────────
@app.post("/login")
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    if data.phone:
        result = await db.execute(select(User).where(User.phone == data.phone))
    elif data.email:
        result = await db.execute(select(User).where(User.email == data.email))
    else:
        raise HTTPException(status_code=400, detail="Укажите телефон или email")

    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    if not bcrypt.checkpw(data.password.encode("utf-8"), user.password_hash.encode("utf-8")):
        raise HTTPException(status_code=401, detail="Неверный пароль")

    token = create_token(user.id, user.phone or user.email)

    return {
        "success": True,
        "token": token,
        "user_id": user.id
    }


# ─── ПРОВЕРКА ТОКЕНА (используется фронтом при загрузке страницы) ─────────────
@app.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Возвращает данные текущего пользователя если токен валиден"""
    return {"user_id": current_user["user_id"], "phone": current_user["phone"]}


# ─── HH ENDPOINTS (без изменений) ────────────────────────────────────────────
HH_CLIENT_ID     = settings.HH_CLIENT_ID
HH_CLIENT_SECRET = settings.HH_CLIENT_SECRET
REACT_APP_URL    = "http://localhost:5173"


@app.get("/callback")
async def callback(code: str):
    return RedirectResponse(url=f"{REACT_APP_URL}/auth?code={code}")


@app.post("/api/exchange-code")
async def exchange_code(payload: dict, db: AsyncSession = Depends(get_db)):
    code = payload.get("code")
    async with httpx.AsyncClient() as client:
        # 1. Меняем код на HH токен
        response = await client.post("https://hh.ru/oauth/token", data={
            "grant_type": "authorization_code",
            "client_id": HH_CLIENT_ID,
            "client_secret": HH_CLIENT_SECRET,
            "code": code,
            "redirect_uri": "http://localhost:8000/callback"
        })
        hh_data = response.json()

        if "access_token" not in hh_data:
            raise HTTPException(status_code=400, detail="Ошибка получения токена HH")

        hh_token = hh_data["access_token"]

        # 2. Получаем профиль работодателя из HH
        me_response = await client.get(
            "https://api.hh.ru/me",
            headers={"Authorization": f"Bearer {hh_token}", "User-Agent": "AI-Talent-Genome/1.0"}
        )
        hh_user = me_response.json()
        hh_id = str(hh_user.get("id", ""))
        hh_email = hh_user.get("email")

        # 3. Ищем пользователя в БД по hh_id или email
        user = None
        if hh_email:
            result = await db.execute(select(User).where(User.email == hh_email))
            user = result.scalar_one_or_none()

        # 4. Если нет — создаём
        if not user:
            # Генерируем случайный хеш пароля (пользователь входит через HH, пароль не нужен)
            dummy_hash = bcrypt.hashpw(hh_id.encode(), bcrypt.gensalt()).decode()
            user = User(
                email=hh_email,
                password_hash=dummy_hash,
                is_verified=True,
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)

        # 5. Создаём наш JWT
        jwt_token = create_token(user.id, hh_email or hh_id)

        return {
            "access_token": hh_token,   # для HH API запросов
            "token": jwt_token,          # наш JWT для авторизации
        }


@app.get("/api/hh/vacancies")
async def get_vacancies(authorization: Optional[str] = Header(None)):
    if not authorization: raise HTTPException(status_code=401)
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://api.hh.ru/vacancies",
            params={"employer_id": "5700680", "per_page": 20},
            headers={"Authorization": authorization, "User-Agent": "..."}
        )
        return response.json()


@app.get("/api/hh/vacancy/{vacancy_id}")
async def get_vacancy_details(vacancy_id: str, authorization: Optional[str] = Header(None)):
    if not authorization: raise HTTPException(status_code=401)
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"https://api.hh.ru/vacancies/{vacancy_id}",
            headers={"Authorization": authorization, "User-Agent": "Mozilla/5.0"}
        )
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code)
        return response.json()


@app.get("/api/hh/negotiations/collections")
async def get_collections(vacancy_id: str, authorization: Optional[str] = Header(None)):
    if not authorization: raise HTTPException(status_code=401)
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://api.hh.ru/negotiations",
            params={"vacancy_id": vacancy_id},
            headers={"Authorization": authorization, "User-Agent": "..."}
        )
        return {"collections": response.json().get("collections", [])}


@app.get("/api/hh/negotiations")
async def get_negotiations(vacancy_id: str, collection_id: str, authorization: Optional[str] = Header(None)):
    if not authorization: raise HTTPException(status_code=401)
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://api.hh.ru/negotiations",
            params={"vacancy_id": vacancy_id, "collection_id": collection_id, "per_page": 50},
            headers={"Authorization": authorization, "User-Agent": "..."}
        )
        return response.json()


@app.get("/api/hh/negotiations/page")
async def get_negotiations_page(
    collection_url: str, page: int = 0, authorization: Optional[str] = Header(None)
):
    if not authorization: raise HTTPException(status_code=401)
    parsed_url   = urlparse(collection_url)
    query_params = parse_qs(parsed_url.query)
    vacancy_id   = query_params.get("vacancy_id", [None])[0]
    base_url     = f"{parsed_url.scheme}://{parsed_url.netloc}{parsed_url.path}"
    async with httpx.AsyncClient() as client:
        response = await client.get(
            base_url,
            params={"page": page, "per_page": 50, "vacancy_id": vacancy_id},
            headers={"Authorization": authorization, "User-Agent": "..."}
        )
        return response.json()
    
@app.post("/check-phone")
async def check_phone(payload: dict, db: AsyncSession = Depends(get_db)):
    phone = payload.get("phone")
    result = await db.execute(select(User).where(User.phone == phone))
    user = result.scalar_one_or_none()
    return {"exists": user is not None}