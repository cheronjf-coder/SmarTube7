# SmarTube APK Build Guide

## Prerequisites

1. **Node.js** installed on your computer
2. **Expo account** (you already have: jfcheron76)
3. **Google Cloud Console** access

---

## Step 1: Install EAS CLI

Open a terminal and run:
```bash
npm install -g eas-cli
```

---

## Step 2: Download the Project

Download the project files from Emergent (click the download button).

---

## Step 3: Navigate to Frontend

```bash
cd frontend
```

---

## Step 4: Login to Expo

```bash
eas login
```
Enter your Expo credentials (jfcheron76).

---

## Step 5: Configure Google OAuth Redirect URI

**IMPORTANT:** Before building, add this redirect URI in Google Cloud Console:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project **smartube-486618**
3. Go to **APIs & Services** → **Credentials**
4. Click on **Web client** (`63652025463-k4l03astv51coo60olrgqfn6ft8ufbuk`)
5. Under **Authorized redirect URIs**, add:
   ```
   smartube://auth
   ```
6. Click **Save**

---

## Step 6: Build the APK

```bash
eas build --platform android --profile preview
```

This will:
- Upload your code to Expo's build servers
- Build an APK (takes 10-15 minutes)
- Give you a download link when complete

---

## Step 7: Install the APK

1. Download the APK from the link provided
2. Transfer it to your Android phone
3. Install it (you may need to enable "Install from unknown sources")

---

## Step 8: Test Login

1. Open the SmarTube app
2. Tap "Continue with Google"
3. Select your Google account
4. You should be logged in!

---

## Troubleshooting

### "redirect_uri_mismatch" error
Make sure you added `smartube://auth` to the redirect URIs in Google Cloud Console.

### Build fails
Run `eas build --platform android --profile preview --clear-cache` to clear cache.

### App crashes on launch
Check that all environment variables are set correctly.

---

## Production Build (for Play Store)

When ready for Play Store, build an AAB instead:
```bash
eas build --platform android --profile production
```

This creates an Android App Bundle (.aab) which is required for Play Store submission.

---

## Backend Deployment

Your backend should be deployed to Render at:
```
https://smartube2.onrender.com
```

Make sure the following environment variables are set on Render:
- `MONGO_URL`: Your MongoDB Atlas connection string
- `YOUTUBE_API_KEY`: Your YouTube API key
- `DB_NAME`: smartube_db

---

## Support

If you have issues, check:
1. Google Cloud Console OAuth settings
2. Expo build logs
3. Backend logs on Render
