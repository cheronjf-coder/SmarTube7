# SmarTube - Quality YouTube Video Player

A mobile app for watching longer YouTube videos (20+ minutes) without ads. Features documentaries, news, actuality, and training content with a clean, ad-free viewing experience.

## 🎯 Features

### Core Features
- **Ad-Free Playback**: Watch YouTube videos without any advertisements
- **Quality Content Filter**: Only videos 20+ minutes (no shorts)
- **Category Filters**: Documentaries, News, Actuality, Training
- **Google Sign-In**: Easy authentication with your Google account
- **Bookmarks**: Save videos to watch later
- **Share Videos**: Share videos with friends (prompts app download)

### Subscription Model
- **14-Day Free Trial**: Try all features free
- **$2/month**: Monthly subscription
- **$14/year**: Annual subscription (save $10)
- **$29 Lifetime**: One-time purchase, lifetime access

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Expo (React Native)
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Authentication**: Emergent Google OAuth
- **Video**: YouTube Data API v3 + yt-dlp

### Project Structure
```
/app
├── backend/              # FastAPI backend
│   ├── server.py        # Main server file
│   ├── requirements.txt # Python dependencies
│   └── .env            # Environment variables
├── frontend/            # Expo React Native app
│   ├── app/            # File-based routing
│   │   ├── (tabs)/    # Tab navigation
│   │   │   ├── home.tsx
│   │   │   ├── search.tsx
│   │   │   ├── bookmarks.tsx
│   │   │   └── profile.tsx
│   │   ├── login.tsx
│   │   ├── player.tsx
│   │   └── subscription.tsx
│   ├── contexts/       # React contexts
│   │   └── AuthContext.tsx
│   ├── package.json
│   └── .env
└── auth_testing.md     # Authentication testing guide
```

## 🚀 Setup Instructions

### 1. Get YouTube Data API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **YouTube Data API v3**
4. Create credentials → API Key
5. Copy the API key

### 2. Add API Key to Backend

Edit `/app/backend/.env`:
```bash
MONGO_URL="mongodb://localhost:27017"
DB_NAME="test_database"
YOUTUBE_API_KEY="YOUR_API_KEY_HERE"
```

### 3. Restart Services

```bash
sudo supervisorctl restart backend expo
```

## 📱 App Screens

### Authentication
- **Login Screen**: Google Sign-In with pricing info
- **Auto-redirect**: Existing users automatically logged in

### Main Navigation (Tabs)
1. **Home**: Welcome screen, category cards, popular videos
2. **Search**: Search with category filters, video results
3. **Bookmarks**: Saved videos for later viewing
4. **Profile**: User info, subscription status, settings

### Additional Screens
- **Video Player**: YouTube player with bookmark/share actions
- **Subscription**: Plan selection and mock payment

## 🔐 Authentication Flow

1. User clicks "Continue with Google" on login screen
2. Opens Google OAuth via Emergent Auth service
3. Returns with session_id (via deep link or redirect)
4. Frontend exchanges session_id for session_token
5. Backend validates session and creates/retrieves user
6. User info stored in MongoDB with subscription details
7. Session token saved in AsyncStorage for persistence

## 💾 Database Collections

### users
```json
{
  "user_id": "user_abc123",
  "email": "user@example.com",
  "name": "John Doe",
  "picture": "https://...",
  "subscription_type": "trial",
  "trial_start_date": "2025-01-01T00:00:00Z",
  "subscription_end_date": null,
  "created_at": "2025-01-01T00:00:00Z"
}
```

### user_sessions
```json
{
  "user_id": "user_abc123",
  "session_token": "token_xyz...",
  "expires_at": "2025-01-08T00:00:00Z",
  "created_at": "2025-01-01T00:00:00Z"
}
```

### bookmarks
```json
{
  "bookmark_id": "bm_abc123",
  "user_id": "user_abc123",
  "video_id": "dQw4w9WgXcQ",
  "video_title": "Video Title",
  "thumbnail": "https://...",
  "duration": "PT30M",
  "channel_name": "Channel Name",
  "category": "documentary",
  "added_at": "2025-01-01T00:00:00Z"
}
```

### share_links
```json
{
  "share_id": "sh_abc123",
  "video_id": "dQw4w9WgXcQ",
  "share_code": "a1b2c3d4",
  "created_by": "user_abc123",
  "created_at": "2025-01-01T00:00:00Z"
}
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/session` - Exchange session_id for session_token
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/logout` - Logout user

### Videos
- `POST /api/videos/search` - Search videos with category filter
- `GET /api/videos/{video_id}/info` - Get video details
- `GET /api/videos/{video_id}/stream` - Get ad-free stream URL

### Bookmarks
- `GET /api/bookmarks` - Get user's bookmarks
- `POST /api/bookmarks` - Add bookmark
- `DELETE /api/bookmarks/{video_id}` - Remove bookmark

### Subscription
- `GET /api/subscription/status` - Check subscription status
- `POST /api/subscription/purchase` - Purchase subscription (mock)

### Sharing
- `POST /api/share/create` - Create shareable link
- `GET /api/share/{share_code}` - Get video from share code

## 🧪 Testing

### Backend Testing
```bash
# Test authentication
curl -X GET "http://localhost:8001/api/auth/me" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"

# Test video search
curl -X POST "http://localhost:8001/api/videos/search" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -d '{"query": "documentary", "category": "documentary", "max_results": 5}'
```

### Create Test User
See `/app/auth_testing.md` for detailed testing instructions.

## 📦 Dependencies

### Backend
- fastapi - Web framework
- uvicorn - ASGI server
- pymongo/motor - MongoDB client
- httpx - HTTP client for auth
- yt-dlp - YouTube stream extraction
- google-api-python-client - YouTube API

### Frontend
- expo - React Native framework
- expo-router - File-based routing
- expo-auth-session - OAuth flow
- react-native-youtube-iframe - Video player
- axios - HTTP client
- @react-native-async-storage/async-storage - Local storage

## 🎨 Design System

### Colors
- Primary: `#FF0000` (YouTube Red)
- Background: `#000000` (Black)
- Card Background: `#1A1A1A` (Dark Gray)
- Text Primary: `#FFFFFF` (White)
- Text Secondary: `#999999` (Gray)
- Success: `#00FF00` (Green)
- Warning: `#FFD700` (Gold)

### Typography
- Title: 32px, Bold
- Heading: 24px, Bold
- Body: 16px, Regular
- Caption: 12px, Regular

## 🔄 Subscription Logic

### Trial Period (14 days)
- Starts when user first signs up
- Full access to all features
- Shows remaining days in UI
- Expires after 14 days

### Active Subscriptions
- **Monthly**: 30 days from purchase
- **Yearly**: 365 days from purchase
- **Lifetime**: Never expires

### Expired State
- User shown subscription prompt
- Can't watch videos, search, or bookmark
- Must renew to regain access

## 🔗 Deep Linking

### URL Scheme
- App scheme: `smartube://`
- Web domain: `https://smartube.app/`

### Share Flow
1. User shares video from player
2. Backend creates share link with unique code
3. Generates deep link: `smartube://video/{share_code}`
4. Non-users get app download prompt
5. Opens video directly in app for users

## 🚧 Known Limitations

1. **YouTube API Quota**: Free tier has daily limits
2. **Payment Integration**: Currently mock (needs Stripe/RevenueCat)
3. **Video Stream URLs**: Expire after some time (YouTube's design)
4. **Category Filtering**: Based on YouTube's category system

## 🔮 Future Enhancements

1. **Offline Downloads**: Save videos for offline viewing
2. **Playlists**: Create and manage custom playlists
3. **Watch History**: Track viewing history
4. **Recommendations**: AI-powered content suggestions
5. **Dark/Light Mode**: Theme customization
6. **Multi-language**: Support more languages
7. **Social Features**: Comments, likes, follow creators

## 📄 License

This is a demo application. All YouTube content belongs to respective copyright holders.

## 🆘 Support

For issues or questions:
1. Check backend logs: `tail -f /var/log/supervisor/backend.err.log`
2. Check frontend logs: `tail -f /var/log/supervisor/expo.err.log`
3. Verify services: `sudo supervisorctl status`
4. Restart services: `sudo supervisorctl restart backend expo`

---

**Made with ❤️ by SmarTube Team**
