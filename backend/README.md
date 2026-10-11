# DevChronicle Backend

Robust, production-ready Express & MongoDB REST API powering the DevChronicle Blog Management System.

## Architecture Highlights
- **Layered Architecture**: Strict separation of concerns across Controllers, Services, Models, and Middleware.
- **Security**: JWT Access Tokens (15m) + Long-lived Refresh Tokens (7d) stored in secure HTTP-only cookies and tracked in DB for instant revocation.
- **RBAC**: Multi-role authorization (`admin` and `user`) enforced server-side.
- **Soft Deletion**: Posts and comments are soft-deleted with timestamps, filtering normal queries while supporting admin restoration.
- **Slug Generation**: Unique, URL-friendly slugs generated automatically with collision avoidance.
- **Real-Time Notifications**: Modular Socket.IO integration emitting comment notifications directly to post authors and global post broadcast events.
- **Testing**: 31 comprehensive unit and integration tests powered by Jest, Supertest, and `mongodb-memory-server`.

## Available Scripts

```bash
# Install dependencies
npm install

# Run database seeder (Creates Admin + 3 Users + 6 Articles + Comments)
npm run seed

# Start development server with live reload
npm run dev

# Run unit and integration tests (isolated in-memory MongoDB)
npm test

# Start production server
npm start
```

## Environment Variables (.env)
```ini
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/blog_management_db
CLIENT_URL=http://localhost:5173

JWT_ACCESS_SECRET=dev_jwt_access_secret_super_secure_key_1234567890
JWT_REFRESH_SECRET=dev_jwt_refresh_secret_super_secure_key_0987654321
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:5000/api/v1/auth/google/callback

FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=
FACEBOOK_CALLBACK_URL=http://localhost:5000/api/v1/auth/facebook/callback
```
