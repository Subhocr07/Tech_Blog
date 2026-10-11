import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { recordActivity } from '../middleware/activityLogger.js';

const router = Router();

router.use(authenticate, authorize('admin'));

router.get('/stats', AdminController.getStats);
router.get('/posts', AdminController.getPosts);
router.get('/comments', AdminController.getComments);
router.delete(
  '/comments/:id',
  recordActivity('ADMIN_DELETE_COMMENT'),
  AdminController.deleteComment
);
router.get('/activity-logs', AdminController.getActivityLogs);

export default router;
