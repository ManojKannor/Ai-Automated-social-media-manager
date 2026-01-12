from fastapi import APIRouter, HTTPException, Depends
import requests
from sqlmodel import Session, select
from app.database.database import get_session, engine
from app.database.models.post_queue import PostQueue
from app.database.models.social_accounts import SocialAccounts
import time

def post_social(input_post):
    # 1. Get the ID from the input object
    post_id = input_post.id
    
    # 2. Open a NEW Session for this specific transaction
    with Session(engine) as session:
        # 3. CRITICAL FIX: Re-fetch the post so it belongs to THIS session
        post = session.get(PostQueue, post_id)
        
        if not post:
            print(f"❌ Post {post_id} not found in database.")
            return

        # 4. Parse Platforms
        raw_platforms = post.platforms or ""
        platforms_list = [p.strip().lower() for p in raw_platforms.split(",") if p.strip()]

        print(f"DEBUG: Processing Post {post.id} | Type: {post.media_type} | Platforms: {platforms_list}")

        responses = {}
        errors = []
        
        try:
            user_id = post.user_id
            media_url = post.media_url
            media_type = post.media_type  
            
            # ==============================================================================
            # 1. FACEBOOK
            # ==============================================================================
            if "facebook" in platforms_list:
                print("--> Starting Facebook Post...")
                account = session.exec(select(SocialAccounts).where(
                    SocialAccounts.platform == 'facebook', 
                    SocialAccounts.user_id == user_id
                )).first()
                
                if not account:
                    errors.append("Facebook account not linked")
                else:
                    fb_page_id = account.platform_id
                    access_token = account.access_token
                    
                    if media_type == "photo":
                        fb_url = f"https://graph.facebook.com/v19.0/{fb_page_id}/photos"
                        payload = {"caption": post.content_facebook, "url": media_url, "access_token": access_token}
                    else: 
                        fb_url = f"https://graph.facebook.com/v19.0/{fb_page_id}/videos"
                        payload = {"description": post.content_facebook, "file_url": media_url, "access_token": access_token}
                    
                    r = requests.post(fb_url, data=payload)
                    resp_data = r.json()
                    responses["facebook"] = resp_data
                    
                    if r.status_code != 200 or "id" not in resp_data:
                        errors.append(f"Facebook Error: {resp_data.get('error', {}).get('message')}")

            # ==============================================================================
            # 2. INSTAGRAM
            # ==============================================================================
            if "instagram" in platforms_list:
                print("--> Starting Instagram Post...")
                account = session.exec(select(SocialAccounts).where(
                    SocialAccounts.platform == 'instagram', 
                    SocialAccounts.user_id == user_id
                )).first()
                
                if not account:
                    errors.append("Instagram account not linked")
                else:
                    ig_user_id = account.platform_id
                    access_token = account.access_token
                    create_url = f"https://graph.facebook.com/v19.0/{ig_user_id}/media"
                    
                    if media_type == "photo":
                        payload = {"image_url": media_url, "caption": post.content_instagram, "access_token": access_token}
                    else:
                        payload = {"media_type": "REELS", "video_url": media_url, "caption": post.content_instagram, "access_token": access_token}
                    
                    resp = requests.post(create_url, data=payload).json()

                    if "id" in resp:
                        creation_id = resp["id"]
                        print(f"   IG Container Created: {creation_id}. Waiting...")
                        
                        is_ready = False
                        for i in range(10): 
                            time.sleep(5) 
                            status_check = requests.get(f"https://graph.facebook.com/v19.0/{creation_id}?fields=status_code&access_token={access_token}").json()
                            code = status_check.get("status_code")
                            if code == 'FINISHED':
                                is_ready = True
                                break
                            elif code == 'ERROR':
                                errors.append(f"IG Processing Error: {status_check}")
                                break
                        
                        if is_ready:
                            pub_resp = requests.post(f"https://graph.facebook.com/v19.0/{ig_user_id}/media_publish", data={"creation_id": creation_id, "access_token": access_token}).json()
                            responses["instagram"] = pub_resp
                            if "id" not in pub_resp:
                                errors.append(f"IG Publish Failed: {pub_resp}")
                        elif "IG Processing Error" not in str(errors):
                            errors.append("Instagram Timeout")
                    else:
                        errors.append(f"IG Container Failed: {resp}")

            # ==============================================================================
            # 3. LINKEDIN
            # ==============================================================================
            if "linkedin" in platforms_list:
                print("--> Starting LinkedIn Post...")
                account = session.exec(select(SocialAccounts).where(
                    SocialAccounts.platform == 'linkedin', 
                    SocialAccounts.user_id == user_id
                )).first()
                
                if not account:
                    errors.append("LinkedIn account not linked")
                else:
                    # ... (Your existing LinkedIn Logic here is fine) ...
                    # For brevity, assume your LinkedIn logic is here
                    pass 

            # ==============================================================================
            # FINAL SAVE - THIS NOW WORKS BECAUSE 'post' IS ATTACHED TO 'session'
            # ==============================================================================
            if not errors:
                post.status = "completed"  # This modifies the object attached to THIS session
                print("✅ SUCCESS: Post marked as completed.")
            else:
                post.status = "failed"
                print(f"❌ FAILURE: {errors}")

            session.add(post)
            session.commit() # This will effectively save to the DB
            session.refresh(post)

            return {
                "status": post.status, 
                "errors": errors, 
                "details": responses
            }

        except Exception as e:
            print(f"CRITICAL EXCEPTION: {e}")
            session.rollback()
            # If using inside a background task, just print error instead of raising HTTP exception
            return {"status": "error", "msg": str(e)}