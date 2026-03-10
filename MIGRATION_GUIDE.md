# SmarTube Migration Guide: Moving to Free-Tier Hosting

This guide will help you migrate SmarTube away from Emergent's platform to a completely free-tier stack:

- **Authentication**: Firebase Authentication (Google Sign-In)
- **Backend Hosting**: Render.com (free tier)
- **Database**: MongoDB Atlas (free tier - 512MB)

## Table of Contents

1. [Firebase Setup](#1-firebase-setup)
2. [MongoDB Atlas Setup](#2-mongodb-atlas-setup)
3. [Render Deployment](#3-render-deployment)
4. [Environment Variables Summary](#4-environment-variables-summary)
5. [Testing Your Migration](#5-testing-your-migration)

---

## 1. Firebase Setup

### Step 1.1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Enter project name: `smartube` (or your preferred name)
4. Disable Google Analytics (optional, not needed for auth)
5. Click **"Create project"**

### Step 1.2: Enable Google Sign-In

1. In your Firebase project, go to **Build > Authentication**
2. Click **"Get started"**
3. Go to **Sign-in method** tab
4. Click on **Google** provider
5. Toggle **Enable**
6. Set your **Project support email** (your email)
7. Click **Save**

### Step 1.3: Get Web App Configuration

1. Go to **Project Settings** (gear icon next to "Project Overview")
2. Scroll down to **"Your apps"**
3. Click the **Web icon** (</>) to add a web app
4. Register app name: `SmarTube Web`
5. You'll see your Firebase config - **COPY THESE VALUES**:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

### Step 1.4: Configure OAuth for Mobile (Android)

1. In Project Settings, scroll to **"Your apps"**
2. Click **"Add app"** > **Android icon**
3. Enter package name: `com.optimotcle.smartube`
4. Enter app nickname: `SmarTube Android`
5. For SHA-1 certificate:
   - For development, run in your project:
   ```bash
   cd android && ./gradlew signingReport
   ```
   - Or use debug SHA-1: `DA:39:A3:EE:5E:6B:4B:0D:32:55:BF:EF:95:60:18:90:AF:D8:07:09`
6. Click **Register app**
7. Download `google-services.json` (you'll need this later)

### Step 1.5: Configure OAuth Consent Screen (Google Cloud)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Go to **APIs & Services > OAuth consent screen**
4. Select **External** user type
5. Fill in:
   - App name: `SmarTube`
   - User support email: Your email
   - Developer contact: Your email
6. Click **Save and Continue**
7. Skip Scopes (defaults are fine)
8. Add test users if needed
9. Click **Save**

### Firebase Config Values You'll Need:

| Value | Where to Find It |
|-------|------------------|
| `apiKey` | Project Settings > General > Web API Key |
| `authDomain` | `{projectId}.firebaseapp.com` |
| `projectId` | Project Settings > General |
| `storageBucket` | `{projectId}.appspot.com` |
| `messagingSenderId` | Project Settings > Cloud Messaging > Sender ID |
| `appId` | Project Settings > General > Your apps > App ID |

---

## 2. MongoDB Atlas Setup

### Step 2.1: Create an Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Sign up with Google or email
3. Verify your email

### Step 2.2: Create a Free Cluster

1. Click **"Build a Database"**
2. Select **"M0 FREE"** tier (Shared)
3. Choose a cloud provider (AWS recommended)
4. Select region closest to your users
5. Cluster name: `smartube-cluster`
6. Click **"Create"**

### Step 2.3: Configure Database Access

1. Go to **Database Access** (left sidebar)
2. Click **"Add New Database User"**
3. Authentication Method: **Password**
4. Username: `smartube_user`
5. Password: Generate a secure password (SAVE THIS!)
6. Database User Privileges: **Read and write to any database**
7. Click **"Add User"**

### Step 2.4: Configure Network Access

1. Go to **Network Access** (left sidebar)
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (0.0.0.0/0)
   - This is required for Render deployment
4. Click **"Confirm"**

### Step 2.5: Get Your Connection String

1. Go to **Database** (left sidebar)
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Driver: Python, Version: 3.12 or later
5. Copy the connection string:

```
mongodb+srv://smartube_user:<password>@smartube-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

6. Replace `<password>` with your actual password
7. Add database name after `.net/`:

```
mongodb+srv://smartube_user:YOUR_PASSWORD@smartube-cluster.xxxxx.mongodb.net/smartube_db?retryWrites=true&w=majority
```

---

## 3. Render Deployment

### Step 3.1: Create a Render Account

1. Go to [Render](https://render.com/)
2. Sign up with GitHub or email
3. Verify your email

### Step 3.2: Connect Your Repository

1. Push your backend code to GitHub:
```bash
git init
git add backend/
git commit -m "Backend for deployment"
git remote add origin https://github.com/YOUR_USERNAME/smartube-backend.git
git push -u origin main
```

### Step 3.3: Create a Web Service

1. In Render Dashboard, click **"New +"** > **"Web Service"**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `smartube-api`
   - **Region**: Oregon (US West) or closest to you
   - **Branch**: `main`
   - **Root Directory**: `backend` (if your repo has both frontend and backend)
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn server:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: **Free**

### Step 3.4: Set Environment Variables

In your Render service settings, add these environment variables:

| Key | Value |
|-----|-------|
| `MONGO_URL` | Your MongoDB Atlas connection string |
| `YOUTUBE_API_KEY` | Your YouTube Data API v3 key |
| `DB_NAME` | `smartube_db` |

### Step 3.5: Deploy

1. Click **"Create Web Service"**
2. Wait for deployment (takes 2-5 minutes)
3. Your API will be available at: `https://smartube-api.onrender.com`

### Important Notes About Render Free Tier:

- **Cold Starts**: Free tier services spin down after 15 minutes of inactivity. First request after idle may take 30-60 seconds.
- **750 free hours/month**: Enough for one always-running service
- **No persistent storage**: All data must be in MongoDB Atlas

---

## 4. Environment Variables Summary

### Backend (.env or Render)

```env
MONGO_URL=mongodb+srv://smartube_user:YOUR_PASSWORD@smartube-cluster.xxxxx.mongodb.net/smartube_db?retryWrites=true&w=majority
YOUTUBE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
DB_NAME=smartube_db
```

### Frontend (config/firebase.ts)

```typescript
export const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

### Frontend (.env)

```env
EXPO_PUBLIC_BACKEND_URL=https://smartube-api.onrender.com
```

---

## 5. Testing Your Migration

### Test 1: Backend Health Check

```bash
curl https://smartube-api.onrender.com/api/health
# Expected: {"status": "healthy"}
```

### Test 2: Database Connection

```bash
curl https://smartube-api.onrender.com/
# Expected: {"app": "SmarTube API", "status": "running", ...}
```

### Test 3: Firebase Auth (Web)

1. Open your app in web browser
2. Click "Continue with Google"
3. Complete Google sign-in
4. You should be redirected to the home screen

### Test 4: Full Flow

1. Sign in
2. Search for videos
3. Play a video
4. Add a bookmark
5. Check bookmarks tab

---

## Cost Summary

| Service | Free Tier Limits | Cost After Free Tier |
|---------|------------------|----------------------|
| Firebase Auth | 50K authentications/month | $0.01 per additional |
| MongoDB Atlas M0 | 512MB storage | Upgrade to M2 ($9/mo) |
| Render Free | 750 hours/month | $7/mo for always-on |
| YouTube Data API | 10,000 units/day | $0 (within quota) |

**Total Monthly Cost**: $0 (within free tier limits)

---

## Troubleshooting

### Firebase: "auth/popup-closed-by-user"
- Make sure popups are allowed in browser
- Check OAuth consent screen is properly configured

### MongoDB: "Connection refused"
- Verify IP whitelist includes 0.0.0.0/0
- Check username/password are correct
- Ensure connection string has database name

### Render: "Application failed to respond"
- Check build logs for errors
- Verify all environment variables are set
- Check start command is correct

---

## Next Steps

Once you have all the values, provide them to me and I'll:

1. Update `/app/frontend/config/firebase.ts` with your Firebase config
2. Update the backend to validate Firebase tokens
3. Update frontend to use your Render backend URL
4. Test the full authentication flow

**Please provide:**
- [ ] Firebase Web Config (apiKey, authDomain, projectId, etc.)
- [ ] MongoDB Atlas connection string
- [ ] YouTube API Key (if you don't have one yet)
