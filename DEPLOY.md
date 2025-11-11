# Quick Deployment Guide for Render

## Step 1: Initialize Git (if not already done)

```bash
git init
git add .
git commit -m "Initial commit - ready for Render deployment"
```

## Step 2: Push to GitHub

1. Create a new repository on GitHub (don't initialize with README)
2. Push your code:

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

## Step 3: Deploy on Render

### Option A: Using Blueprint (Easiest - Recommended)

1. Go to [render.com](https://render.com) and sign up/login
2. Click **"New +"** → **"Blueprint"**
3. Connect your GitHub account if not already connected
4. Select your repository
5. Render will automatically detect `render.yaml`
6. Review the settings and click **"Apply"**
7. Wait for deployment (usually 2-5 minutes)

### Option B: Manual Setup

1. Go to [render.com](https://render.com) and sign up/login
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `webnarrative` (or your choice)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (or paid if you want persistent storage)
5. Click **"Create Web Service"**

## Step 4: Test Your Deployment

Once deployed, Render will give you a URL like:
- `https://webnarrative.onrender.com`

Open this URL on:
- Your computer
- Your phone
- Any device with internet

All devices will see the same uploaded images! 🎉

## Important Notes

⚠️ **File Persistence on Free Tier:**
- Files uploaded will be lost when Render restarts your service
- This happens occasionally on the free tier
- For persistent storage, consider:
  - Upgrading to a paid plan with persistent disk
  - Integrating cloud storage (S3, Cloudinary) - recommended for production

## Troubleshooting

- **Build fails?** Check the logs in Render dashboard
- **Server won't start?** Make sure `package.json` has the correct start script
- **Can't access from other devices?** Make sure the service is "Live" (not "Sleeping")
  - Free tier services sleep after 15 minutes of inactivity
  - First request after sleep takes ~30 seconds to wake up

## Next Steps After Deployment

1. Test uploading images from different devices
2. Share the URL with friends to test global access
3. Consider adding cloud storage for persistent file storage
4. Monitor usage in Render dashboard

