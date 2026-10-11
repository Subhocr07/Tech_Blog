import { Router } from 'express';
import { TagController } from '../controllers/tag.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { recordActivity } from '../middleware/activityLogger.js';

const router = Router();

router.get('/', TagController.getTags);

router.post(
  '/',
  authenticate,
  authorize('admin'),
  recordActivity('TAG_CREATE'),
  TagController.createTag
);

router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  recordActivity('TAG_DELETE'),
  TagController.deleteTag
);

export default router;
