import os
from dotenv import load_dotenv
from fastapi import APIRouter,FastAPI, HTTPException, Query, Depends
from fastapi.responses import RedirectResponse
import requests, urllib.parse
from pydantic import BaseModel
from app.database.database import get_session
from app.database.models.social_accounts import SocialAccounts
from sqlmodel import Session , select
from app.database.routers.social_accounts import router as social_accounts_router
load_dotenv()
router = APIRouter()


app = FastAPI()
app.include_router(social_accounts_router)
# -------------------------------------------------------
# META (Facebook + Instagram) APP CREDENTIALS
# -------------------------------------------------------
APP_ID = os.getenv("FB_APP_ID")
APP_SECRET = os.getenv("FB_SECRET_KEY")
REDIRECT_URI = "http://localhost:8000/meta/callback"

SCOPES = [
    "pages_manage_posts",
    "pages_read_engagement",
    "pages_show_list",
    "instagram_basic",
    "instagram_content_publish",
    "public_profile",
    "business_management"
]


# -------------------------------------------------------
# 1️⃣ CONNECT META (FACEBOOK + INSTAGRAM) — LOGIN
# -------------------------------------------------------

@router.get("/connect/meta")
def connect_meta():
    auth_url = (
        "https://www.facebook.com/v19.0/dialog/oauth?"
        f"client_id={APP_ID}"
        f"&redirect_uri={urllib.parse.quote(REDIRECT_URI)}"
        f"&scope={','.join(SCOPES)}"
    )
    return RedirectResponse(auth_url)

# -------------------------------------------------------
# 2️⃣ CALLBACK → GET USER TOKEN + PAGES
# -------------------------------------------------------
@router.get("/meta/callback")
def meta_callback(code: str = None, error: str = None, session: Session = Depends(get_session)):

    if error:
        raise HTTPException(status_code=400, detail=f"OAuth Error: {error}")
    if not code:
        raise HTTPException(status_code=400, detail="Authorization code missing")

    # Step 1: Get short lived token (required to fetch pages)
    token_url = "https://graph.facebook.com/v19.0/oauth/access_token"
    params = {
        "client_id": APP_ID,
        "redirect_uri": REDIRECT_URI,
        "client_secret": APP_SECRET,
        "code": code
    }

    short_res = requests.get(token_url, params=params).json()
    short_user_token = short_res["access_token"]

    # Step 2: Get pages using short user token
    pages_url = "https://graph.facebook.com/v19.0/me/accounts"
    pages_res = requests.get(pages_url, params={"access_token": short_user_token}).json()

    pages = pages_res.get("data", [])
    saved_pages = []

    for page in pages:
        page_id = page["id"]
        short_page_token = page["access_token"]  # short-lived page token

        # Step 3: Convert Page Token -> Long-lived Page Token
        page_exchange_url = "https://graph.facebook.com/v19.0/oauth/access_token"
        page_exchange_params = {
            "grant_type": "fb_exchange_token",
            "client_id": APP_ID,
            "client_secret": APP_SECRET,
            "fb_exchange_token": short_page_token
        }

        long_page_res = requests.get(page_exchange_url, params=page_exchange_params).json()
        long_page_token = long_page_res["access_token"]

        # Save the connected Page
        social = SocialAccounts(
            user_id="auth0|1",
            gmail="kannormanoj025@gmail.com",
            platform="facebook",
            access_token=long_page_token,
            platform_id=page_id,
            username=page["name"]
                   # PAGE ACCESS TOKEN
        )
        session.add(social)
        session.commit()
        saved_pages.append({
            "page_id": page_id,
            "page_name": page["name"],
            "page_access_token": long_page_token
        })

    session.commit()

    return RedirectResponse(url="http://localhost:5173/accounts?status=success")

# -------------------------------------------------------
# 4️⃣ GET INSTAGRAM BUSINESS ACCOUNT ID
# -------------------------------------------------------
@router.get("/connect/instagram")
def instagram_account(session: Session = Depends(get_session)):
    
    fb = session.exec(
        select(SocialAccounts).where(
            SocialAccounts.platform == "facebook"
        )
    ).first()

    if not fb:
        raise HTTPException(status_code=404, detail="Facebook page record not found")

    page_access_token = fb.access_token
    user = fb.username
    page_id = fb.platform_id

    # 1. Graph API URL with Nested Fields (Ek hi call me ID, Username, Name)
    url = f"https://graph.facebook.com/v19.0/{page_id}"
    params = {
        "fields": "instagram_business_account{id,username,name}", 
        "access_token": page_access_token
    }

    res = requests.get(url, params=params)
    data = res.json()
    
    # 2. Data Extract karna (Safely)
    ig_data = data.get("instagram_business_account", {})
    
    if not ig_data:
        return {"error": "No Instagram account linked to this Page"}

    # 3. Database Entry
    social = SocialAccounts(
        user_id="auth0|1",
        gmail="kannormanoj025@gmail.com",
        platform="instagram",
        access_token=page_access_token,  # Ye token save karna zaruri hai automation ke liye
        platform_id=ig_data.get("id"),
        username=user 
    )

    session.add(social)
    session.commit()
    
    # Return both DB ID and IG Data
    return RedirectResponse(url="http://localhost:5173/accounts?status=success")