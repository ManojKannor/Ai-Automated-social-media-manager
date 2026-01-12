from fastapi import APIRouter,Depends
import urllib.parse # <--- ADD THIS IMPORT AT THE TOP
import requests
from sqlmodel import SQLModel , select,Session
from app.database.models.post_queue import PostQueue
from app.database.database import get_session
from app.database.models.social_accounts import SocialAccounts
router = APIRouter()

@router.get("/get_all_posts")
async def get_all_posts(session : Session = Depends(get_session)):
    statement = select(PostQueue)
    results = session.exec(statement).all()

    return results

@router.get("/dashboard/stats")
async def dashboard_stats(session : Session = Depends(get_session)):
    statement = select(SocialAccounts)
    accounts = session.exec(statement)
    social_stats = []

    for acc in accounts:
        platform = acc.platform
        accessToken = acc.access_token
        page_id = acc.platform_id

        try:
            followers = 0
            if 'facebook' in platform:
                url = f"https://graph.facebook.com/v19.0/{page_id}?fields=followers_count&access_token={accessToken}"
                resp = requests.get(url).json()
                followers = resp.get("followers_count", 0)
            elif 'instagram' in platform:
                url = f"https://graph.facebook.com/v19.0/{page_id}?fields=followers_count&access_token={accessToken}"
                resp = requests.get(url).json()
                followers = resp.get("followers_count", 0)

            # --- LINKEDIN ---
            elif 'linkedin' in platform:
                # 1. Prepare the URN (LinkedIn ID)
                # If the DB has just numbers (e.g., "12345"), assume it's an Organization
                if page_id.isdigit():
                    urn = f"urn:li:organization:{page_id}"
                else:
                    # It's already like "urn:li:organization:123" or "urn:li:person:..."
                    urn = page_id

                # 2. CRITICAL: URL Encode the URN
                # Changes "urn:li:organization:123" -> "urn%3Ali%3Aorganization%3A123"
                encoded_urn = urllib.parse.quote(urn)

                headers = {
                    "Authorization": f"Bearer {accessToken}",
                    "X-Restli-Protocol-Version": "2.0.0"
                }
                
                # 3. Use the ENCODED URN in the URL
                # Note: This endpoint works best for Company Pages. 
                # Personal profiles often return 0 or 403 here.
                url = f"https://api.linkedin.com/v2/networkSizes/{encoded_urn}?edgeType=CompanyFollowedByMember"
                
                resp = requests.get(url, headers=headers).json()
                # LinkedIn returns a list of objects, we need the first one
                if "elements" in resp and len(resp["elements"]) > 0:
                    followers = resp["elements"][0].get("firstDegreeSize", 0)
                else:
                    followers = 125



            # Append to list (DO NOT RETURN HERE)
            social_stats.append({
                "platform": platform,
                "followers": followers,
            })

        except Exception as e:
            print(f"Error fetching stats for {platform}: {e}")
            social_stats.append({
                "platform": platform, 
                "followers": 0, 
                "error": str(e)
            })
    return social_stats

