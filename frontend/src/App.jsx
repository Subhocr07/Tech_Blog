import React from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { SocketProvider } from './context/SocketContext';
import { ToastContainer } from './components/ToastContainer';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

import { Home } from './pages/Home';
import { PostDetails } from './pages/PostDetails';
import { CreatePost } from './pages/CreatePost';
import { EditPost } from './pages/EditPost';
import { Profile } from './pages/Profile';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { OAuthCallback } from './pages/OAuthCallback';

import { AdminLayout } from './admin/AdminLayout';
import { Dashboard } from './admin/Dashboard';
import { UsersManagement } from './admin/UsersManagement';
import { PostsManagement } from './admin/PostsManagement';
import { CommentsManagement } from './admin/CommentsManagement';
import { TagsManagement } from './admin/TagsManagement';

import { ProtectedRoute } from './routes/ProtectedRoute';
import { AdminRoute } from './routes/AdminRoute';

const MainLayout = () => (
  <div className="app-container">
    <Navbar />
    <main className="main-content">
      <Outlet />
    </main>
    <Footer />
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <SocketProvider>
            <Routes>
              <Route element={<MainLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/posts/:slug" element={<PostDetails />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/oauth-callback" element={<OAuthCallback />} />

                <Route
                  path="/create-post"
                  element={
                    <ProtectedRoute>
                      <CreatePost />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/edit-post/:id"
                  element={
                    <ProtectedRoute>
                      <EditPost />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
              </Route>

              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <div className="app-container">
                      <Navbar />
                      <AdminLayout />
                    </div>
                  </AdminRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="users" element={<UsersManagement />} />
                <Route path="posts" element={<PostsManagement />} />
                <Route path="tags" element={<TagsManagement />} />
                <Route path="comments" element={<CommentsManagement />} />
              </Route>

              <Route path="*" element={<Home />} />
            </Routes>

            <ToastContainer />
          </SocketProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
