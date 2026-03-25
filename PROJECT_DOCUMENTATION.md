# SmarTube - Project Documentation

## 🎯 Project Overview

**SmarTube** is a mobile app that provides an ad-free YouTube viewing experience, focusing exclusively on quality content (documentaries, news, educational videos) that are 20+ minutes long.

### Core Features:
- Ad-free video playback using yt-dlp
- Google Sign-In authentication
- Video search with category filters (Documentary, News, Actuality, Training)
- Bookmark/Save videos
- Share videos
- Background audio playback

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         MOBILE APP                               │
│                    (Expo React Native)                           │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Login     │  │   Search    │  │   Player    │              │
│  │   Screen    │  │   Screen    │  │   Screen    │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
│         └────────────────┼────────────────┘                      │
│                          │                                       │
│                   AuthContext.tsx                                │
│                          │                                       │
└──────────────────────────┼───────────────────────────────────────┘
                           │
                           │ HTTPS API Calls
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (FastAPI)                           │
│                   Hosted on: Render.com                          │
│                                                                  │
│  Endpoints:                                                      │
│  - POST /api/auth/firebase     (user authentication)             │
│  - GET  /api/auth/google/callback (OAuth redirect handler)       │
│  - POST /api/videos/search     (search YouTube videos)           │
│  - GET  /api/videos/{id}/stream (get ad-free stream URL)         │
│  - GET/POST /api/bookmarks     (manage bookmarks)                │
│                                                                  │
└──────────────────────────┬───────────────────────────────────────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           ▼               ▼               ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  MongoDB     │  │  YouTube     │  │   Google     │
│  Atlas       │  │  Data API    │  │   OAuth      │
│              │  │              │  │              │
│ Database for │  │ Search for   │  │ User         │
│ users &      │  │ videos       │  │ authentication│
│ bookmarks    │  │              │  │              │
└──────────────┘  └──────────────┘  └──────────────┘
```

---

## 🔌 External Services

### 1. Render.com (Backend Hosting)
- **URL**: https://smartube2.onrender.com
- **Service Type**: Web Service (Free tier)
- **Repository**: https://github.com/cheronjf-coder/smartube-backend
- **Environment Variables**:
  - `MONGO_URL`: MongoDB Atlas connection string
  - `YOUTUBE_API_KEY`: YouTube Data API v3 key
  - `DB_NAME`: smartube_db

### 2. MongoDB Atlas (Database)
- **Cluster**: smartube.l9xgfen.mongodb.net
- **Database**: smartube_db
- **Collections**:
  - `users` - User accounts
  - `bookmarks` - Saved videos
  - `user_sessions` - Authentication sessions
- **Connection String**: `mongodb+srv://smartube_admi:f1InXNsTFdbmfNtk@smartube.l9xgfen.mongodb.net/smartube_db?appName=smartube`

### 3. Google Cloud Console (OAuth & YouTube API)
- **Project**: smartube-486618
- **Project Number**: 63652025463
- **Services Used**:
  - YouTube Data API v3
  - OAuth 2.0 for Google Sign-In
- **OAuth Client ID**: `63652025463-k4l03astv51coo60olrgqfn6ft8ufbuk.apps.googleusercontent.com`
- **YouTube API Key**: `AIzaSyAsGqGfYrQJcVPjsMEf_vWItEE3i07bo24`

### 4. Firebase (Authentication Config)
- **Project**: smartube-96955
- **Used for**: Firebase configuration in frontend (Google Auth provider)

### 5. Expo (Build Service)
- **Account**: smartube
- **Project**: smartube
- **Used for**: Building APK/AAB files

---

## 📁 Project Structure

```
/app
├── backend/
│   ├── server.py           # FastAPI backend (all API endpoints)
│   ├── requirements.txt    # Python dependencies
│   └── .python-version     # Python 3.11.0
│
├── frontend/
│   ├── app/                # Expo Router screens
│   │   ├── (tabs)/         # Tab navigation screens
│   │   │   ├── index.tsx   # Home screen
│   │   │   ├── search.tsx  # Search screen
│   │   │   ├── bookmarks.tsx
│   │   │   ├── profile.tsx
│   │   │   └── about.tsx
│   │   ├── _layout.tsx     # Root layout
│   │   ├── login.tsx       # Login screen
│   │   └── player.tsx      # Video player screen
│   │
│   ├── components/
│   │   ├── VideoPlayer.web.tsx    # Web video player
│   │   └── VideoPlayerNative.tsx  # Native video player
│   │
│   ├── contexts/
│   │   └── AuthContext.tsx  # Authentication context (CRITICAL FILE)
│   │
│   ├── config/
│   │   └── firebase.ts      # Firebase configuration
│   │
│   ├── assets/
│   │   └── images/
│   │       └── smartube-logo.png  # App logo (ninja theme)
│   │
│   ├── app.json            # Expo configuration
│   ├── eas.json            # EAS Build configuration
│   └── package.json        # Node dependencies
│
└── Documentation files (*.md)
```

---

## 🔐 Authentication Flow (Google Sign-In)

### Web Flow:
1. User clicks "Continue with Google"
2. Firebase popup opens for Google Sign-In
3. User authenticates with Google
4. Firebase returns user info
5. Frontend sends user info to backend `/api/auth/firebase`
6. Backend creates/updates user and returns session token
7. Session token stored in AsyncStorage

### Mobile APK Flow:
1. User clicks "Continue with Google"
2. App opens WebBrowser with Google OAuth URL
   - `redirect_uri=https://smartube2.onrender.com/api/auth/google/callback`
3. User authenticates with Google
4. Google redirects to backend callback page with token in URL fragment
5. Callback page (JavaScript) redirects to `smartube://auth#access_token=...`
6. App intercepts the deep link
7. App fetches user info from Google API
8. App sends user info to backend `/api/auth/firebase`
9. Session token stored

### Important OAuth Redirect URIs (Google Cloud Console):
```
https://smartube2.onrender.com/api/auth/google/callback
https://auth.expo.io/@jfcheron76/smartube
https://auth.expo.io/@smartube/smartube-v3
https://auth.expo.io/@anonymous/smartube
```

---

## ⚠️ Current Status & Known Issues

### ✅ Working:
- Video search with filters
- Category-based filtering (Documentary, News, Actuality, Training)
- Content exclusion (gaming, compilations, etc.)
- Video playback (ad-free via yt-dlp)
- Bookmarks (save/remove)
- Share functionality
- Web preview login (Firebase popup)
- Backend on Render
- Database on MongoDB Atlas

### ⏳ In Progress / To Verify:
- **Mobile APK Google Login** - Latest APK build in progress
  - Build URL: https://expo.dev/accounts/smartube/projects/smartube/builds/812a3c5a-e86b-4983-916e-773d23f61f98
  - Previous issue: APK was sending wrong redirect_uri (`smartube://auth` instead of backend callback URL)
  - Fix applied: Hardcoded `BACKEND_URL` and `OAUTH_REDIRECT_URI` in AuthContext.tsx

### ❌ Not Implemented:
- Floating video window (PiP mode)
- Subtitle/CC support
- Video quality selection
- Offline mode

---

## 🔧 Key Configuration Files

### eas.json (EAS Build Config)
```json
{
  "cli": {
    "version": ">= 13.2.0"
  },
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      },
      "env": {
        "EXPO_PUBLIC_BACKEND_URL": "https://smartube2.onrender.com"
      }
    },
    "production": {
      "android": {
        "buildType": "apk"
      },
      "env": {
        "EXPO_PUBLIC_BACKEND_URL": "https://smartube2.onrender.com"
      }
    }
  }
}
```

### Backend .env (for Render)
```
MONGO_URL=mongodb+srv://smartube_admi:f1InXNsTFdbmfNtk@smartube.l9xgfen.mongodb.net/smartube_db?appName=smartube
YOUTUBE_API_KEY=AIzaSyAsGqGfYrQJcVPjsMEf_vWItEE3i07bo24
DB_NAME=smartube_db
```

### requirements.txt (Backend)
```
fastapi==0.115.12
uvicorn==0.34.3
motor==3.7.1
pymongo==4.11.3
python-dotenv==1.1.0
httpx==0.28.1
pydantic==2.11.4
google-api-python-client==2.173.0
yt-dlp==2025.3.31
```

---

## 📝 Notes for Future Development

1. **AuthContext.tsx is the most critical file** - It handles all authentication logic for both web and mobile

2. **The backend on Render has a 15-min sleep on free tier** - First request after idle takes 30-60 seconds

3. **YouTube API has daily quotas** - Monitor usage in Google Cloud Console

4. **To update backend**: Push to GitHub → Render auto-deploys

5. **To build new APK**: 
   ```bash
   cd frontend
   eas build --platform android --profile preview
   ```

6. **OAuth consent screen** is in Production mode (not Testing)

7. **Content filtering** is done in two places:
   - In YouTube search query (category keywords)
   - Post-search filtering (excluded terms check on title/channel)

---

## 🔗 Important URLs

- **App Preview**: https://smartube-preview.preview.emergentagent.com
- **Backend API**: https://smartube2.onrender.com
- **Backend Health**: https://smartube2.onrender.com/api/health
- **Google Cloud Console**: https://console.cloud.google.com/
- **Firebase Console**: https://console.firebase.google.com/
- **MongoDB Atlas**: https://cloud.mongodb.com/
- **Render Dashboard**: https://dashboard.render.com/
- **Expo Builds**: https://expo.dev/accounts/smartube/projects/smartube/builds

---

## 👤 Owner/Developer

- **Company**: Optimotclé
- **Website**: https://optimotcle.com (referenced in About page)
