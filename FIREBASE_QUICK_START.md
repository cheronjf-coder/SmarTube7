# Firebase Quick Start Guide for SmarTube

## 5-Minute Setup

### Step 1: Create Firebase Project (2 min)

1. Open [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create a project"**
3. Name: `smartube`
4. Disable Analytics → **Create Project**

### Step 2: Enable Google Auth (1 min)

1. Go to **Authentication** → **Get Started**
2. **Sign-in method** tab → Click **Google**
3. Enable → Add your email → **Save**

### Step 3: Add Web App (1 min)

1. Project Settings (⚙️ icon)
2. Scroll to "Your apps" → Click **</>** (Web)
3. Name: `SmarTube Web` → **Register**
4. **COPY the config object**

### Step 4: Copy Your Config

You'll see something like:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "smartube-xxxxx.firebaseapp.com",
  projectId: "smartube-xxxxx",
  storageBucket: "smartube-xxxxx.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123"
};
```

### Step 5: Share Config With Me

Provide these 6 values:
- `apiKey`
- `authDomain`
- `projectId`
- `storageBucket`
- `messagingSenderId`
- `appId`

---

## Common Issues

**"This domain is not authorized"**
→ Go to Authentication → Settings → Authorized domains → Add your domain

**"Popup closed by user"**
→ Allow popups in browser for Firebase domains

**"Google sign-in not working"**
→ Check that Google provider is enabled in Authentication → Sign-in method
