from fastapi import FastAPI, HTTPException, Depends, Header, Response, Request
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone, timedelta
import os
from dotenv import load_dotenv
import httpx
import uuid
from googleapiclient.discovery import build
import yt_dlp

load_dotenv()

app = FastAPI()

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB Connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "smartube_db")
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# YouTube API (will be set when user provides key)
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY", "")

# ============ PYDANTIC MODELS ============

class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    created_at: datetime

class SessionDataResponse(BaseModel):
    id: str
    email: str
    name: str
    picture: Optional[str] = None
    session_token: str

class Bookmark(BaseModel):
    bookmark_id: str
    user_id: str
    video_id: str
    video_title: str
    thumbnail: str
    duration: str
    channel_name: str
    category: str
    added_at: datetime

class ShareLink(BaseModel):
    share_id: str
    video_id: str
    share_code: str
    created_by: str
    created_at: datetime

class VideoSearchRequest(BaseModel):
    query: str
    category: str  # actuality, documentary, news, training
    max_results: int = 20

class SubscriptionPurchase(BaseModel):
    plan_type: str  # monthly, yearly, lifetime

# ============ AUTH HELPERS ============

async def get_current_user(
    authorization: Optional[str] = Header(None),
    request: Request = None
) -> Optional[User]:
    """Get current user from session token (cookie or header)"""
    session_token = None
    
    # Try cookie first
    if request:
        session_token = request.cookies.get("session_token")
    
    # Fallback to Authorization header
    if not session_token and authorization:
        if authorization.startswith("Bearer "):
            session_token = authorization.replace("Bearer ", "")
    
    if not session_token:
        return None
    
    # Find session
    session = await db.user_sessions.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    
    if not session:
        return None
    
    # Check expiry
    expires_at = session["expires_at"]
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if expires_at <= datetime.now(timezone.utc):
        return None
    
    # Get user
    user_doc = await db.users.find_one(
        {"user_id": session["user_id"]},
        {"_id": 0}
    )
    
    if not user_doc:
        return None
    
    return User(**user_doc)

async def require_auth(user: Optional[User] = Depends(get_current_user)) -> User:
    """Require authentication"""
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

async def check_subscription(user: User = Depends(require_auth)) -> User:
    """Check if user has active subscription"""
    # Check trial period (14 days)
    if user.subscription_type == "trial":
        if user.trial_start_date:
            trial_end = user.trial_start_date + timedelta(days=14)
            if datetime.now(timezone.utc) <= trial_end.replace(tzinfo=timezone.utc):
                return user
        # Trial expired
        await db.users.update_one(
            {"user_id": user.user_id},
            {"$set": {"subscription_type": "expired"}}
        )
        raise HTTPException(status_code=402, detail="Trial expired. Please subscribe.")
    
    # Check lifetime
    if user.subscription_type == "lifetime":
        return user
    
    # Check monthly/yearly subscription
    if user.subscription_type in ["monthly", "yearly"]:
        if user.subscription_end_date:
            sub_end = user.subscription_end_date
            if sub_end.tzinfo is None:
                sub_end = sub_end.replace(tzinfo=timezone.utc)
            if datetime.now(timezone.utc) <= sub_end:
                return user
        # Subscription expired
        await db.users.update_one(
            {"user_id": user.user_id},
            {"$set": {"subscription_type": "expired"}}
        )
        raise HTTPException(status_code=402, detail="Subscription expired. Please renew.")
    
    # Expired or no subscription
    raise HTTPException(status_code=402, detail="No active subscription. Please subscribe.")

# ============ AUTH ROUTES ============

@app.post("/api/auth/session")
async def exchange_session(
    response: Response,
    x_session_id: str = Header(..., alias="X-Session-ID")
):
    """Exchange session_id for session_token"""
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": x_session_id}
            )
            resp.raise_for_status()
            user_data = resp.json()
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid session: {str(e)}")
    
    session_response = SessionDataResponse(**user_data)
    
    # Check if user exists
    existing_user = await db.users.find_one(
        {"email": session_response.email},
        {"_id": 0}
    )
    
    if not existing_user:
        # Create new user
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        new_user = {
            "user_id": user_id,
            "email": session_response.email,
            "name": session_response.name,
            "picture": session_response.picture,
            "subscription_type": "trial",
            "trial_start_date": datetime.now(timezone.utc),
            "subscription_start_date": None,
            "subscription_end_date": None,
            "created_at": datetime.now(timezone.utc)
        }
        await db.users.insert_one(new_user)
        user_id_to_use = user_id
    else:
        user_id_to_use = existing_user["user_id"]
    
    # Create session
    await db.user_sessions.insert_one({
        "user_id": user_id_to_use,
        "session_token": session_response.session_token,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
        "created_at": datetime.now(timezone.utc)
    })
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_response.session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7 * 24 * 60 * 60,
        path="/"
    )
    
    return {"success": True, "session_token": session_response.session_token}

@app.get("/api/auth/me")
async def get_me(current_user: User = Depends(require_auth)):
    """Get current user info"""
    return current_user

@app.post("/api/auth/logout")
async def logout(
    response: Response,
    current_user: User = Depends(require_auth)
):
    """Logout user"""
    # Delete all sessions for this user
    await db.user_sessions.delete_many({"user_id": current_user.user_id})
    
    # Clear cookie
    response.delete_cookie("session_token", path="/")
    
    return {"success": True}

# ============ YOUTUBE VIDEO ROUTES ============

@app.post("/api/videos/search")
async def search_videos(
    request: VideoSearchRequest,
    user: User = Depends(check_subscription)
):
    """Search YouTube videos with filters"""
    if not YOUTUBE_API_KEY:
        raise HTTPException(status_code=503, detail="YouTube API key not configured")
    
    try:
        youtube = build('youtube', 'v3', developerKey=YOUTUBE_API_KEY)
        
        # Map categories to YouTube category IDs
        category_mapping = {
            "documentary": ["15"],  # Science & Technology
            "news": ["25"],  # News & Politics
            "actuality": ["25"],  # News & Politics
            "training": ["27", "28"]  # Education, Science & Technology
        }
        
        category_ids = category_mapping.get(request.category, ["0"])
        
        # Search for videos
        search_response = youtube.search().list(
            q=request.query,
            part='id,snippet',
            maxResults=50,
            type='video',
            videoDuration='long',  # Only videos longer than 20 minutes
            relevanceLanguage='en',
            order='relevance'
        ).execute()
        
        video_ids = [item['id']['videoId'] for item in search_response.get('items', [])]
        
        if not video_ids:
            return {"videos": []}
        
        # Get video details
        videos_response = youtube.videos().list(
            part='snippet,contentDetails,statistics',
            id=','.join(video_ids)
        ).execute()
        
        results = []
        for item in videos_response.get('items', []):
            # Parse duration
            duration = item['contentDetails']['duration']
            # Convert ISO 8601 duration to minutes
            import re
            match = re.search(r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?', duration)
            if match:
                hours = int(match.group(1) or 0)
                minutes = int(match.group(2) or 0)
                total_minutes = hours * 60 + minutes
                
                # Filter: only videos 20+ minutes
                if total_minutes >= 20:
                    results.append({
                        "video_id": item['id'],
                        "title": item['snippet']['title'],
                        "description": item['snippet']['description'],
                        "thumbnail": item['snippet']['thumbnails']['high']['url'],
                        "channel_name": item['snippet']['channelTitle'],
                        "duration": duration,
                        "duration_minutes": total_minutes,
                        "published_at": item['snippet']['publishedAt'],
                        "view_count": item['statistics'].get('viewCount', '0')
                    })
        
        # Limit results
        return {"videos": results[:request.max_results]}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@app.get("/api/videos/{video_id}/info")
async def get_video_info(
    video_id: str,
    user: User = Depends(check_subscription)
):
    """Get video information"""
    if not YOUTUBE_API_KEY:
        raise HTTPException(status_code=503, detail="YouTube API key not configured")
    
    try:
        youtube = build('youtube', 'v3', developerKey=YOUTUBE_API_KEY)
        
        response = youtube.videos().list(
            part='snippet,contentDetails,statistics',
            id=video_id
        ).execute()
        
        if not response.get('items'):
            raise HTTPException(status_code=404, detail="Video not found")
        
        item = response['items'][0]
        
        return {
            "video_id": item['id'],
            "title": item['snippet']['title'],
            "description": item['snippet']['description'],
            "thumbnail": item['snippet']['thumbnails']['high']['url'],
            "channel_name": item['snippet']['channelTitle'],
            "duration": item['contentDetails']['duration'],
            "published_at": item['snippet']['publishedAt'],
            "view_count": item['statistics'].get('viewCount', '0')
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get video info: {str(e)}")

@app.get("/api/videos/{video_id}/stream")
async def get_video_stream(
    video_id: str,
    user: User = Depends(check_subscription)
):
    """Get video stream URL (ad-free)"""
    try:
        ydl_opts = {
            'format': 'best[ext=mp4]',
            'quiet': True,
            'no_warnings': True,
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(f"https://www.youtube.com/watch?v={video_id}", download=False)
            
            return {
                "stream_url": info['url'],
                "title": info['title'],
                "duration": info['duration']
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get stream: {str(e)}")

# ============ BOOKMARK ROUTES ============

@app.get("/api/bookmarks")
async def get_bookmarks(user: User = Depends(require_auth)):
    """Get user's bookmarks"""
    bookmarks = await db.bookmarks.find(
        {"user_id": user.user_id},
        {"_id": 0}
    ).sort("added_at", -1).to_list(1000)
    
    return {"bookmarks": bookmarks}

@app.post("/api/bookmarks")
async def add_bookmark(
    video_id: str,
    video_title: str,
    thumbnail: str,
    duration: str,
    channel_name: str,
    category: str,
    user: User = Depends(check_subscription)
):
    """Add bookmark"""
    # Check if already bookmarked
    existing = await db.bookmarks.find_one({
        "user_id": user.user_id,
        "video_id": video_id
    })
    
    if existing:
        return {"success": True, "message": "Already bookmarked"}
    
    bookmark = {
        "bookmark_id": f"bm_{uuid.uuid4().hex[:12]}",
        "user_id": user.user_id,
        "video_id": video_id,
        "video_title": video_title,
        "thumbnail": thumbnail,
        "duration": duration,
        "channel_name": channel_name,
        "category": category,
        "added_at": datetime.now(timezone.utc)
    }
    
    await db.bookmarks.insert_one(bookmark)
    
    return {"success": True, "bookmark": bookmark}

@app.delete("/api/bookmarks/{video_id}")
async def remove_bookmark(
    video_id: str,
    user: User = Depends(require_auth)
):
    """Remove bookmark"""
    result = await db.bookmarks.delete_one({
        "user_id": user.user_id,
        "video_id": video_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    
    return {"success": True}

# ============ SUBSCRIPTION ROUTES ============

@app.get("/api/subscription/status")
async def get_subscription_status(user: User = Depends(require_auth)):
    """Get subscription status"""
    # Calculate trial days remaining
    trial_days_remaining = 0
    if user.subscription_type == "trial" and user.trial_start_date:
        trial_start = user.trial_start_date
        if trial_start.tzinfo is None:
            trial_start = trial_start.replace(tzinfo=timezone.utc)
        trial_end = trial_start + timedelta(days=14)
        remaining = trial_end - datetime.now(timezone.utc)
        trial_days_remaining = max(0, remaining.days)
    
    # Calculate subscription days remaining
    subscription_days_remaining = 0
    if user.subscription_type in ["monthly", "yearly"] and user.subscription_end_date:
        sub_end = user.subscription_end_date
        if sub_end.tzinfo is None:
            sub_end = sub_end.replace(tzinfo=timezone.utc)
        remaining = sub_end - datetime.now(timezone.utc)
        subscription_days_remaining = max(0, remaining.days)
    
    return {
        "subscription_type": user.subscription_type,
        "trial_days_remaining": trial_days_remaining,
        "subscription_days_remaining": subscription_days_remaining,
        "is_active": user.subscription_type in ["trial", "monthly", "yearly", "lifetime"]
    }

@app.post("/api/subscription/purchase")
async def purchase_subscription(
    purchase: SubscriptionPurchase,
    user: User = Depends(require_auth)
):
    """Purchase subscription (mock payment)"""
    now = datetime.now(timezone.utc)
    
    if purchase.plan_type == "monthly":
        subscription_end = now + timedelta(days=30)
        update_data = {
            "subscription_type": "monthly",
            "subscription_start_date": now,
            "subscription_end_date": subscription_end
        }
    elif purchase.plan_type == "yearly":
        subscription_end = now + timedelta(days=365)
        update_data = {
            "subscription_type": "yearly",
            "subscription_start_date": now,
            "subscription_end_date": subscription_end
        }
    elif purchase.plan_type == "lifetime":
        update_data = {
            "subscription_type": "lifetime",
            "subscription_start_date": now,
            "subscription_end_date": None
        }
    else:
        raise HTTPException(status_code=400, detail="Invalid plan type")
    
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$set": update_data}
    )
    
    return {"success": True, "subscription_type": update_data["subscription_type"]}

# ============ SHARE ROUTES ============

@app.post("/api/share/create")
async def create_share_link(
    video_id: str,
    user: User = Depends(require_auth)
):
    """Create shareable link"""
    share_code = f"{uuid.uuid4().hex[:8]}"
    
    share_link = {
        "share_id": f"sh_{uuid.uuid4().hex[:12]}",
        "video_id": video_id,
        "share_code": share_code,
        "created_by": user.user_id,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.share_links.insert_one(share_link)
    
    # Return deep link format
    deep_link = f"smartube://video/{share_code}"
    web_link = f"https://smartube.app/share/{share_code}"
    
    return {
        "success": True,
        "share_code": share_code,
        "deep_link": deep_link,
        "web_link": web_link
    }

@app.get("/api/share/{share_code}")
async def get_shared_video(share_code: str):
    """Get video from share code"""
    share_link = await db.share_links.find_one(
        {"share_code": share_code},
        {"_id": 0}
    )
    
    if not share_link:
        raise HTTPException(status_code=404, detail="Share link not found")
    
    return {
        "video_id": share_link["video_id"],
        "share_code": share_code
    }

# ============ HEALTH CHECK ============

@app.get("/")
async def root():
    return {
        "app": "SmarTube API",
        "status": "running",
        "youtube_api_configured": bool(YOUTUBE_API_KEY)
    }

@app.get("/api/health")
async def health():
    return {"status": "healthy"}
