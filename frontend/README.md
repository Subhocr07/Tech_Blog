# DevChronicle Frontend

Modern, responsive React single-page application and Admin Panel built with Vite, React Router 6, Context API, and modern Vanilla CSS.

## Features
- **Design System**: Glassmorphism surfaces (`backdrop-filter`), rich modern typography (`Plus Jakarta Sans`), curated palette, micro-animations, and responsive layouts.
- **Global Auth Context**: Manages session hydration, automatic token refresh, login, register, and logout.
- **Axios Interceptor**: Transparently handles expired 401 access tokens by invoking the refresh token endpoint and retrying original requests without interrupting the user.
- **Dedicated Admin Panel**: `/admin` with real-time stats cards, user management with role switching, post moderation with soft delete & restore, and comment moderation.
- **Real-Time WebSockets**: Socket.IO client receiving direct author notifications and pop-up toasts for new comments and posts.
- **Route Guards**: `ProtectedRoute` and `AdminRoute` verifying access on the client.

## Available Scripts

```bash
# Install dependencies
npm install

# Start Vite development server (proxies /api and /socket.io to backend)
npm run dev

# Build production bundle
npm run build

# Preview production build locally
npm run preview
```
