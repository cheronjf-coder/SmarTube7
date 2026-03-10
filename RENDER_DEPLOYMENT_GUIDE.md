# Render Deployment Guide for SmarTube Backend

## Prerequisites

- GitHub account with backend code pushed
- MongoDB Atlas connection string (from Atlas setup)
- YouTube API Key (from Google Cloud Console)

---

## Step-by-Step Deployment

### Step 1: Prepare Backend for Deployment

Your backend structure should look like:

```
backend/
├── server.py
├── requirements.txt
└── .env (local only, don't commit)
```

### Step 2: Create GitHub Repository

1. Create new repo: `smartube-backend`
2. Push your backend:

```bash
cd backend
git init
git add .
git commit -m "Initial backend"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/smartube-backend.git
git push -u origin main
```

### Step 3: Create Render Account

1. Go to [Render](https://render.com)
2. Sign up with GitHub
3. Authorize Render to access your repos

### Step 4: Create Web Service

1. Dashboard → **"New +"** → **"Web Service"**
2. Connect your `smartube-backend` repo
3. Configure:

| Setting | Value |
|---------|-------|
| Name | `smartube-api` |
| Region | Oregon (US West) |
| Branch | `main` |
| Runtime | Python 3 |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn server:app --host 0.0.0.0 --port $PORT` |
| Instance Type | **Free** |

### Step 5: Set Environment Variables

In Render dashboard → Your service → **Environment**

Add these variables:

| Key | Value |
|-----|-------|
| `MONGO_URL` | `mongodb+srv://...` (your Atlas string) |
| `YOUTUBE_API_KEY` | `AIzaSy...` |
| `DB_NAME` | `smartube_db` |
| `PYTHON_VERSION` | `3.11.0` |

### Step 6: Deploy

1. Click **"Create Web Service"**
2. Wait 2-5 minutes for build
3. Your API URL: `https://smartube-api.onrender.com`

---

## Testing Your Deployment

```bash
# Health check
curl https://smartube-api.onrender.com/api/health

# Root endpoint
curl https://smartube-api.onrender.com/
```

Expected response:
```json
{"app": "SmarTube API", "status": "running", "youtube_api_configured": true}
```

---

## Free Tier Notes

### Limitations

- **Spins down after 15 min** of inactivity
- First request after idle: 30-60 sec delay
- 750 free hours/month

### Keeping It Awake (Optional)

Use a free cron service like [cron-job.org](https://cron-job.org):
- URL: `https://smartube-api.onrender.com/api/health`
- Frequency: Every 10 minutes

---

## Updating Your Backend

1. Push changes to GitHub:
```bash
git add .
git commit -m "Update"
git push
```

2. Render auto-deploys on push!

---

## Share With Me

Once deployed, provide:
- Your Render URL: `https://smartube-api.onrender.com`

I'll update the frontend to use this URL.
