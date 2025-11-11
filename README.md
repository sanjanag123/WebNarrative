# WebNarrative - Global Image Sharing Platform

A Node.js web application that allows users from around the world to upload and view images organized by country. Users can click on countries on an interactive world map to upload and browse images.

## Features

- 🌍 Interactive world map with country selection
- 📸 Image upload and viewing
- 🌐 Global access - see images uploaded by users worldwide
- 🗑️ Delete your own uploaded images
- 📱 Responsive design

## Tech Stack

- **Backend**: Node.js with Express
- **File Upload**: Multer
- **Frontend**: Vanilla JavaScript, HTML, CSS
- **Map**: Google Charts GeoChart

## Local Development

### Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd WebNarrative
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

## Deployment to Render

### Option 1: Using render.yaml (Recommended)

1. Push your code to a GitHub repository

2. In Render Dashboard:
   - Click "New +" → "Blueprint"
   - Connect your GitHub repository
   - Render will automatically detect the `render.yaml` file
   - Click "Apply"

### Option 2: Manual Setup

1. Push your code to a GitHub repository

2. In Render Dashboard:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name**: webnarrative (or your preferred name)
     - **Environment**: Node
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Environment Variables**:
       - `NODE_ENV`: `production`
       - `PORT`: `10000` (Render will override this automatically)

3. Click "Create Web Service"

### Important Notes for Render

⚠️ **File Persistence**: 
- Render's free tier uses an **ephemeral filesystem**, meaning uploaded files will be **lost when the service restarts**.
- For persistent storage, you have two options:

#### Option A: Render Persistent Disk (Paid)
1. In your Render service settings, add a persistent disk
2. Mount it to `/opt/render/project/src/uploads`
3. Update `server.js` to use the mounted path

#### Option B: Cloud Storage (Recommended for Production)
Integrate with cloud storage services like:
- AWS S3
- Cloudinary
- Google Cloud Storage
- Azure Blob Storage

This ensures files persist across restarts and scales better.

## Project Structure

```
WebNarrative/
├── server.js              # Express server with API endpoints
├── index.html             # Main page with world map
├── map.js                 # Interactive map functionality
├── upload-script.js       # Client-side upload logic
├── upload-styles.css      # Upload page styles
├── styles.css             # Main styles
├── [country].html         # Country-specific upload pages
├── package.json           # Dependencies
├── render.yaml            # Render deployment config
└── uploads/               # Uploaded files (created automatically)
    └── metadata.json      # File metadata
```

## API Endpoints

- `POST /api/upload/:country` - Upload files for a country
- `GET /api/files/:country` - Get all files for a country
- `GET /api/files/:country/:filename` - Serve/download a specific file
- `DELETE /api/files/:country/delete/:fileId` - Delete a file (only by uploader)

## Environment Variables

- `PORT` - Server port (default: 3000, Render sets this automatically)
- `NODE_ENV` - Environment (production/development)

## Security Considerations

- File size limit: 50MB per file
- Users can only delete their own uploaded files
- Filenames are sanitized to prevent path traversal
- CORS enabled for cross-origin requests

## Future Enhancements

- [ ] Cloud storage integration (S3, Cloudinary, etc.)
- [ ] User authentication
- [ ] Image compression/optimization
- [ ] Comments and captions
- [ ] Image moderation
- [ ] Rate limiting

## License

ISC

