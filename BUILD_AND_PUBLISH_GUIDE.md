# 📱 SmarTube - Build & Publish to Google Play Store Guide

## ✅ EAS Build Configuration Complete!

I've created the `eas.json` file which configures three build profiles:
- **Development**: For testing on your device
- **Preview**: Creates APK for quick testing
- **Production**: Creates AAB for Play Store submission

---

## 🚀 Step-by-Step Guide to Publish on Play Store

### STEP 1: Create Expo Account (If you don't have one)

1. Go to https://expo.dev
2. Sign up for a free account
3. Verify your email

---

### STEP 2: Login to EAS (On your computer)

Open terminal and run:

```bash
cd /app/frontend
npx eas-cli login
```

Enter your Expo credentials when prompted.

---

### STEP 3: Configure Your Project

```bash
cd /app/frontend
npx eas-cli build:configure
```

This will:
- Link your project to your Expo account
- Set up Android build configuration
- Generate signing credentials

---

### STEP 4: Build APK for Testing (Optional but Recommended)

Before submitting to Play Store, test with an APK:

```bash
npx eas-cli build --platform android --profile preview
```

- This creates an APK file you can install directly on your phone
- Takes about 15-20 minutes
- You'll get a download link when done
- Install and test thoroughly!

---

### STEP 5: Build AAB for Play Store (Production)

When you're ready for Play Store:

```bash
npx eas-cli build --platform android --profile production
```

- This creates an **AAB (Android App Bundle)** - required by Play Store
- Takes about 15-20 minutes
- You'll get a download link to the AAB file
- This is what you upload to Play Store!

---

### STEP 6: Create Google Play Console Account

1. Go to https://play.google.com/console
2. Click **"Sign up"**
3. Pay the **$25 one-time registration fee**
4. Complete account setup
5. Agree to developer agreements

---

### STEP 7: Create Your App in Play Console

1. Click **"Create App"**
2. Fill in details:
   - **App name**: SmarTube
   - **Default language**: English (or your preference)
   - **App or game**: App
   - **Free or paid**: Free
3. Accept declarations
4. Click **"Create app"**

---

### STEP 8: Complete Store Listing

Fill out these sections in Play Console:

**App details:**
- Short description (80 chars)
- Full description (4000 chars max)
- App icon (512x512 PNG)
- Feature graphic (1024x500 PNG)
- Screenshots (at least 2, recommended 8)
- Category: Entertainment or Education
- Tags: video, streaming, documentary, etc.

**Privacy Policy:**
- You'll need a privacy policy URL
- Can use templates from: https://privacypolicygenerator.info/

**Content Rating:**
- Complete the questionnaire
- SmarTube likely gets "Everyone" rating

**Target Audience:**
- Select age groups
- For content apps: 13+ recommended

---

### STEP 9: Upload Your AAB

1. Go to **"Production"** → **"Create new release"**
2. Click **"Upload"**
3. Select the AAB file you downloaded from EAS Build
4. Set **Version name**: 1.0.0
5. Add **Release notes**: "Initial release of SmarTube"
6. Review and click **"Save"**

---

### STEP 10: Submit for Review

1. Complete all required sections (indicated with red exclamation marks)
2. Go to **"Publishing overview"**
3. Click **"Send for review"**
4. Google will review your app (1-7 days typically)

---

## 📋 Requirements Checklist

Before submitting, make sure you have:

- [ ] Expo account created
- [ ] AAB file built and downloaded
- [ ] Google Play Console account ($25 paid)
- [ ] App icon (512x512 PNG)
- [ ] Feature graphic (1024x500 PNG)
- [ ] Screenshots (2-8 images)
- [ ] Privacy policy URL
- [ ] Short description written
- [ ] Full description written
- [ ] Content rating completed
- [ ] All store listing sections filled

---

## 🎨 Image Assets You Need

### App Icon (512x512 PNG)
- Your SmarTube logo on transparent or solid background
- No text, just icon
- High resolution

### Feature Graphic (1024x500 PNG)
- Banner image shown in Play Store
- Can include app name and tagline
- Eye-catching design

### Screenshots (Minimum 2, Recommended 4-8)
- 1080x1920 or 1080x2340 (phone screenshots)
- Show key features:
  1. Home screen with videos
  2. Search with categories
  3. Video player
  4. Bookmarks screen
  5. Subscription plans
  6. About page

**How to get screenshots:**
- Use Expo Go on your phone
- Take screenshots of each screen
- Or use Android emulator

---

## 💰 Costs Summary

| Item | Cost | One-time or Recurring |
|------|------|----------------------|
| **Expo Account** | Free | - |
| **EAS Build** | Free (limited) or $29/month | Monthly (optional) |
| **Google Play Console** | $25 | One-time |
| **Emergent Hosting** | 50 credits/month | Monthly |
| **Total Initial Cost** | $25-$54 | - |

**Note:** Free EAS Build includes 30 builds/month which is plenty for most developers.

---

## ⚡ Quick Commands Reference

```bash
# Install EAS CLI globally (one time)
npm install -g eas-cli

# Login to Expo
eas login

# Configure project (one time)
eas build:configure

# Build APK for testing
eas build --platform android --profile preview

# Build AAB for Play Store
eas build --platform android --profile production

# Check build status
eas build:list

# Submit to Play Store (after AAB is built)
eas submit --platform android
```

---

## 🔧 Troubleshooting

### Build fails with "credentials not configured"
```bash
eas credentials
```
Follow prompts to generate signing keys.

### "Project not configured for EAS Build"
```bash
eas build:configure
```

### Can't login to EAS
Make sure you have an Expo account at https://expo.dev

### Build takes too long
Builds typically take 15-30 minutes. Check status with:
```bash
eas build:list
```

### Play Store rejects app
- Check all required sections are completed
- Ensure screenshots are correct dimensions
- Privacy policy must be accessible
- Content rating must be completed

---

## 📞 Support Resources

- **Expo Documentation**: https://docs.expo.dev/build/setup/
- **EAS Build Guide**: https://docs.expo.dev/build/introduction/
- **Play Console Help**: https://support.google.com/googleplay/android-developer
- **Expo Forums**: https://forums.expo.dev/

---

## ✅ What Happens After Submission?

1. **Review Period**: 1-7 days (usually 1-3 days)
2. **Google Tests**: Automated security and policy checks
3. **Manual Review**: Human reviewer checks your app
4. **Approval/Rejection**: You'll get an email
5. **If Approved**: App goes live automatically!
6. **If Rejected**: Fix issues and resubmit

---

## 🎉 Once Published

Your app will be available at:
```
https://play.google.com/store/apps/details?id=com.smartube.app
```

Users can search "SmarTube" on Play Store and install it!

---

## 📈 Post-Launch Checklist

- [ ] Monitor app reviews and ratings
- [ ] Respond to user feedback
- [ ] Track downloads in Play Console
- [ ] Fix bugs reported by users
- [ ] Release updates with new features
- [ ] Keep Emergent hosting active (backend needed!)

---

## 🔄 Updating Your App

When you want to release an update:

1. Make changes to your code
2. Increment version in `app.json`:
   ```json
   "version": "1.0.1"  // was 1.0.0
   ```
3. Build new AAB:
   ```bash
   eas build --platform android --profile production
   ```
4. Upload to Play Console (create new release)
5. Submit for review again

---

**🚀 You're Ready to Publish SmarTube!**

Start with STEP 1 above and follow each step carefully. The whole process takes about 2-3 hours of your time (plus waiting for builds and review).

Good luck! 🎊
