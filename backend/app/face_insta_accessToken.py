import os
import json # Changed: Added json
import urllib.parse
from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI, HTTPException, Query, Depends
from fastapi.responses import RedirectResponse
import requests
from app.database.database import get_session
from app.database.models.social_accounts import SocialAccounts
from sqlmodel import Session, select

load_dotenv()
router = APIRouter()

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
def connect_meta(
    user_id: str = Query(..., description="User ID from Auth0"), # Changed: Added user_id param
    gmail: str = Query(..., description="User Email")            # Changed: Added gmail param
):
    # Changed: Pack user data into state parameter
    state_data = json.dumps({"user_id": user_id, "gmail": gmail})
    encoded_state = urllib.parse.quote(state_data)

    auth_url = (
        "https://www.facebook.com/v19.0/dialog/oauth?"
        f"client_id={APP_ID}"
        f"&redirect_uri={urllib.parse.quote(REDIRECT_URI)}"
        f"&scope={','.join(SCOPES)}"
        f"&state={encoded_state}" # Changed: Added state to URL
    )
    return RedirectResponse(auth_url)

# -------------------------------------------------------
# 2️⃣ CALLBACK → GET USER TOKEN + PAGES
# -------------------------------------------------------
@router.get("/meta/callback")
def meta_callback(
    code: str = None, 
    error: str = None, 
    state: str = None, # Changed: Added state param
    session: Session = Depends(get_session)
):

    if error:
        raise HTTPException(status_code=400, detail=f"OAuth Error: {error}")
    if not code:
        raise HTTPException(status_code=400, detail="Authorization code missing")

    # Changed: Extract user_id and gmail from state
    try:
        decoded_state = urllib.parse.unquote(state)
        user_data = json.loads(decoded_state)
        actual_user_id = user_data["user_id"]
        actual_gmail = user_data["gmail"]
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid state parameter")

    # Step 1: Get short lived token (required to fetch pages)
    token_url = "https://graph.facebook.com/v19.0/oauth/access_token"
    params = {
        "client_id": APP_ID,
        "redirect_uri": REDIRECT_URI,
        "client_secret": APP_SECRET,
        "code": code
    }

    short_res = requests.get(token_url, params=params).json()
    if "error" in short_res:
         raise HTTPException(status_code=400, detail=str(short_res))
         
    short_user_token = short_res["access_token"]

    # Step 2: Get pages using short user token
    pages_url = "https://graph.facebook.com/v19.0/me/accounts"
    pages_res = requests.get(pages_url, params={"access_token": short_user_token}).json()

    pages = pages_res.get("data", [])

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
        long_page_token = long_page_res.get("access_token", short_page_token)

        # Check if account exists to update it, or create new
        existing_account = session.exec(select(SocialAccounts).where(
            SocialAccounts.user_id == actual_user_id,
            SocialAccounts.platform_id == page_id
        )).first()

        if existing_account:
            existing_account.access_token = long_page_token
            existing_account.username = page["name"]
            existing_account.gmail = actual_gmail
            session.add(existing_account)
        else:
            # Save the connected Page
            social = SocialAccounts(
                user_id=actual_user_id,      # Changed: Use actual user_id
                gmail=actual_gmail,          # Changed: Use actual gmail
                platform="facebook",
                access_token=long_page_token,
                platform_id=page_id,
                username=page["name"]
            )
            session.add(social)

    session.commit()

    return RedirectResponse(url="http://localhost:5173/accounts?status=success")

# -------------------------------------------------------
# 4️⃣ GET INSTAGRAM BUSINESS ACCOUNT ID
# -------------------------------------------------------
@router.get("/connect/instagram")
def instagram_account(
    user_id: str = Query(..., description="User ID"), # Changed: Added user_id param
    gmail: str = Query(..., description="User Email"), # Changed: Added gmail param
    session: Session = Depends(get_session)
):
    
    # Changed: Find Facebook account for THIS specific user
    fb = session.exec(
        select(SocialAccounts).where(
            SocialAccounts.platform == "facebook",
            SocialAccounts.user_id == user_id
        )
    ).first()

    if not fb:
        raise HTTPException(status_code=404, detail="Facebook page not found. Please connect Facebook first.")

    page_access_token = fb.access_token
    page_id = fb.platform_id

    # 1. Graph API URL with Nested Fields
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

    # Changed: Update or Create logic with actual user_id
    ig_id = ig_data.get("id")
    ig_username = ig_data.get("username")

    existing_ig = session.exec(select(SocialAccounts).where(
        SocialAccounts.user_id == user_id,
        SocialAccounts.platform_id == ig_id
    )).first()

    if existing_ig:
        existing_ig.access_token = page_access_token
        existing_ig.username = ig_username
        existing_ig.gmail = gmail
        session.add(existing_ig)
    else:
        # Database Entry
        social = SocialAccounts(
            user_id=user_id,         # Changed: Use actual user_id
            gmail=gmail,             # Changed: Use actual gmail
            platform="instagram",
            access_token=page_access_token, 
            platform_id=ig_id,
            username=ig_username 
        )
        session.add(social)

    session.commit()
    
    return RedirectResponse(url="http://localhost:5173/accounts?status=success")