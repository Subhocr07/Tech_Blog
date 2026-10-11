import request from 'supertest';
import app from '../app.js';
import { User } from '../models/User.js';
import { Post } from '../models/Post.js';
import { Comment } from '../models/Comment.js';

describe('Admin & RBAC Integration Tests', () => {
  let regularUserToken;
  let regularUserId;
  let adminToken;
  let adminId;

  beforeEach(async () => {
    // 1. Regular user
    const userRes = await request(app).post('/api/v1/auth/register').send({
      name: 'Regular Member',
      email: 'member@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
    });
    regularUserToken = userRes.body.data.accessToken;
    regularUserId = userRes.body.data.user._id || userRes.body.data.user.id;

    // 2. Admin user
    const admin = new User({
      name: 'System Admin',
      email: 'admin@example.com',
      password: 'AdminPassword123!',
      role: 'admin',
    });
    await admin.save();

    const adminLoginRes = await request(app).post('/api/v1/auth/login').send({
      email: 'admin@example.com',
      password: 'AdminPassword123!',
    });
    adminToken = adminLoginRes.body.data.accessToken;
    adminId = admin._id.toString();

    // 3. Create dummy post and comment
    const post = new Post({
      title: 'Admin Test Post',
      slug: 'admin-test-post',
      content: 'This post is used to verify dashboard metrics.',
      author: regularUserId,
    });
    await post.save();

    const comment = new Comment({
      content: 'Discussion comment for stats verification.',
      author: regularUserId,
      post: post._id,
    });
    await comment.save();
  });

  describe('RBAC Route Protection at API Level', () => {
    it('should reject unauthenticated requests to /api/v1/admin/stats with 401', async () => {
      const res = await request(app).get('/api/v1/admin/stats');
      expect(res.status).toBe(401);
    });

    it('should reject regular users from accessing /api/v1/admin/stats with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/admin/stats')
        .set('Authorization', `Bearer ${regularUserToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN_ROLE');
    });

    it('should reject regular users from accessing /api/v1/users with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${regularUserToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN_ROLE');
    });

    it('should reject regular users from accessing /api/v1/admin/posts with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/admin/posts')
        .set('Authorization', `Bearer ${regularUserToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN_ROLE');
    });
  });

  describe('Admin Operations & Dashboard Metrics', () => {
    it('should allow admin to fetch dashboard statistics: total users, total posts, total comments', async () => {
      const res = await request(app)
        .get('/api/v1/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.stats).toBeDefined();

      const { totalUsers, totalPosts, totalComments, activePosts } = res.body.data.stats;
      expect(totalUsers).toBe(2); // 1 regular user + 1 admin
      expect(totalPosts).toBe(1);
      expect(activePosts).toBe(1);
      expect(totalComments).toBe(1);
      expect(res.body.data.recentUsers).toBeDefined();
    });

    it('should allow admin to manage users list', async () => {
      const res = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.users.length).toBe(2);
      expect(res.body.meta.total).toBe(2);
    });

    it('should allow admin to update user role and account status', async () => {
      const updateRes = await request(app)
        .patch(`/api/v1/users/${regularUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          role: 'admin',
          isActive: false,
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.user.role).toBe('admin');
      expect(updateRes.body.data.user.isActive).toBe(false);

      const dbUser = await User.findById(regularUserId);
      expect(dbUser.role).toBe('admin');
      expect(dbUser.isActive).toBe(false);
    });

    it('should prevent admin from deleting their own account (400 Bad Request)', async () => {
      const res = await request(app)
        .delete(`/api/v1/users/${adminId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('CANNOT_DELETE_SELF');
    });

    it('should allow admin to delete another user and soft-delete their posts', async () => {
      const res = await request(app)
        .delete(`/api/v1/users/${regularUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);

      const deletedUser = await User.findById(regularUserId);
      expect(deletedUser).toBeNull();

      const userPosts = await Post.find({ author: regularUserId });
      expect(userPosts.every((p) => p.isDeleted)).toBe(true);
    });
  });
});
