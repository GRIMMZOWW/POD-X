# Local Development Setup Guide

## Quick Start

### 1. Backend Setup (Terminal 1)
```bash
cd backend
npm install
npm start
```
**Expected:** Server running on `http://localhost:3000`

### 2. Frontend Setup (Terminal 2)
```bash
# From project root
npm install
npm run dev
```
**Expected:** Frontend running on `http://localhost:5173`

### 3. Environment Configuration

**Frontend `.env` file (already created):**
```bash
VITE_API_URL=http://localhost:3000
```

**Backend `.env` file:**
```bash
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
YOUTUBE_MODE=ytdlp
```

## Testing YouTube Extraction

### Option 1: Frontend UI (Recommended)
1. Open browser to `http://localhost:5173`
2. Navigate to YouTube input section
3. Paste a YouTube URL (e.g., `https://www.youtube.com/watch?v=dQw4w9WgXcQ`)
4. Click Play button
5. Accept disclaimer
6. Wait for extraction (10-15 seconds first time)
7. Audio should start playing automatically

### Option 2: Direct API Test
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/youtube/extract" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ"}' `
  -UseBasicParsing | Select-Object -ExpandProperty Content
```

### Option 3: HTML Test Page
1. Open `test-youtube-extraction.html` in browser
2. Enter YouTube URL
3. Click "Extract Audio"
4. Verify audio plays

## Troubleshooting

### CORS Errors
**Symptom:** "No Access-Control-Allow-Origin header" in browser console

**Fix:**
1. Verify backend is running on port 3000
2. Check backend console for CORS warnings
3. Ensure frontend is on `http://localhost:5173`
4. Restart both servers if needed

### Frontend Can't Connect to Backend
**Symptom:** Network error, connection refused

**Check:**
1. Backend is running: `http://localhost:3000/health` should return `{"status":"ok"}`
2. `.env` file exists with `VITE_API_URL=http://localhost:3000`
3. Restart frontend dev server to pick up `.env` changes

### YouTube Extraction Fails
**Symptom:** Error message in UI

**Common Causes:**
1. **First request slow:** yt-dlp binary downloading (wait 15 seconds)
2. **Age-restricted video:** Expected error, try different video
3. **Invalid URL:** Check URL format
4. **Network timeout:** Check internet connection

**Check Backend Logs:**
Look for:
```
[YouTube Service] Extracting with yt-dlp: https://...
```

### Audio Won't Play
**Symptom:** Extraction succeeds but no audio

**Check:**
1. Browser console for errors
2. Audio URL in response is not SoundHelix (should be googlevideo.com)
3. Click play button on mini player
4. Check browser audio permissions

## Current Status

✅ **Backend:**
- Running on port 3000
- yt-dlp integration active
- CORS configured for localhost:5173
- Real YouTube audio extraction working

✅ **Frontend:**
- Running on port 5173
- API URL configured to localhost:3000
- YouTubeInput component ready
- Auto-saves to library

## Next Steps

1. **Test locally:** Use frontend UI to extract YouTube video
2. **Verify playback:** Ensure audio plays correctly
3. **Deploy backend:** Push to Railway when local testing passes
4. **Update frontend .env:** Change to Railway URL for production
5. **Deploy frontend:** Push to Vercel

## Production Deployment

### Backend (Railway)
```bash
# Set environment variables in Railway dashboard:
NODE_ENV=production
FRONTEND_URL=https://your-vercel-app.vercel.app
YOUTUBE_MODE=ytdlp
```

### Frontend (Vercel)
Update `.env` or `.env.production`:
```bash
VITE_API_URL=https://your-railway-app.up.railway.app
```

## Useful Commands

```bash
# Check backend health
curl http://localhost:3000/health

# Check frontend is running
curl http://localhost:5173

# View backend logs
# (already visible in Terminal 1)

# Restart backend
# Ctrl+C in Terminal 1, then: npm start

# Restart frontend
# Ctrl+C in Terminal 2, then: npm run dev
```
