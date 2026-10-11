import { Router } from 'express';
import { PostController } from '../controllers/post.controller.js';
import { CommentController } from '../controllers/comment.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { recordActivity } from '../middleware/activityLogger.js';
import { createPostSchema, updatePostSchema } from '../validators/post.validator.js';
import { createCommentSchema } from '../validators/comment.validator.js';

const router = Router();

router.get('/', PostController.getPosts);
router.get('/slug/:slug', PostController.getPostBySlug);
router.get('/:id', PostController.getPostById);

router.post(
  '/',
  authenticate,
  validate(createPostSchema),
  recordActivity('POST_CREATE'),
  PostController.createPost
);

router.patch(
  '/:id',
  authenticate,
  validate(updatePostSchema),
  recordActivity('POST_UPDATE'),
  PostController.updatePost
);

router.delete(
  '/:id',
  authenticate,
  recordActivity('POST_DELETE'),
  PostController.deletePost
);

router.patch(
  '/:id/restore',
  authenticate,
  authorize('admin'),
  recordActivity('POST_RESTORE'),
  PostController.restorePost
);

router.post(
  '/:postId/comments',
  authenticate,
  validate(createCommentSchema),
  recordActivity('COMMENT_CREATE'),
  CommentController.addComment
);

router.get('/:postId/comments', CommentController.getCommentsByPost);

export default router;
