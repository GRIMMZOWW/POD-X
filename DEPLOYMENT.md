# POD-X Backend Deployment Guide

## Deploy to Render (Recommended - Free Tier)

### Step 1: Prepare Repository
Your backend code is ready in the `backend/` folder.

### Step 2: Deploy to Render

1. **Go to Render**: https://render.com
2. **Sign Up/Login** with GitHub
3. **Create New Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub account
   - Select repository: `GRIMMZOWW/POD-X`
   - Click "Connect"

4. **Configure Service**:
   ```
   Name: pod-x-backend
   Region: Choose closest to you
   Branch: main
   Root Directory: backend
   Runtime: Node
   Build Command: npm install
   Start Command: node index.js
   ```

5. **Add Environment Variables**:
   Click "Advanced" → "Add Environment Variable"
   
   ```
   NODE_ENV=production
   PORT=3000
   YOUTUBE_MODE=ytdlp
   FRONTEND_URL=https://pod--x.vercel.app
   ```

6. **Select Plan**: Free (sufficient for MVP)

7. **Click "Create Web Service"**

8. **Wait for Deployment** (2-3 minutes)
   - Render will show build logs
   - Once complete, you'll get a URL like: `https://pod-x-backend.onrender.com`

### Step 3: Update Frontend Environment Variable

Once backend is deployed, copy the Render URL and run:

```bash
# Remove old value
npx vercel env rm VITE_API_URL production

# Add new production backend URL
npx vercel env add VITE_API_URL production
# When prompted, enter: https://pod-x-backend.onrender.com

# Redeploy frontend
npx vercel --prod
```

### Step 4: Test Production

Visit: https://pod--x.vercel.app
- Sign up/login with Supabase auth
- Try streaming a YouTube video
- Check that it saves to library

---

## Alternative: Deploy Backend to Vercel

If you prefer to deploy backend to Vercel instead:

```bash
cd backend
npx vercel --prod

# Set environment variables in Vercel dashboard:
# - NODE_ENV=production
# - YOUTUBE_MODE=ytdlp
# - FRONTEND_URL=https://pod--x.vercel.app

# Copy the deployed URL and update frontend:
cd ..
npx vercel env rm VITE_API_URL production
npx vercel env add VITE_API_URL production
# Enter the backend Vercel URL
npx vercel --prod
```

---

## Troubleshooting

### CORS Errors
- Make sure `FRONTEND_URL` in backend matches your Vercel frontend URL
- Backend `index.js` already configured to allow `https://pod--x.vercel.app`

### YouTube Extraction Fails
- Check backend logs in Render dashboard
- Verify `YOUTUBE_MODE=ytdlp` is set
- May need to install `yt-dlp` in production (Render does this automatically)

### Database/Auth Issues
- Verify Supabase credentials are set in Vercel frontend environment variables
- Check Supabase dashboard for auth logs

---

## Environment Variables Summary

### Frontend (Vercel)
```
VITE_SUPABASE_URL=https://tstbpyiepkihzptjwjxp.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
VITE_API_URL=https://pod-x-backend.onrender.com
```

### Backend (Render)
```
NODE_ENV=production
PORT=3000
YOUTUBE_MODE=ytdlp
FRONTEND_URL=https://pod--x.vercel.app
```
