# POD-X Phase 1 MVP

A mobile-first audio streaming application with YouTube integration, built with React, Vite, and Supabase.

## Features

- 🎵 **YouTube Audio Streaming** - Stream audio from YouTube videos
- 📚 **Library Management** - Save and organize your streamed content
- 🎨 **Dark Theme** - Beautiful dark UI (#121212 background)
- 🔐 **Authentication** - Secure login with Supabase Auth
- 💾 **Offline Storage** - IndexedDB for local library
- ⚡ **Fast Playback** - Howler.js audio player with progress tracking

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS
- **State Management**: Zustand
- **Audio**: Howler.js
- **Database**: Supabase (auth & metadata) + IndexedDB (local storage)
- **Backend**: Node.js + Express + yt-dlp
- **Routing**: React Router

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Supabase account (for authentication)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd POD-X
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   cd ..
   ```

4. **Configure environment variables**
   ```bash
   # Copy .env.example to .env
   cp .env.example .env
   
   # Edit .env and add your Supabase credentials
   # Get them from: https://supabase.com/dashboard/project/_/settings/api
   ```

5. **Start the development servers**

   **Terminal 1 - Frontend:**
   ```bash
   npm run dev
   ```

   **Terminal 2 - Backend:**
   ```bash
   cd backend
   npm start
   ```

6. **Open the app**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3000

## Project Structure

```
POD-X/
├── backend/                 # Express backend
│   ├── index.js            # Server entry point
│   ├── routes/             # API routes
│   └── services/           # Business logic
├── src/
│   ├── components/         # React components
│   │   ├── auth/          # Auth components
│   │   ├── common/        # Shared components
│   │   ├── layout/        # Layout components
│   │   ├── library/       # Library components
│   │   ├── player/        # Audio player components
│   │   └── youtube/       # YouTube components
│   ├── contexts/          # React contexts
│   ├── lib/               # Utilities
│   ├── pages/             # Page components
│   ├── store/             # Zustand stores
│   └── App.jsx            # Main app component
└── package.json
```

## Usage

### 1. Sign Up / Login

- Create an account with email/password
- Or sign in with Google OAuth

### 2. Stream YouTube Content

- Go to the Stream page
- Paste a YouTube URL
- Accept the disclaimer
- Click play to stream

### 3. Manage Your Library

- Streamed content is automatically saved
- Go to Library tab to view all content
- Click heart icon to favorite
- Use search to find content
- Delete unwanted items

### 4. Audio Player

- Mini player appears at bottom when playing
- Play/pause, skip, volume controls
- Seekable progress bar
- Playback progress is saved automatically

## Features in Detail

### YouTube Integration

- Three-tier fallback system:
  1. yt-dlp (primary)
  2. Cobalt API (fallback)
  3. Mock mode (development)
- Legal disclaimer before extraction
- Metadata extraction (title, channel, thumbnail)

### Library System

- IndexedDB for local storage
- Auto-save on stream
- Search functionality
- Favorites filter
- Storage quota monitoring
- Playback progress persistence

### Authentication

- Email/password signup/login
- Google OAuth support
- Protected routes
- Session persistence
- User profile display

## Development

### Available Scripts

**Frontend:**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

**Backend:**
- `npm start` - Start backend server
- `npm run dev` - Start with auto-reload (if configured)

### Environment Variables

**Frontend (.env):**
```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:3000
```

**Backend (backend/.env):**
```env
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
YOUTUBE_MODE=ytdlp
```

## Troubleshooting

### YouTube Extraction Fails

- Check backend logs for errors
- Try switching to Mock mode: Set `YOUTUBE_MODE=mock` in `backend/.env`
- Cobalt API fallback activates automatically after 2 yt-dlp failures

### Supabase Auth Not Working

- Verify your Supabase credentials in `.env`
- Check Supabase dashboard for project status
- Ensure email confirmation is disabled (Settings > Authentication)

### Storage Quota Exceeded

- Delete old content from Library
- Check storage meter in Library page
- IndexedDB quota varies by browser (usually 50-100MB)

## License

MIT

## Acknowledgments

- YouTube extraction powered by yt-dlp
- Audio playback by Howler.js
- UI components styled with Tailwind CSS
- Backend API with Express.js
