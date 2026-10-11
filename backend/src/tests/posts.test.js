import request from 'supertest';
import app from '../app.js';
import { User } from '../models/User.js';
import { Post } from '../models/Post.js';

describe('Posts Integration Tests', () => {
  let userToken;
  let userId;
  let otherUserToken;
  let otherUserId;
  let adminToken;
  let adminId;

  beforeEach(async () => {
    // Create user 1
    const userRes = await request(app).post('/api/v1/auth/register').send({
      name: 'Author One',
      email: 'author1@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
    });
    userToken = userRes.body.data.accessToken;
    userId = userRes.body.data.user._id || userRes.body.data.user.id;

    // Create user 2
    const otherUserRes = await request(app).post('/api/v1/auth/register').send({
      name: 'Author Two',
      email: 'author2@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
    });
    otherUserToken = otherUserRes.body.data.accessToken;
    otherUserId = otherUserRes.body.data.user._id || otherUserRes.body.data.user.id;

    // Create admin
    const adminUser = new User({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'AdminPassword123!',
      role: 'admin',
    });
    await adminUser.save();

    const adminLoginRes = await request(app).post('/api/v1/auth/login').send({
      email: 'admin@example.com',
      password: 'AdminPassword123!',
    });
    adminToken = adminLoginRes.body.data.accessToken;
    adminId = adminUser._id.toString();
  });

  describe('POST /api/v1/posts', () => {
    it('should create a post with generated slug and author association', async () => {
      const res = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Mastering Modern MERN Stack',
          content: 'Here is a comprehensive deep dive into the MERN stack with modern patterns and clean architecture.',
          tags: ['react', 'node', 'mongodb'],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.post).toBeDefined();
      expect(res.body.data.post.slug).toBe('mastering-modern-mern-stack');
      expect(res.body.data.post.tags).toEqual(['react', 'node', 'mongodb']);
      expect(res.body.data.post.isDeleted).toBe(false);
      expect(res.body.data.post.author.email).toBe('author1@example.com');
    });

    it('should handle slug collisions by appending a counter', async () => {
      const postData = {
        title: 'Collision Test Title',
        content: 'Content for the first article testing slug uniqueness.',
      };

      const res1 = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${userToken}`)
        .send(postData);

      const res2 = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${userToken}`)
        .send(postData);

      expect(res1.status).toBe(201);
      expect(res2.status).toBe(201);
      expect(res1.body.data.post.slug).toBe('collision-test-title');
      expect(res2.body.data.post.slug).toBe('collision-test-title-1');
    });

    it('should reject post creation if unauthenticated', async () => {
      const res = await request(app)
        .post('/api/v1/posts')
        .send({
          title: 'Unauthorized Post',
          content: 'This should fail.',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should validate request body and reject invalid payload (422)', async () => {
      const res = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: '', // empty title
          content: 'short', // too short (< 10 chars)
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });
  });

  describe('GET /api/v1/posts & /api/v1/posts/slug/:slug', () => {
    let post1;
    let post2;

    beforeEach(async () => {
      const p1Res = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'First Post About React',
          content: 'Detailed discussion regarding React 19 and concurrent features.',
          tags: ['react'],
        });
      post1 = p1Res.body.data.post;

      const p2Res = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Second Post About Node',
          content: 'Discussion about backend Node.js performance optimization and streaming.',
          tags: ['node'],
        });
      post2 = p2Res.body.data.post;
    });

    it('should return list of posts with pagination metadata', async () => {
      const res = await request(app).get('/api/v1/posts?page=1&limit=10');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.posts.length).toBe(2);
      expect(res.body.meta).toBeDefined();
      expect(res.body.meta.total).toBe(2);
    });

    it('should filter posts by tag', async () => {
      const res = await request(app).get('/api/v1/posts?tag=react');

      expect(res.status).toBe(200);
      expect(res.body.data.posts.length).toBe(1);
      expect(res.body.data.posts[0].title).toBe('First Post About React');
    });

    it('should get post by unique slug', async () => {
      const res = await request(app).get(`/api/v1/posts/slug/${post1.slug}`);

      expect(res.status).toBe(200);
      expect(res.body.data.post.title).toBe(post1.title);
      expect(res.body.data.post.author.email).toBe('author1@example.com');
    });

    it('should return 404 for unknown slug', async () => {
      const res = await request(app).get('/api/v1/posts/slug/non-existent-slug-xyz');
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('POST_NOT_FOUND');
    });
  });

  describe('Post Authorization & Soft Deletion (RBAC)', () => {
    let createdPost;

    beforeEach(async () => {
      const pRes = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Protected Article by User 1',
          content: 'Only Author 1 or Admin can edit or delete this article.',
          tags: ['security'],
        });
      createdPost = pRes.body.data.post;
    });

    it('should allow author to update their own post', async () => {
      const res = await request(app)
        .patch(`/api/v1/posts/${createdPost._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Updated Title by Author',
          content: 'Updated content body with more details.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.post.title).toBe('Updated Title by Author');
      expect(res.body.data.post.slug).toBe('updated-title-by-author');
    });

    it('should reject another regular user from updating the post (403 Forbidden)', async () => {
      const res = await request(app)
        .patch(`/api/v1/posts/${createdPost._id}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({
          title: 'Hacked Title',
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('UNAUTHORIZED_POST_EDIT');
    });

    it('should allow admin to update any post', async () => {
      const res = await request(app)
        .patch(`/api/v1/posts/${createdPost._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Admin Edited Title',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.post.title).toBe('Admin Edited Title');
    });

    it('should reject another regular user from deleting the post (403 Forbidden)', async () => {
      const res = await request(app)
        .delete(`/api/v1/posts/${createdPost._id}`)
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('UNAUTHORIZED_POST_DELETE');
    });

    it('should allow author to soft-delete their own post and hide from public queries', async () => {
      const deleteRes = await request(app)
        .delete(`/api/v1/posts/${createdPost._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(deleteRes.status).toBe(200);

      const dbPost = await Post.findById(createdPost._id);
      expect(dbPost.isDeleted).toBe(true);
      expect(dbPost.deletedAt).not.toBeNull();

      // Verify public list does not return it
      const publicListRes = await request(app).get('/api/v1/posts');
      expect(publicListRes.body.data.posts.length).toBe(0);

      // Verify public slug fetch returns 404
      const publicSlugRes = await request(app).get(`/api/v1/posts/slug/${createdPost.slug}`);
      expect(publicSlugRes.status).toBe(404);
    });

    it('should allow admin to restore a soft-deleted post', async () => {
      // Soft-delete first
      await request(app)
        .delete(`/api/v1/posts/${createdPost._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      // Regular user tries to restore -> 403
      const userRestoreRes = await request(app)
        .patch(`/api/v1/posts/${createdPost._id}/restore`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(userRestoreRes.status).toBe(403);

      // Admin restores -> 200
      const adminRestoreRes = await request(app)
        .patch(`/api/v1/posts/${createdPost._id}/restore`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(adminRestoreRes.status).toBe(200);
      expect(adminRestoreRes.body.data.post.isDeleted).toBe(false);

      // Verify visible again in public query
      const listRes = await request(app).get('/api/v1/posts');
      expect(listRes.body.data.posts.length).toBe(1);
    });
  });
});
