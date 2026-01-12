from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import HTMLResponse
import requests
import cloudinary
import cloudinary.uploader
from app.captionGenerator import generateCaption

app = FastAPI()

# ---- Cloudinary Config ----
cloudinary.config(
    cloud_name="ds9qod3dw",
    api_key="246797847471888",
    api_secret="_--dk4LnnWnraH3Va_6Rq2yJR54"
)

# ---- Make.com Webhook ----
MAKE_WEBHOOK_URL = "https://hook.eu1.make.com/19pd3ungx25rckahxb5l5isavrsw3gvv"


# ---- HTML Page to Select File ----
@app.get("/", response_class=HTMLResponse)
def upload_page():
    return """
    <html>
        <body>
            <h2>Select Image to Upload (Laptop)</h2>
            <form action="/upload" enctype="multipart/form-data" method="post">
                <label for="postType">Select Post type </label>
                <select style ="margin:20px" id="posts" name="postType"> 
                    <option  value ="photo">Photo Media</option>
                    <option value ="video">Video Media</option>
                </select><br>
                <input name="file" type="file" required />
                <br><br>
                 <input name="title" type="text" placeholder="Enter Title" required />
                <br><br>
                <input name="keyword" type="text" placeholder="Enter the keyword" />
                <br><br>
                <button type="submit">Upload</button>
            </form>
        </body>
    </html>
    """

make_res = " "
# ---- Upload & Send to Make.com ----
@app.post("/upload")
async def upload_post(
    file: UploadFile = File(...),
    title: str = Form(...),
    keyword: str = Form("No caption"),
    postType: str = Form("No caption")
):
    

    insta,face,linked = generateCaption(keyword)

    if postType == "photo":
        result = cloudinary.uploader.upload(
        file.file,
        resource_type="image",
        format="jpg",
        fetch_format="jpg",
        quality="85",
        colorspace="srgb",
        crop="limit"
        )

        img_url = result["secure_url"]

        # Data going to MAKES
        payload = {
            "title": title,
            "caption": insta,
            "linkedin" : linked,
            "facebook" : face,
            "img_url": img_url,
            "postType" : postType
        }
        make_res = requests.post(MAKE_WEBHOOK_URL, json=payload)

    else:
        video_res = cloudinary.uploader.upload(
        file.file,
        resource_type="video",
        eager=[{
            "quality": "auto",
            "format": "mp4",
            "bit_rate": "500k",
            "width": 720,
            "crop": "scale"
        }]
        )

        video_url = video_res["eager"][0]["secure_url"]
    
        payload = {
            "title": title,
            "caption": insta,
            "linkedin" : linked,
            "facebook" : face,
            "video_url": video_url ,
            "postType" : postType 
        }
        make_res = requests.post(MAKE_WEBHOOK_URL, json=payload)

    

    return {
        "status": "success",
        "title": title,
        "insta" : insta,
        "face" : face,
        "linked" : linked,
        "filetype": postType,
        "url" : video_url if postType =="video" else img_url,
        "make_response": make_res.text
    }








# -------------------------------------------------------
# 3️⃣ POST TEXT TO FACEBOOK PAGE
# -------------------------------------------------------
class FacebookPost(BaseModel):
    page_access_token: str
    page_id: str
    message: str

@app.post("/post/facebook")
def post_facebook(data: FacebookPost):
    url = f"https://graph.facebook.com/v19.0/{data.page_id}/feed"
    payload = {
        "message": data.message,
        "access_token": data.page_access_token
    }

    res = requests.post(url, data=payload)
    if res.status_code != 200:
        raise HTTPException(res.status_code, res.text)

    return {"status": "Facebook Post Successful", "response": res.json()}

# -------------------------------------------------------
# 4️⃣ GET INSTAGRAM BUSINESS ACCOUNT ID
# -------------------------------------------------------
@app.get("/instagram/account")
def instagram_account(page_id: str, page_access_token: str):
    url = f"https://graph.facebook.com/v19.0/{page_id}"
    params = {
        "fields": "instagram_business_account",
        "access_token": page_access_token
    }

    res = requests.get(url, params=params)
    return res.json()

# -------------------------------------------------------
# 5️⃣ POST PHOTO TO INSTAGRAM
# -------------------------------------------------------
class InstagramPhoto(BaseModel):
    ig_user_id: str
    image_url: str
    caption: str
    page_access_token: str

@app.post("/post/instagram/photo")
def post_instagram_photo(data: InstagramPhoto):
    # Step 1: Create container
    container_url = f"https://graph.facebook.com/v19.0/{data.ig_user_id}/media"
    create_payload = {
        "image_url": data.image_url,
        "caption": data.caption,
        "access_token": data.page_access_token
    }
    container_res = requests.post(container_url, data=create_payload)

    if container_res.status_code != 200:
        raise HTTPException(container_res.status_code, container_res.text)

    container_id = container_res.json().get("id")

    if not container_id:
        raise HTTPException(400, "Failed to create Instagram container")

    # Step 2: Publish container
    publish_url = f"https://graph.facebook.com/v19.0/{data.ig_user_id}/media_publish"
    publish_payload = {
        "creation_id": container_id,
        "access_token": data.page_access_token
    }
    publish_res = requests.post(publish_url, data=publish_payload)

    if publish_res.status_code != 200:
        raise HTTPException(publish_res.status_code, publish_res.text)

    return {"status": "Instagram Photo Published", "response": publish_res.json()}
