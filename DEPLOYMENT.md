# 🚀 FREE Deployment Guide for MediCare AI

## 📋 Deployment Checklist

✅ Git repository initialized  
⬜ GitHub repository created  
⬜ Frontend deployed (Vercel/Netlify)  
⬜ Backend deployed (Railway/Render)  
⬜ Environment variables configured  
⬜ APIs connected  

## 🎯 **Option 1: RECOMMENDED - Vercel + Railway (Easiest)**

### Step 1: Create GitHub Repository
1. Go to [GitHub.com](https://github.com) and create a new repository
2. Name it: `medicare-ai-chatbot`
3. Don't initialize with README (we already have one)
4. Copy the repository URL

### Step 2: Push to GitHub
```bash
git remote add origin https://github.com/YOUR_USERNAME/medicare-ai-chatbot.git
git branch -M main
git push -u origin main
```

### Step 3: Deploy Frontend to Vercel ⭐
1. Visit [vercel.com](https://vercel.com)
2. Sign up/login with GitHub
3. Click "New Project"
4. Import your GitHub repository
5. **Root Directory**: Set to `frontend`
6. **Framework Preset**: React
7. **Environment Variables**:
   - `REACT_APP_API_URL` = `https://YOUR_BACKEND_URL` (get this from Step 4)
8. Click "Deploy"
9. Your frontend will be live at: `https://medicare-ai-chatbot.vercel.app`

### Step 4: Deploy Backend to Railway ⭐
1. Visit [railway.app](https://railway.app)
2. Sign up/login with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. **Root Directory**: Set to `backend`
6. **Environment Variables**:
   - `GEMINI_API_KEY` = `AIzaSyC9WVZri_Gas_scMlkk-OeveNCkR5LMLCc`
7. Railway will auto-deploy using your `Procfile`
8. Your backend will be live at: `https://YOUR_PROJECT.up.railway.app`

### Step 5: Update Frontend API URL
1. Go back to Vercel
2. Go to your project → Settings → Environment Variables
3. Update `REACT_APP_API_URL` with your Railway backend URL
4. Redeploy frontend

---

## 🎯 **Option 2: Netlify + Render**

### Frontend: Netlify
1. Visit [netlify.com](https://netlify.com)
2. Drag your `frontend/build` folder to deploy (after running `npm run build`)
3. Or connect GitHub repository
4. **Build Command**: `npm run build`
5. **Publish Directory**: `build`
6. **Base Directory**: `frontend`

### Backend: Render
1. Visit [render.com](https://render.com)
2. Connect GitHub repository
3. Use Web Service
4. **Root Directory**: `backend`
5. **Build Command**: `pip install -r requirements.txt`
6. **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

---

## 🎯 **Option 3: GitHub Pages + Heroku**

### Frontend: GitHub Pages
```bash
cd frontend
npm install --save-dev gh-pages
npm run build
npx gh-pages -d build
```

### Backend: Heroku
```bash
cd backend
heroku create medicare-ai-backend
heroku config:set GEMINI_API_KEY=AIzaSyC9WVZri_Gas_scMlkk-OeveNCkR5LMLCc
git subtree push --prefix backend heroku main
```

---

## 🔧 Environment Variables Setup

### Frontend (.env.production)
```env
REACT_APP_API_URL=https://your-backend-url.railway.app
```

### Backend (Platform Environment Variables)
```env
GEMINI_API_KEY=AIzaSyC9WVZri_Gas_scMlkk-OeveNCkR5LMLCc
PORT=8000
```

---

## 🌐 Expected Live URLs

After deployment, you'll have:
- **Frontend**: `https://medicare-ai-chatbot.vercel.app`
- **Backend API**: `https://medicare-ai-backend.up.railway.app`
- **API Health**: `https://medicare-ai-backend.up.railway.app/health`

---

## 🔍 Troubleshooting

### Common Issues:
1. **CORS Errors**: Backend includes CORS middleware for all origins
2. **API Key**: Ensure `GEMINI_API_KEY` is set in backend environment
3. **Build Errors**: Check Node.js version (use 18+)
4. **Port Issues**: Railway/Render auto-assign ports via `$PORT`

### Testing Deployment:
1. Test backend: `curl https://your-backend.railway.app/health`
2. Test frontend: Open the Vercel URL in browser
3. Test API connection: Try chatting in the frontend

---

## 💡 Quick Start Commands

```bash
# After creating GitHub repo
git remote add origin https://github.com/YOUR_USERNAME/medicare-ai-chatbot.git
git push -u origin main

# Test locally before deploying
cd frontend && npm run build  # Test frontend build
cd backend && uvicorn main:app --reload  # Test backend
```

**🎉 That's it! Your medical chatbot will be live and accessible worldwide for FREE!**
