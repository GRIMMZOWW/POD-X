# Railway Deployment Guide - CORS & YouTube Extraction

Quick reference for deploying POD-X backend to Railway with working CORS and YouTube extraction.

## Pre-Deployment Checklist

- [x] YouTube extraction using yt-dlp implemented
- [x] CORS configuration updated for Railway
- [ ] Railway project created
- [ ] Environment variables configured

## Railway Environment Variables

Set these in your Railway project settings:

```bash
NODE_ENV=production
FRONTEND_URL=https://your-vercel-app.vercel.app
YOUTUBE_MODE=ytdlp
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_key
```

> **Note:** Railway automatically sets `PORT` - don't override it.

## Deployment Steps

1. **Connect Repository to Railway**
   - Go to Railway dashboard
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your POD-X repository
   - Railway will auto-detect Node.js and deploy

2. **Configure Environment Variables**
   - Go to project → Variables tab
   - Add all variables listed above
   - **Critical:** Set `NODE_ENV=production`

3. **Set Root Directory** (if needed)
   - Go to Settings → Root Directory
   - Set to `backend` if your repo has both frontend and backend

4. **Deploy**
   - Railway will automatically deploy on push to main branch
   - First deployment may take 2-3 minutes

## Post-Deployment Testing

### Test 1: Health Check
```bash
curl https://your-app.up.railway.app/health
```
Expected: `{"status":"ok",...}`

### Test 2: CORS Preflight (from localhost)
```powershell
Invoke-WebRequest -Uri "https://your-app.up.railway.app/api/youtube/extract" `
  -Method OPTIONS `
  -Headers @{
    "Origin"="http://localhost:5173";
    "Access-Control-Request-Method"="POST"
  } `
  -UseBasicParsing
```
Expected: HTTP 200 with `Access-Control-Allow-Origin: http://localhost:5173`

### Test 3: YouTube Extraction
```powershell
Invoke-WebRequest -Uri "https://your-app.up.railway.app/api/youtube/extract" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ"}' `
  -UseBasicParsing
```
Expected: HTTP 200 with real YouTube audio data

### Test 4: From Frontend (localhost:5173)

Update your frontend `.env.local`:
```bash
VITE_API_URL=https://your-app.up.railway.app
```

Then test YouTube extraction from your frontend UI.

## Troubleshooting

### CORS Error: "No Access-Control-Allow-Origin"

**Check:**
1. `NODE_ENV=production` is set in Railway
2. Frontend origin is in `allowedOrigins` array in `backend/index.js`
3. Railway logs show CORS middleware is loaded

**Fix:** Verify CORS configuration allows your frontend domain

### YouTube Extraction Fails

**Check Railway logs:**
```bash
railway logs
```

**Common issues:**
- First request takes 10-15s (yt-dlp binary download)
- Age-restricted videos return error (expected)
- Network timeout (increase Railway timeout if needed)

### 404 on API Routes

**Check:**
- Root directory is set to `backend` in Railway settings
- `package.json` has correct `start` script
- Routes are registered in `index.js`

## Update Vercel Frontend

Update your Vercel environment variables:
```bash
VITE_API_URL=https://your-railway-app.up.railway.app
```

Redeploy Vercel frontend to pick up new API URL.

## Monitoring

Check Railway logs for:
- CORS warnings: `CORS blocked origin: ...`
- YouTube extraction: `[YouTube Service] Extracting with yt-dlp: ...`
- API requests: `2026-01-31T20:24:30.356Z - POST /api/youtube/extract`

## Security Notes

> [!WARNING]
> Current CORS config allows all origins in production for debugging. Once confirmed working, update `backend/index.js` to restrict to specific domains:

```javascript
if (process.env.NODE_ENV === 'production') {
    // Replace this:
    return callback(null, true);
    
    // With this:
    if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
    } else {
        callback(new Error('Not allowed by CORS'));
    }
}
```
