# Deployment Guide

This guide covers deploying the Zerodha Clone application across three separate apps to production.

## Overview

The project has three components that need separate deployment:

1. **Backend** (Node.js/Express) — API server
2. **Frontend** (React) — Landing page and signup experience
3. **Dashboard** (React) — Trading dashboard

Each can be deployed to different platforms.

## Backend Deployment

### Option 1: Deploy to Render

Render is a simple, free platform for Node.js apps.

#### Steps:

1. **Create a Render account**
   - Go to [render.com](https://render.com)
   - Sign up and log in

2. **Create a new Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the repo

3. **Configure the service**
   - **Name**: zerodha-clone-backend
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free (or Starter)

4. **Add environment variables**
   - Click "Environment"
   - Add `MONGO_URL` with your MongoDB Atlas connection string
   - Add `PORT` as `3002` (optional, Render assigns one)

5. **Deploy**
   - Click "Create Web Service"
   - Render will build and deploy automatically

6. **Get the backend URL**
   - After deployment, you'll see a URL like: `https://zerodha-clone-backend.onrender.com`
   - Save this for frontend/dashboard configuration

### Option 2: Deploy to Railway

Railway is another simple option with free tier.

#### Steps:

1. **Create a Railway account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Create a new project**
   - Click "New Project" → "Deploy from GitHub"
   - Select your repository

3. **Configure**
   - Select the `backend` directory
   - Add environment variables:
     - `MONGO_URL`: your MongoDB Atlas URI
     - `NODE_ENV`: production

4. **Deploy**
   - Railway will automatically detect Node.js and deploy

### Option 3: Deploy to Heroku (Paid)

Heroku is also reliable but has moved to a paid model.

#### Steps:

1. Install Heroku CLI
2. Log in: `heroku login`
3. Create app: `heroku create zerodha-clone-backend`
4. Add environment variables:
   ```bash
   heroku config:set MONGO_URL="your-mongodb-uri"
   ```
5. Deploy:
   ```bash
   git push heroku main
   ```

## Frontend Deployment

### Option 1: Deploy to Vercel

Vercel is optimized for React apps and has a generous free tier.

#### Steps:

1. **Create a Vercel account**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub

2. **Import project**
   - Click "Add New" → "Project"
   - Select your repository
   - Select `frontend` as the root directory

3. **Configure**
   - **Framework Preset**: Create React App
   - **Environment Variables**:
     - `REACT_APP_BACKEND_URL`: your backend URL (e.g., `https://zerodha-clone-backend.onrender.com`)
   - Leave other settings as default

4. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy automatically
   - You'll get a URL like: `https://zerodha-clone-frontend.vercel.app`

### Option 2: Deploy to Netlify

Netlify is another excellent React hosting option.

#### Steps:

1. **Create a Netlify account**
   - Go to [netlify.com](https://netlify.com)
   - Sign up with GitHub

2. **Add new site**
   - Click "Add new site" → "Import an existing project"
   - Select your repository

3. **Configure**
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/build`
   - **Environment variables**:
     - `REACT_APP_BACKEND_URL`: your backend URL

4. **Deploy**
   - Click "Deploy site"
   - Netlify will build and deploy

### Update Frontend Config

In your deployed frontend, you need to update the API calls to use the backend URL:

**File**: `frontend/src/landing_page/signup/Signup.js`

Update the backend endpoint:

```javascript
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:3002";
```

Then use `BACKEND_URL` in your fetch calls:

```javascript
const response = await fetch(`${BACKEND_URL}/signup`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(userData),
});
```

## Dashboard Deployment

### Option 1: Deploy to Vercel

Use the same process as the frontend.

#### Steps:

1. **Create a new Vercel project**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New" → "Project"
   - Select your repository
   - Select `dashboard` as the root directory

2. **Configure**
   - **Framework Preset**: Create React App
   - **Environment Variables**:
     - `REACT_APP_BACKEND_URL`: your backend URL
   - Leave other settings as default

3. **Deploy**
   - Click "Deploy"
   - You'll get a URL like: `https://zerodha-clone-dashboard.vercel.app`

### Option 2: Deploy to Netlify

Same process as the frontend, just select `dashboard` as the base directory.

### Update Dashboard Config

In your deployed dashboard, update API calls similarly:

**File**: `dashboard/src/components/Dashboard.js` (or wherever API calls are made)

```javascript
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:3002";
```

## Update Frontend to Link to Dashboard

The frontend needs to know where the dashboard is deployed.

**File**: `frontend/src/landing_page/signup/Signup.js`

Update the dashboard redirect URL:

```javascript
const DASHBOARD_URL = process.env.REACT_APP_DASHBOARD_URL || "http://localhost:3001";
```

Add to frontend environment variables:
- `REACT_APP_DASHBOARD_URL`: your deployed dashboard URL (e.g., `https://zerodha-clone-dashboard.vercel.app`)

## MongoDB Atlas Setup

MongoDB is already configured via connection string, but ensure:

1. **Create a cluster** on [mongodb.com/cloud](https://mongodb.com/cloud)
2. **Add database user** with username and password
3. **Whitelist IP**: Allow all IPs (0.0.0.0/0) or specific deployment IPs
4. **Copy connection string**:
   ```text
   mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
   ```
5. **Use in backend environment variables**

## Summary: Deployment URLs

After deployment, you'll have three URLs:

| App       | Platform | URL                                           |
|-----------|----------|-----------------------------------------------|
| Backend   | Render   | https://zerodha-clone-backend.onrender.com    |
| Frontend  | Vercel   | https://zerodha-clone-frontend.vercel.app     |
| Dashboard | Vercel   | https://zerodha-clone-dashboard.vercel.app    |

## Testing the Deployed App

1. Visit the frontend URL
2. Click "Signup"
3. Enter details and submit
4. Should redirect to the deployed dashboard
5. Test orders, holdings, and other features

## Troubleshooting

### CORS errors
If you see CORS errors, ensure the backend is allowing requests from your frontend/dashboard domains:

**File**: `backend/index.js`

```javascript
app.use(cors({
  origin: [
    "https://zerodha-clone-frontend.vercel.app",
    "https://zerodha-clone-dashboard.vercel.app",
    "http://localhost:3000",
    "http://localhost:3001"
  ]
}));
```

### MongoDB connection fails
- Verify `MONGO_URL` is correct
- Check IP whitelist on MongoDB Atlas (allow 0.0.0.0/0)
- Confirm database user credentials

### Environment variables not loaded
- Ensure you've added all required variables in the platform's environment settings
- Redeploy after adding/updating environment variables

## Next Steps

1. Deploy backend first
2. Deploy frontend with backend URL
3. Deploy dashboard with backend URL
4. Update frontend to link to dashboard URL
5. Test the full flow
6. Monitor logs for errors

For detailed guides on each platform, visit:
- Render: https://render.com/docs
- Vercel: https://vercel.com/docs
- Netlify: https://docs.netlify.com
- Railway: https://docs.railway.app
