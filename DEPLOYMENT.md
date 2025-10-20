# Deployment Guide

## Production Deployment Setup

Your MERN application has been configured for production deployment. Here's how it works:

### What Changed

1. **Single Server Setup**: The Express server now serves both the API and the React frontend
2. **Static File Serving**: Built React files are served from `client/build/`
3. **Client-Side Routing**: React Router works properly with the catch-all route
4. **Production Scripts**: Added convenient npm scripts for deployment

### How to Run in Production

1. **Build and Start** (Recommended):
   ```bash
   npm run build:server
   ```
   This builds the React app and starts the server.

2. **Manual Steps**:
   ```bash
   # Build the React app
   npm run build
   
   # Start the server
   npm start
   ```

### Access Your Application

- **Frontend**: http://localhost:5000
- **API**: http://localhost:5000/api
- **API Status**: http://localhost:5000/api

### Development vs Production

- **Development**: Use `npm run dev` (runs both React dev server and Express server)
- **Production**: Use `npm run build:server` (builds React and runs single Express server)

### File Structure

```
├── client/
│   ├── build/          # Built React files (served by Express)
│   └── src/            # React source code
├── server.js           # Express server (serves both API and React)
└── package.json        # Updated with production scripts
```

### Key Features

- ✅ Single server on port 5000
- ✅ React app served as static files
- ✅ API routes work at `/api/*`
- ✅ Client-side routing works properly
- ✅ Production-optimized React build
- ✅ Environment variable support (PORT)

### Deployment to Cloud Platforms

For platforms like Heroku, Railway, or Vercel:

1. The `heroku-postbuild` script is already configured
2. Set the `PORT` environment variable
3. Ensure MongoDB is accessible from your deployment platform
4. Deploy using your platform's standard process

### Troubleshooting

- If React routes don't work, check that the catch-all route (`app.get("*", ...)`) is at the end
- If static files aren't loading, verify the `client/build` directory exists
- If API calls fail, check that API routes are defined before the catch-all route
