from fastapi import FastAPI, HTTPException, Depends, Header, Response, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
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

# ============ STATIC PAGES FOR OAUTH ============

@app.get("/", response_class=HTMLResponse)
async def home_page():
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>SmarTube - Ad-Free YouTube Experience</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
            h1 { color: #ff0000; }
            .feature { margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 8px; }
        </style>
    </head>
    <body>
        <h1>🥷 SmarTube</h1>
        <p><strong>Cut Ads, Shorts and Nonsense</strong></p>
        <p>SmarTube is a mobile app that lets you watch quality YouTube content (20+ minutes) without ads.</p>
        
        <div class="feature">
            <h3>Features:</h3>
            <ul>
                <li>Ad-free video playback</li>
                <li>Focus on documentaries, news, and educational content</li>
                <li>Videos 20+ minutes only - no shorts!</li>
                <li>Bookmark your favorite videos</li>
                <li>Background audio playback</li>
            </ul>
        </div>
        
        <p>Download the app from the Google Play Store (coming soon).</p>
        <p>Contact: <a href="mailto:support@smartube.app">support@smartube.app</a></p>
    </body>
    </html>
    """

@app.get("/privacy", response_class=HTMLResponse)
async def privacy_policy():
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Privacy Policy - SmarTube</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; line-height: 1.6; }
            h1 { color: #333; }
            h2 { color: #666; margin-top: 30px; }
        </style>
    </head>
    <body>
        <h1>Privacy Policy</h1>
        <p><strong>Last updated:</strong> March 2025</p>
        
        <h2>1. Information We Collect</h2>
        <p>SmarTube collects minimal information necessary to provide our service:</p>
        <ul>
            <li><strong>Google Account Information:</strong> When you sign in with Google, we receive your email address, name, and profile picture.</li>
            <li><strong>Bookmarks:</strong> Videos you choose to bookmark are stored in our database.</li>
        </ul>
        
        <h2>2. How We Use Your Information</h2>
        <p>We use your information to:</p>
        <ul>
            <li>Authenticate your account</li>
            <li>Save and sync your bookmarks across devices</li>
            <li>Provide personalized video recommendations</li>
        </ul>
        
        <h2>3. Data Storage</h2>
        <p>Your data is stored securely on MongoDB Atlas servers. We do not sell or share your personal information with third parties.</p>
        
        <h2>4. Third-Party Services</h2>
        <p>SmarTube uses:</p>
        <ul>
            <li>Google Sign-In for authentication</li>
            <li>YouTube API for video content</li>
        </ul>
        
        <h2>5. Data Deletion</h2>
        <p>You can request deletion of your account and data by contacting us at support@smartube.app.</p>
        
        <h2>6. Contact</h2>
        <p>For privacy concerns, contact: support@smartube.app</p>
    </body>
    </html>
    """

@app.get("/terms", response_class=HTMLResponse)
async def terms_of_service():
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Terms of Service - SmarTube</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; line-height: 1.6; }
            h1 { color: #333; }
            h2 { color: #666; margin-top: 30px; }
        </style>
    </head>
    <body>
        <h1>Terms of Service</h1>
        <p><strong>Last updated:</strong> March 2025</p>
        
        <h2>1. Acceptance of Terms</h2>
        <p>By using SmarTube, you agree to these terms of service.</p>
        
        <h2>2. Description of Service</h2>
        <p>SmarTube provides an alternative interface for viewing YouTube content. We do not host any video content ourselves.</p>
        
        <h2>3. User Responsibilities</h2>
        <ul>
            <li>You must be at least 13 years old to use this service</li>
            <li>You are responsible for maintaining the security of your account</li>
            <li>You agree not to use the service for any illegal purposes</li>
        </ul>
        
        <h2>4. Content</h2>
        <p>All video content is provided by YouTube. SmarTube is not responsible for the content of videos.</p>
        
        <h2>5. Disclaimer</h2>
        <p>SmarTube is provided "as is" without warranties of any kind. We are not affiliated with YouTube or Google.</p>
        
        <h2>6. Changes to Terms</h2>
        <p>We may update these terms at any time. Continued use of the service constitutes acceptance of new terms.</p>
        
        <h2>7. Contact</h2>
        <p>Questions about these terms: support@smartube.app</p>
    </body>
    </html>
    """

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
    """Get current user from session token or Firebase token"""
    token = None
    
    # Try cookie first
    if request:
        token = request.cookies.get("session_token")
    
    # Fallback to Authorization header
    if not token and authorization:
        if authorization.startswith("Bearer "):
            token = authorization.replace("Bearer ", "")
    
    if not token:
        return None
    
    # First, try to find a session with this token
    session = await db.user_sessions.find_one(
        {"session_token": token},
        {"_id": 0}
    )
    
    if session:
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
        
        if user_doc:
            return User(**user_doc)
    
    # If no session found, try to find user by Firebase UID (token is Firebase UID)
    # This handles Firebase authenticated users
    user_doc = await db.users.find_one(
        {"firebase_uid": token},
        {"_id": 0}
    )
    
    if user_doc:
        return User(**user_doc)
    
    return None

async def require_auth(user: Optional[User] = Depends(get_current_user)) -> User:
    """Require authentication"""
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

# ============ AUTH ROUTES ============

class FirebaseAuthRequest(BaseModel):
    uid: str
    email: str
    name: str
    picture: Optional[str] = None

@app.post("/api/auth/firebase")
async def firebase_auth(
    request: FirebaseAuthRequest,
    response: Response
):
    """Authenticate user with Firebase credentials"""
    # Check if user exists by Firebase UID
    existing_user = await db.users.find_one(
        {"firebase_uid": request.uid},
        {"_id": 0}
    )
    
    if not existing_user:
        # Check if user exists by email (might have logged in differently before)
        existing_user = await db.users.find_one(
            {"email": request.email},
            {"_id": 0}
        )
        
        if existing_user:
            # Update existing user with Firebase UID
            await db.users.update_one(
                {"email": request.email},
                {"$set": {"firebase_uid": request.uid, "picture": request.picture}}
            )
            user_id = existing_user["user_id"]
        else:
            # Create new user
            user_id = f"user_{uuid.uuid4().hex[:12]}"
            new_user = {
                "user_id": user_id,
                "firebase_uid": request.uid,
                "email": request.email,
                "name": request.name,
                "picture": request.picture,
                "created_at": datetime.now(timezone.utc)
            }
            await db.users.insert_one(new_user)
    else:
        user_id = existing_user["user_id"]
        # Update user info if changed
        await db.users.update_one(
            {"firebase_uid": request.uid},
            {"$set": {"name": request.name, "picture": request.picture}}
        )
    
    # Create a session token for this user
    session_token = f"firebase_{request.uid}"
    
    # Upsert session
    await db.user_sessions.update_one(
        {"user_id": user_id, "session_token": session_token},
        {
            "$set": {
                "user_id": user_id,
                "session_token": session_token,
                "expires_at": datetime.now(timezone.utc) + timedelta(days=30),
                "updated_at": datetime.now(timezone.utc)
            },
            "$setOnInsert": {
                "created_at": datetime.now(timezone.utc)
            }
        },
        upsert=True
    )
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=30 * 24 * 60 * 60,
        path="/"
    )
    
    return {
        "success": True, 
        "session_token": session_token,
        "user_id": user_id
    }

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
    user: User = Depends(require_auth)
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
    user: User = Depends(require_auth)
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
    user: User = Depends(require_auth)
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
    user: User = Depends(require_auth)
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
