import os
from dotenv import load_dotenv
from google import genai
from fastapi import APIRouter , Depends
from pydantic import BaseModel
from sqlmodel import Session , select
from app.database.models.post_queue import PostQueue
from app.database.database import get_session


router = APIRouter()
load_dotenv()

class captionRequest(BaseModel):
    keyword : str

class CaptionUpdate(BaseModel):
    post_id: int
    instagram_caption: str
    facebook_caption: str
    linkedin_caption: str

class RegenerateCaption(BaseModel): 
    instagram_caption : str
    facebook_caption : str
    linkedin_caption : str
    keywords : str


# The client gets the API key from the environment variable `GEMINI_API_KEY`.
client = genai.Client(api_key= os.getenv("GEMINI_API_KEY"))
def generateCaption(keyword):
    response = client.models.generate_content(
    model="gemini-2.5-flash", contents= f"""
    Generate the following three things based on the given keywords and description:

1. An attractive Instagram caption (1–2 lines, with emojis, no long text).
2. A Facebook post description (3–4 lines, friendly and engaging).
3. A LinkedIn article-style description (professional, 5–7 lines).

Keywords: {keyword}

Return in this format:

INSTAGRAM:
<caption>

FACEBOOK:
<description>

LINKEDIN:
<article>

 """
)
     # Extract full text
    text = response.text

    # Split into sections using markers
    insta = text.split("INSTAGRAM:")[1].split("FACEBOOK:")[0].strip()
    facebook = text.split("FACEBOOK:")[1].split("LINKEDIN:")[0].strip()
    linkedin = text.split("LINKEDIN:")[1].strip()

    return insta, facebook, linkedin


# insta , face, linked = generateCaption("productive manoj , manoj is great, manoj is stable focus , manoj is consistent")
# print(insta +"\n")
# print(face)
# print(linked)

def extract_section(text, start, end=None):
    if start not in text:
        return ""
    part = text.split(start, 1)[1]
    if end and end in part:
        part = part.split(end, 1)[0]
    return part.strip()



@router.post("/Regenerate/Caption")
async def regenerate_caption(oldCaption : RegenerateCaption):
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=f"""
    You are a professional social media content editor.

Your task:
Rewrite and improve the following captions based on the given change instructions.
DO NOT change the core meaning.
Improve clarity, engagement, tone, and CTA. and also add the hashtags and tags 
Keep each platform’s style.
1. An attractive Instagram caption (1–2 lines, with emojis, no long text).
2. A Facebook post description (3–4 lines, friendly and engaging).
3. A LinkedIn article-style description (professional, 5–7 lines).

CHANGE INSTRUCTIONS (IMPORTANT):
{oldCaption.keywords}

----------------
OLD CAPTIONS
----------------

INSTAGRAM:
{oldCaption.instagram_caption}

FACEBOOK:
{oldCaption.facebook_caption}

LINKEDIN:
{oldCaption.linkedin_caption}

    STRICT FORMAT (DO NOT CHANGE):

    INSTAGRAM:
    <text>

    FACEBOOK:
    <text>

    LINKEDIN:
    <text>

    """
    )

    text = response.text or ""
    print(text)
    insta = extract_section(text, "INSTAGRAM:", "FACEBOOK:")
    facebook = extract_section(text, "FACEBOOK:", "LINKEDIN:")
    linkedin = extract_section(text, "LINKEDIN:")

    return [
        insta,
        facebook,
        linkedin
    ]


@router.post("/generateCaption")
def generateCaption(request: captionRequest):

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=f"""
Generate the following three things based on the given keywords:
and please follow below intruction strickly and also add each caption end of hashtags and tags
1. An attractive Instagram caption (1–2 lines, with emojis, no long text).
2. A Facebook post description (3–4 lines, friendly and engaging).
3. A LinkedIn article-style description (professional, 5–7 lines).
and why you change the sequence of generating caption not disturb squence and give caption below format
STRICT FORMAT (DO NOT CHANGE):

INSTAGRAM:
<text>

FACEBOOK:
<text>

LINKEDIN:
<text>

Keywords: {request.keyword}
"""
    )

    text = response.text or ""
    # print(text)
    insta = extract_section(text, "INSTAGRAM:", "FACEBOOK:")
    facebook = extract_section(text, "FACEBOOK:", "LINKEDIN:")
    linkedin = extract_section(text, "LINKEDIN:")
    # print("this is new ==========================================================")
    # print("instagram : ",insta)
    # print("facebook : ",facebook)
    # print("linkedin : ",linkedin)

    return [
        insta,
        facebook,
        linkedin
    ]






@router.post("/setCaption")
async def setCaption(
    data : CaptionUpdate,
    session : Session = Depends(get_session)):
    
    statement = select(PostQueue).where(PostQueue.id == data.post_id)
    post = session.exec(statement).first()

    post.content_instagram = data.instagram_caption
    post.content_facebook = data.facebook_caption
    post.content_linkedin = data.linkedin_caption
    print(data)
    session.add(post)
    session.commit()
    session.refresh(post)

    return {
       "msg" :  "caption is Updated Successfully"
    }