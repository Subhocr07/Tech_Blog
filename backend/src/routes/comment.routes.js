import { Router } from 'express';
import { CommentController } from '../controllers/comment.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { recordActivity } from '../middleware/activityLogger.js';
import { updateCommentSchema } from '../validators/comment.validator.js';

const router = Router();

router.patch(
  '/:id',
  authenticate,
  validate(updateCommentSchema),
  recordActivity('COMMENT_UPDATE'),
  CommentController.updateComment
);

router.delete(
  '/:id',
  authenticate,
  recordActivity('COMMENT_DELETE'),
  CommentController.deleteComment
);

export default router;
