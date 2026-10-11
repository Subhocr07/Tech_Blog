import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { recordActivity } from '../middleware/activityLogger.js';
import { updateUserSchema } from '../validators/user.validator.js';

const router = Router();

router.use(authenticate, authorize('admin'));

router.get('/', UserController.getUsers);
router.get('/:id', UserController.getUserById);

router.patch(
  '/:id',
  validate(updateUserSchema),
  recordActivity('ADMIN_UPDATE_USER'),
  UserController.updateUser
);

router.delete(
  '/:id',
  recordActivity('ADMIN_DELETE_USER'),
  UserController.deleteUser
);

export default router;
