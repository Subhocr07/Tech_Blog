import request from 'supertest';
import app from '../app.js';
import { User } from '../models/User.js';
import { Comment } from '../models/Comment.js';

describe('Comments Integration Tests', () => {
  let postAuthorToken;
  let postAuthorId;
  let commenterToken;
  let commenterId;
  let bystanderToken;
  let adminToken;
  let post;

  beforeEach(async () => {
    // 1. Post author
    const authorRes = await request(app).post('/api/v1/auth/register').send({
      name: 'Post Author',
      email: 'postauthor@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
    });
    postAuthorToken = authorRes.body.data.accessToken;
    postAuthorId = authorRes.body.data.user._id || authorRes.body.data.user.id;

    // 2. Commenter
    const commenterRes = await request(app).post('/api/v1/auth/register').send({
      name: 'Active Commenter',
      email: 'commenter@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
    });
    commenterToken = commenterRes.body.data.accessToken;
    commenterId = commenterRes.body.data.user._id || commenterRes.body.data.user.id;

    // 3. Bystander regular user
    const bystanderRes = await request(app).post('/api/v1/auth/register').send({
      name: 'Bystander User',
      email: 'bystander@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
    });
    bystanderToken = bystanderRes.body.data.accessToken;

    // 4. Admin
    const adminUser = new User({
      name: 'System Admin',
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

    // 5. Create a test post
    const postRes = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${postAuthorToken}`)
      .send({
        title: 'Article open for discussion',
        content: 'Please leave your comments below regarding clean architecture.',
      });
    post = postRes.body.data.post;
  });

  describe('POST /api/v1/posts/:postId/comments', () => {
    it('should add a comment to a post when authenticated', async () => {
      const res = await request(app)
        .post(`/api/v1/posts/${post._id}/comments`)
        .set('Authorization', `Bearer ${commenterToken}`)
        .send({
          content: 'Excellent article! The explanation of services vs controllers is very clear.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.comment).toBeDefined();
      expect(res.body.data.comment.content).toBe('Excellent article! The explanation of services vs controllers is very clear.');
      expect(res.body.data.comment.post.toString()).toBe(post._id.toString());
      expect(res.body.data.comment.author.email).toBe('commenter@example.com');
      expect(res.body.data.comment.isDeleted).toBe(false);
    });

    it('should reject unauthenticated comment submission', async () => {
      const res = await request(app)
        .post(`/api/v1/posts/${post._id}/comments`)
        .send({ content: 'Anonymous comment attempt' });

      expect(res.status).toBe(401);
    });

    it('should reject comment with empty or too long content (422)', async () => {
      const res = await request(app)
        .post(`/api/v1/posts/${post._id}/comments`)
        .set('Authorization', `Bearer ${commenterToken}`)
        .send({ content: '' });

      expect(res.status).toBe(422);
    });
  });

  describe('GET /api/v1/posts/:postId/comments', () => {
    it('should retrieve list of comments for a post', async () => {
      await request(app)
        .post(`/api/v1/posts/${post._id}/comments`)
        .set('Authorization', `Bearer ${commenterToken}`)
        .send({ content: 'First comment' });

      await request(app)
        .post(`/api/v1/posts/${post._id}/comments`)
        .set('Authorization', `Bearer ${postAuthorToken}`)
        .send({ content: 'Author reply' });

      const res = await request(app).get(`/api/v1/posts/${post._id}/comments`);

      expect(res.status).toBe(200);
      expect(res.body.data.comments.length).toBe(2);
      expect(res.body.meta.total).toBe(2);
    });
  });

  describe('Comment Modification & Deletion RBAC', () => {
    let comment;

    beforeEach(async () => {
      const res = await request(app)
        .post(`/api/v1/posts/${post._id}/comments`)
        .set('Authorization', `Bearer ${commenterToken}`)
        .send({ content: 'Original comment text' });
      comment = res.body.data.comment;
    });

    it('should allow author to update their own comment', async () => {
      const res = await request(app)
        .patch(`/api/v1/comments/${comment._id}`)
        .set('Authorization', `Bearer ${commenterToken}`)
        .send({ content: 'Updated comment text by author' });

      expect(res.status).toBe(200);
      expect(res.body.data.comment.content).toBe('Updated comment text by author');
    });

    it('should reject another regular user from updating the comment (403 Forbidden)', async () => {
      const res = await request(app)
        .patch(`/api/v1/comments/${comment._id}`)
        .set('Authorization', `Bearer ${bystanderToken}`)
        .send({ content: 'Malicious update' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('UNAUTHORIZED_COMMENT_EDIT');
    });

    it('should allow comment author to delete their own comment', async () => {
      const res = await request(app)
        .delete(`/api/v1/comments/${comment._id}`)
        .set('Authorization', `Bearer ${commenterToken}`);

      expect(res.status).toBe(200);

      const dbComment = await Comment.findById(comment._id);
      expect(dbComment.isDeleted).toBe(true);

      // Verify not returned in public comments list
      const listRes = await request(app).get(`/api/v1/posts/${post._id}/comments`);
      expect(listRes.body.data.comments.length).toBe(0);
    });

    it('should reject an unrelated bystander from deleting the comment (403 Forbidden)', async () => {
      const res = await request(app)
        .delete(`/api/v1/comments/${comment._id}`)
        .set('Authorization', `Bearer ${bystanderToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('UNAUTHORIZED_COMMENT_DELETE');
    });

    it('should allow the post author to delete any comment on their post', async () => {
      const res = await request(app)
        .delete(`/api/v1/comments/${comment._id}`)
        .set('Authorization', `Bearer ${postAuthorToken}`);

      expect(res.status).toBe(200);
    });

    it('should allow platform admin to delete any comment', async () => {
      const res = await request(app)
        .delete(`/api/v1/comments/${comment._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });
  });
});
