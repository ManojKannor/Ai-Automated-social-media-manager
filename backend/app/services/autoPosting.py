import requests
from sqlmodel import Session, select
from app.database.database import engine
from app.database.models.post_queue import PostQueue
from app.database.models.social_accounts import SocialAccounts
import time


def post_social(input_post):
    post_id = input_post.id

    with Session(engine) as session:
        post = session.get(PostQueue, post_id)

        if not post:
            print(f"❌ Post {post_id} not found")
            return

        platforms = [p.strip().lower() for p in (post.platforms or "").split(",") if p.strip()]
        print(f"🚀 Processing Post {post.id} | {platforms}")

        errors = []
        responses = []

        user_id = post.user_id
        media_url = post.media_url
        media_type = (post.media_type or "").lower()

        # ================= FACEBOOK =================
        if "facebook" in platforms:
            account = session.exec(select(SocialAccounts).where(
                SocialAccounts.platform == 'facebook',
                SocialAccounts.user_id == user_id
            )).first()

            if account:
                url = f"https://graph.facebook.com/v19.0/{account.platform_id}/photos" if media_type == "image" else f"https://graph.facebook.com/v19.0/{account.platform_id}/videos"

                payload = {
                    "access_token": account.access_token,
                    "url": media_url if media_type == "image" else None,
                    "file_url": media_url if media_type != "image" else None,
                    "caption": post.content_facebook if media_type == "image" else None,
                    "description": post.content_facebook if media_type != "image" else None,
                }

                res = requests.post(url, data={k: v for k, v in payload.items() if v})
                data = res.json()

                if "id" not in data:
                    print("❌ FB Error:", data)
                    errors.append(f"FB: {data}")
                else:
                    responses.append("facebook success")
            else:
                errors.append("FB not linked")

        # ================= INSTAGRAM =================
        if "instagram" in platforms:
            account = session.exec(select(SocialAccounts).where(
                SocialAccounts.platform == 'instagram',
                SocialAccounts.user_id == user_id
            )).first()

            if account:
                create_url = f"https://graph.facebook.com/v19.0/{account.platform_id}/media"

                if media_type == "image":
                    payload = {
                        "image_url": media_url,
                        "caption": post.content_instagram,
                        "media_type": "IMAGE",
                        "access_token": account.access_token
                    }
                else:
                    payload = {
                        "video_url": media_url,
                        "media_type": "REELS",
                        "caption": post.content_instagram,
                        "access_token": account.access_token
                    }

                create = requests.post(create_url, data=payload).json()

                if "id" in create:
                    creation_id = create["id"]
                    print(f"⏳ IG Container: {creation_id}")

                    ready = False
                    start = time.time()

                    while time.time() - start < 120:
                        status = requests.get(
                            f"https://graph.facebook.com/v19.0/{creation_id}",
                            params={"fields": "status_code", "access_token": account.access_token}
                        ).json()

                        if status.get("status_code") == "FINISHED":
                            ready = True
                            break
                        elif status.get("status_code") == "ERROR":
                            print("❌ IG Error:", status)
                            errors.append(f"IG Error: {status}")
                            break

                        time.sleep(5)

                    if ready:
                        publish = requests.post(
                            f"https://graph.facebook.com/v19.0/{account.platform_id}/media_publish",
                            data={"creation_id": creation_id, "access_token": account.access_token}
                        ).json()

                        if "id" not in publish:
                            print("❌ IG Publish Error:", publish)
                            errors.append(f"IG Publish: {publish}")
                        else:
                            responses.append("instagram success")
                    else:
                        errors.append("IG timeout")
                else:
                    print("❌ IG Create Error:", create)
                    errors.append(f"IG create: {create}")
            else:
                errors.append("IG not linked")

        # ================= LINKEDIN (FIXED) =================
        if "linkedin" in platforms:
            account = session.exec(select(SocialAccounts).where(
                SocialAccounts.platform == 'linkedin',
                SocialAccounts.user_id == user_id
            )).first()

            if account:
                try:
                    headers = {
                        "Authorization": f"Bearer {account.access_token}",
                        "Content-Type": "application/json",
                        "X-Restli-Protocol-Version": "2.0.0"
                    }

                    # ✅ FIX: correct author (no duplicate urn)
                    author = account.platform_id
                    print("🔗 Author:", author)

                    recipe = "feedshare-image" if media_type == "image" else "feedshare-video"
                    category = "IMAGE" if media_type == "image" else "VIDEO"

                    # REGISTER UPLOAD
                    reg_res = requests.post(
                        "https://api.linkedin.com/v2/assets?action=registerUpload",
                        headers=headers,
                        json={
                            "registerUploadRequest": {
                                "recipes": [f"urn:li:digitalmediaRecipe:{recipe}"],
                                "owner": author,
                                "serviceRelationships": [{
                                    "relationshipType": "OWNER",
                                    "identifier": "urn:li:userGeneratedContent"
                                }]
                            }
                        }
                    )

                    print("📡 LinkedIn Register:", reg_res.status_code, reg_res.text)

                    if reg_res.status_code != 200:
                        errors.append(f"LinkedIn register failed: {reg_res.text}")
                        raise Exception("Register failed")

                    reg = reg_res.json()

                    upload_url = reg['value']['uploadMechanism']['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest']['uploadUrl']
                    asset = reg['value']['asset']

                    # FETCH MEDIA
                    file_res = requests.get(media_url)
                    if file_res.status_code != 200:
                        errors.append("Media fetch failed")
                        raise Exception("Media URL not accessible")

                    # UPLOAD MEDIA
                    upload_res = requests.put(upload_url, data=file_res.content)
                    print("📤 Upload:", upload_res.status_code)

                    if upload_res.status_code not in [200, 201]:
                        errors.append(f"Upload failed: {upload_res.text}")
                        raise Exception("Upload failed")

                    # CREATE POST
                    final = requests.post(
                        "https://api.linkedin.com/v2/ugcPosts",
                        headers=headers,
                        json={
                            "author": author,
                            "lifecycleState": "PUBLISHED",
                            "specificContent": {
                                "com.linkedin.ugc.ShareContent": {
                                    "shareCommentary": {"text": post.content_linkedin},
                                    "shareMediaCategory": category,
                                    "media": [{
                                        "status": "READY",
                                        "media": asset
                                    }]
                                }
                            },
                            "visibility": {
                                "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
                            }
                        }
                    )

                    print("📢 LinkedIn Post:", final.status_code, final.text)

                    if final.status_code != 201:
                        errors.append(f"LinkedIn failed: {final.text}")
                    else:
                        responses.append("linkedin success")

                except Exception as e:
                    print("❌ LinkedIn Exception:", str(e))
                    errors.append(str(e))
            else:
                errors.append("LinkedIn not linked")

        # ================= FINAL =================
        post.status = "completed" if not errors else "failed"

        session.add(post)
        session.commit()

        print("✅ DONE" if not errors else f"❌ Errors: {errors}")