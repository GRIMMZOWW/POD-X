# Google Play Store Setup Guide

## 🎯 Complete Guide to Publishing POD-X on Google Play Store

---

## Prerequisites

Before you start, ensure you have:
- ✅ PWA setup complete (manifest.json, service worker, icons)
- ✅ Google Play Developer account ($25 one-time fee)
- ✅ Privacy Policy published (required by Play Store)
- ✅ Android Studio installed (for TWA build)

---

## Phase 1: Google Play Developer Account Setup (15 min)

### Step 1: Create Developer Account
1. Go to https://play.google.com/console
2. Sign in with your Google account
3. Pay the $25 registration fee
4. Complete the account setup form:
   - Developer name: Your name or company
   - Email address
   - Website (optional but recommended)
   - Phone number

### Step 2: Accept Agreements
- Developer Distribution Agreement
- US export laws compliance (if applicable)

---

## Phase 2: TWA (Trusted Web Activity) Setup (45 min)

### What is TWA?
TWA wraps your PWA in a minimal Android app that runs in Chrome Custom Tabs. Benefits:
- ✅ ~1MB app size
- ✅ Automatic updates (via your web app)
- ✅ No code duplication
- ✅ Full browser features

### Step 1: Install Android Studio
1. Download from: https://developer.android.com/studio
2. Install with default settings
3. Launch and complete initial setup

### Step 2: Create TWA Project

**Using Bubblewrap (Recommended - Easiest)**

1. **Install Bubblewrap CLI**
   ```bash
   npm install -g @bubblewrap/cli
   ```

2. **Initialize TWA Project**
   ```bash
   cd POD-X
   bubblewrap init --manifest https://your-vercel-url.app/manifest.json
   ```

3. **Follow the prompts**:
   - App name: POD-X
   - Package name: `com.grimmzoww.podx`
   - Host: your-vercel-url.app
   - Start URL: /
   - Display mode: standalone
   - Theme color: #6B46C1
   - Background color: #121212

4. **Build the APK**
   ```bash
   bubblewrap build
   ```

5. **Generate Android App Bundle (AAB)**
   ```bash
   bubblewrap build --target=bundle
   ```

**Result**: You'll get `app-release.aab` ready for Play Store!

---

### Step 3: Digital Asset Links (CRITICAL)

This verifies your Android app owns your web domain.

1. **Auto-generate with Bubblewrap**:
   ```bash
   bubblewrap update
   ```

2. **Or manually create** `.well-known/assetlinks.json`:
   ```json
   [{
     "relation": ["delegate_permission/common.handle_all_urls"],
     "target": {
       "namespace": "android_app",
       "package_name": "com.grimmzoww.podx",
       "sha256_cert_fingerprints": ["YOUR_SHA256_FINGERPRINT"]
     }
   }]
   ```

3. **Get SHA256 fingerprint**:
   ```bash
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey
   # Password: android
   ```

4. **Upload to your web server**:
   - Place file at: `https://your-domain.app/.well-known/assetlinks.json`
   - For Vercel: Put in `public/.well-known/` folder

5. **Verify**:
   - Visit: `https://your-domain.app/.well-known/assetlinks.json`
   - Should return the JSON file

---

## Phase 3: App Store Listing (30 min)

### Step 1: Create New App in Play Console
1. Go to Play Console: https://play.google.com/console
2. Click "Create app"
3. Fill in:
   - App name: **POD-X - Multimedia Platform**
   - Default language: English (United States)
   - App or game: App
   - Free or paid: Free
   - Declarations:
     - ✅ Comply with Google Play policies
     - ✅ US export laws compliance

### Step 2: Store Listing

**App details**:
```
Title: POD-X - Multimedia Platform
Short description (80 chars):
Stream YouTube, play music, read books with TTS. All in one app.

Full description (4000 chars):
🎵 POD-X - Your Ultimate Multimedia Platform

Transform your phone into a powerful multimedia hub! POD-X combines YouTube streaming, music playback, and book reading with text-to-speech in one beautiful, easy-to-use app.

✨ FEATURES

📺 YouTube Streaming
• Stream any YouTube video
• Save favorites to your library
• Playback history

🎵 Music Player
• Upload your MP3/WAV files
• Beautiful audio player
• Save to library for offline listening

📚 Book Reader with TTS
• Upload PDF, EPUB, TXT files
• Text-to-Speech (read aloud)
• Auto-save reading positions
• Beautiful reading experience

💾 Library Management
• Save all your content in one place
• Favorites and recently played
• Search your library
• Delete and organize easily

🎨 Beautiful Design
• Dark theme optimized for OLED
• Smooth animations
• Mobile-first design
• Intuitive navigation

🔒 Privacy First
• Local storage (IndexedDB)
• No tracking or analytics
• Your data stays on your device
• Optional cloud sync with Supabase

WHY POD-X?
✓ All-in-one solution
✓ Beautiful, modern UI
✓ Free and open-source
✓ Regular updates
✓ Privacy-focused

Perfect for students, commuters, and anyone who loves multimedia content!

Download POD-X today and experience the future of multimedia! 🚀
```

**App category**:
- Category: Music & Audio
- Tags: music player, youtube, audiobook, tts

**Contact details**:
- Email: [your-email@domain.com]
- Website: [your-vercel-url]
- Privacy Policy: [your-domain]/PRIVACY_POLICY.md

---

### Step 3: Graphic Assets

**App icon (512x512px)**:
- Use the generated icon: `public/icons/icon-512x512.png`
- Upload here

**Feature graphic (1024x500px)**:
- Create a banner with:
  - POD-X logo
  - Text: "Stream • Play • Read"
  - Purple gradient background

**Screenshots (Required: Minimum 2, Maximum 8)**:

**Phone Screenshots**:
1. Home/Stream page (YouTube player)
2. Library page (with content)
3. Upload page (showing upload options)
4. Book player (TTS interface)
5. Mini player (showing playback)
6. Settings page

**Tips for screenshots**:
- Use actual app screenshots on real devices
- Show app in use (not empty states)
- Portrait orientation (1080x1920 or similar)
- Add captions if helpful

**How to capture**:
1. Open your deployed app on Android phone
2. Screenshot each main screen
3. Or use browser DevTools mobile view
4. Edit to 1080x1920px if needed

---

### Step 4: Content Rating

1. Click "Content rating" in dashboard
2. Fill out questionnaire:
   - App category: Music & Audio
   - Violence: None
   - Sexual content: None
   - Language: None
   - Controlled substances: None
   - Gambling: No
   - User-generated content: No (YouTube is embedded, not hosted)

**Result**: Likely "Everyone" or "Teen" rating

---

### Step 5: App Content

**Privacy Policy** (Required!):
- URL: Host your `PRIVACY_POLICY.md` on GitHub Pages or Vercel
- Example: `https://grimmzoww.github.io/POD-X/privacy`

**Ads**:
- Does your app contain ads? **No**

**App access**:
- Is all functionality accessible without special access? **Yes**
- Or: Account required (if using Supabase auth)

**Target audience**:
- Age range: 13+ or Everyone

**Data safety**:
- Does your app collect user data? **Yes** (email for auth)
- Data types:
  - Email address (for authentication)
  - Usage data (saved to device)
- Is data encrypted? **Yes**
- Can users delete their data? **Yes**

---

## Phase 4: Upload APK/AAB (15 min)

### Production Track Setup

1. **Go to "Production" in left sidebar**
2. **Create new release**
3. **Upload your AAB**:
   - File: `app-release.aab` (from Bubblewrap)
   - Or: Manual APK

4. **Release details**:
   ```
   Release name: 1.0.0
   Release notes:
   
   🎉 Welcome to POD-X v1.0!
   
   Features:
   • YouTube video streaming
   • Music player (upload MP3/WAV)
   • Book reader with Text-to-Speech
   • Beautiful dark theme UI
   • Library management
   • Offline support (PWA)
   
   Thank you for trying POD-X! 🚀
   ```

5. **Review and roll out**

---

## Phase 5: Pre-Launch Testing (Optional but Recommended)

### Internal Testing Track
1. Create internal testing release
2. Add test users (email addresses)
3. Get feedback before public release

### Closed Testing (Beta)
1. Create closed testing track
2. Share link with beta testers
3. Collect feedback

**Timeline**:
- Internal test: Instant
- Closed beta: 1-2 days
- Production: 2-7 days review

---

## Phase 6: Submit for Review

### Final Checklist
- [ ] App info complete
- [ ] Store listing complete
- [ ] Graphics uploaded (icon, feature, screenshots)
- [ ] Content rating complete
- [ ] Privacy policy live
- [ ] Data safety form complete
- [ ] AAB/APK uploaded
- [ ] Release notes written
- [ ] Pricing set (Free)
- [ ] Countries selected (Worldwide or specific)

### Submit
1. Click "Send for review"
2. Wait 2-7 days for Google review
3. You'll get an email when approved

---

## After Approval

### App is Live! 🎉

**App URL**:
- https://play.google.com/store/apps/details?id=com.grimmzoww.podx

**Promote your app**:
- Share on social media
- Add badge to website:
  ```html
  <a href='https://play.google.com/store/apps/details?id=com.grimmzoww.podx'>
    <img src='https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png' height='80'/>
  </a>
  ```

---

## Updating Your App

When you update your web app:
1. **PWA updates automatically!** Users get new version on next visit
2. **TWA shows updated web app** (no rebuild needed!)
3. **Only rebuild if**:
   - Changing package name
   - Updating manifest.json structure
   - Adding new Android permissions

**To release update manually**:
```bash
# Increment version in manifest
bubblewrap update
bubblewrap build --target=bundle
# Upload new AAB to Play Console
```

---

## Troubleshooting

### "Digital Asset Links verification failed"
- Check `.well-known/assetlinks.json` is accessible
- Verify SHA256 fingerprint matches
- Wait 24-48 hours for propagation

### "App not compatible with my device"
- TWA requires Chrome 72+ on Android
- Check minimum SDK version in manifest

### "App rejected for policy violation"
- Review Google Play policies
- Ensure Privacy Policy is complete and accessible
- Check content rating accuracy

---

## Resources

**Documentation**:
- Bubblewrap: https://github.com/GoogleChromeLabs/bubblewrap
- TWA Guide: https://developer.chrome.com/docs/android/trusted-web-activity/
- Play Console: https://support.google.com/googleplay/android-developer/

**Support**:
- Play Console Help: https://support.google.com/googleplay/android-developer/
- Stack Overflow: [android] [trusted-web-activity]

---

## Success! 🚀

Your app is now on the Play Store!

**What you achieved**:
✅ PWA wrapped as Android app  
✅ 1MB app size (vs 20MB+ native)  
✅ Automatic updates via web  
✅ Professional Play Store listing  
✅ Compliant with all policies  

**Congratulations!** 🎉
