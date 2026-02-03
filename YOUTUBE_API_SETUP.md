# 🔑 YouTube API Key Setup Instructions

## Why You Need This

SmarTube uses the YouTube Data API v3 to:
- Search for videos based on categories
- Filter videos by duration (20+ minutes)
- Get video details (title, description, thumbnails, views)
- Fetch channel information

**Without the API key, video search won't work.**

---

## Step-by-Step Guide

### 1. Go to Google Cloud Console
Visit: [https://console.cloud.google.com/](https://console.cloud.google.com/)

### 2. Create or Select a Project
- Click on the project dropdown at the top
- Click "New Project"
- Name it "SmarTube" (or any name you prefer)
- Click "Create"

### 3. Enable YouTube Data API v3
- In the search bar, type: **"YouTube Data API v3"**
- Click on the result
- Click the blue **"Enable"** button
- Wait for it to enable (takes a few seconds)

### 4. Create API Credentials
- On the left sidebar, click **"Credentials"**
- Click **"Create Credentials"** at the top
- Select **"API Key"**
- A popup will show your new API key
- **Copy the API key** (it looks like: `AIzaSyC...`)

### 5. (Optional but Recommended) Restrict the API Key
- Click on the API key you just created
- Under "API restrictions":
  - Select **"Restrict key"**
  - Choose **"YouTube Data API v3"** from the dropdown
- Click **"Save"**

This prevents the key from being used for other Google services if it leaks.

---

## Adding the Key to SmarTube

### Option 1: Direct Edit (Recommended)

1. Open the file: `/app/backend/.env`

2. Find this line:
   ```
   YOUTUBE_API_KEY=""
   ```

3. Paste your API key between the quotes:
   ```
   YOUTUBE_API_KEY="AIzaSyC...YOUR_KEY_HERE"
   ```

4. Save the file

5. Restart the backend:
   ```bash
   sudo supervisorctl restart backend
   ```

### Option 2: Using Command Line

```bash
# Replace YOUR_KEY_HERE with your actual API key
echo 'YOUTUBE_API_KEY="YOUR_KEY_HERE"' >> /app/backend/.env

# Restart backend
sudo supervisorctl restart backend
```

---

## Verify It's Working

### Method 1: Check API Status
```bash
curl http://localhost:8001/
```

Should return:
```json
{
  "app": "SmarTube API",
  "status": "running",
  "youtube_api_configured": true  ← Should be true now!
}
```

### Method 2: Test Video Search
```bash
curl -X POST http://localhost:8001/api/videos/search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -d '{
    "query": "space documentary",
    "category": "documentary",
    "max_results": 5
  }'
```

---

## API Quota Limits

YouTube Data API v3 has **free daily quotas**:

- **10,000 units per day** (free tier)
- Each search costs ~100 units
- So you can do ~100 searches per day

### If You Hit the Limit:
1. Wait until the next day (resets at midnight Pacific Time)
2. OR upgrade to a paid plan in Google Cloud Console
3. OR use multiple API keys and rotate them

---

## Troubleshooting

### "API key not valid" Error
- Make sure you copied the entire key
- Check for extra spaces or quotes
- Verify the key is enabled for YouTube Data API v3

### "quota exceeded" Error
- You've hit the daily limit
- Wait for quota reset or use a different key

### Videos Not Loading
- Check backend logs: `tail -f /var/log/supervisor/backend.err.log`
- Verify API key is in `.env` file
- Make sure backend restarted after adding key

---

## Security Best Practices

1. **Never commit the API key to Git**
   - The `.env` file is in `.gitignore` by default
   
2. **Use API restrictions**
   - Restrict to YouTube Data API v3 only
   - Add HTTP referrer restrictions if deploying to web

3. **Rotate keys periodically**
   - Generate new keys every few months
   - Delete old unused keys

4. **Monitor usage**
   - Check Google Cloud Console for quota usage
   - Set up billing alerts

---

## Need Help?

- **YouTube API Docs**: [https://developers.google.com/youtube/v3](https://developers.google.com/youtube/v3)
- **API Key Restrictions**: [https://cloud.google.com/docs/authentication/api-keys](https://cloud.google.com/docs/authentication/api-keys)
- **Quota Management**: [https://console.cloud.google.com/apis/api/youtube.googleapis.com/quotas](https://console.cloud.google.com/apis/api/youtube.googleapis.com/quotas)

---

**Once you've added the API key, you're all set! The app will be fully functional.** 🚀
