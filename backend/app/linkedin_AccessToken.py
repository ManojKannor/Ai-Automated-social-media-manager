import os
from dotenv import load_dotenv
from fastapi import FastAPI ,Depends, APIRouter, Request, HTTPException, Query
from fastapi.responses import RedirectResponse
import requests, urllib.parse
import jwt  # pip install pyjwt
from pydantic import BaseModel
from app.database.database import get_session
from sqlmodel import SQLModel,Session
from app.database.models.social_accounts import SocialAccounts
load_dotenv()
router = APIRouter()
app = FastAPI()

# ----------------------------
# LinkedIn App Credentials
# ----------------------------
CLIENT_ID = os.getenv("li_CLIENT_ID")
CLIENT_SECRET = os.getenv("li_SECRET_KEY")
REDIRECT_URI = "http://localhost:8000/linkedin/callback"

# ----------------------------
# 1️⃣ Generate LinkedIn OAuth URL
# ----------------------------
@router.get("/connect/linkedin")
def connect_linkedin():
    scopes = "openid profile email w_member_social"
    auth_url = (
        "https://www.linkedin.com/oauth/v2/authorization?"
        f"response_type=code&client_id={CLIENT_ID}"
        f"&redirect_uri={urllib.parse.quote(REDIRECT_URI)}"
        f"&scope={urllib.parse.quote(scopes)}"
    )
    return RedirectResponse(auth_url)

# ----------------------------
# 2️⃣ Callback → Get Access Token + User Info
# ----------------------------
@router.get("/linkedin/callback")
def linkedin_callback(
    code: str = Query(None),
    error: str = Query(None),
    error_description: str = Query(None),
    session : Session = Depends(get_session)
):
    if error:
        raise HTTPException(status_code=400, detail=f"{error}: {error_description}")

    if not code:
        raise HTTPException(status_code=400, detail="Authorization code not provided by LinkedIn")

    # Exchange code for access token
    token_url = "https://www.linkedin.com/oauth/v2/accessToken"
    data = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": REDIRECT_URI,
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET
    }
    res = requests.post(token_url, data=data)
    if res.status_code != 200:
        raise HTTPException(status_code=res.status_code, detail=res.text)

    token_data = res.json()
    linkedin_access_token = token_data.get("access_token")
    if not linkedin_access_token:
        raise HTTPException(status_code=400, detail="Access token not received")

    # Get user info using OIDC userinfo endpoint
    userinfo_url = "https://api.linkedin.com/v2/userinfo"
    headers = {"Authorization": f"Bearer {linkedin_access_token}"}
    user_res = requests.get(userinfo_url, headers=headers)
    if user_res.status_code != 200:
        raise HTTPException(status_code=user_res.status_code, detail=user_res.text)

    user_data = user_res.json()
    person_urn = f"urn:li:person:{user_data.get('sub')}"

    social = SocialAccounts(
        user_id = "auth0|1",
        gmail="kannormanoj025@gmail.com",
        platform="linkedin",
        access_token=linkedin_access_token,
        platform_id= person_urn,
        username = user_data["name"]
    )

    session.add(social)
    session.commit()

    return RedirectResponse(url="http://localhost:5173/accounts?status=success")

