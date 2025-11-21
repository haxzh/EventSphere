# Server setup

This server supports image uploads and events. To persist data across restarts you must provide a MongoDB URI.

Copy `.env.example` to `.env` (create it if missing) and set these variables:

- `MONGO_ATLAS_URI` - MongoDB connection string (if omitted, an in-memory DB is used and data will be lost on restart)
- `PORT` - server port (default 5000)
- `NODE_MAILER_USER` / `NODE_MAILER_PASS` - for email (optional)
- `STRIPE_KEY` - Stripe secret key (optional)
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret (optional)
- `CLIENT_URL` or `SERVER_URL` - optional base URL for client/server

Endpoints introduced for uploads and events:

- `POST /api/upload` - form-data single file with field name `image`. Returns `{ url: "http://<server>/uploads/<file>" }`.
- `POST /post/event` - existing event creation endpoint. Provide `profile` and `cover` fields (strings) to set image URLs.

Notes:
- Uploaded files are stored in `server/public/uploads` and served at `/uploads/<filename>`.
- For production, use cloud storage (S3/Cloudinary) and secure the upload route with authentication.

Examples:

Upload a file (curl):

```bash
curl -F "image=@/path/to/photo.jpg" http://localhost:5000/api/upload
```

Create event (example JSON):

```json
{
  "name": "My Event",
  "venue": "Hall",
  "date": "01/01/2026",
  "time": "10:00 AM",
  "description": "desc",
  "price": 100,
  "profile": "http://localhost:5000/uploads/profile-123.jpg",
  "cover": "http://localhost:5000/uploads/cover-123.jpg",
  "admin_id": "<admin id>"
}
```
