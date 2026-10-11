import { AdminService } from '../services/admin.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export class UserController {
  static async getUsers(req, res, next) {
    try {
      const { page, limit, search, role } = req.query;
      const { users, pagination } = await AdminService.getUsers({
        page,
        limit,
        search,
        role,
      });

      return ApiResponse.success(res, 'Users fetched successfully', { users }, pagination);
    } catch (error) {
      next(error);
    }
  }

  static async getUserById(req, res, next) {
    try {
      const { id } = req.params;
      const user = await AdminService.getUserById(id);

      return ApiResponse.success(res, 'User fetched successfully', { user });
    } catch (error) {
      next(error);
    }
  }

  static async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const updatedUser = await AdminService.updateUser(id, req.body);

      return ApiResponse.success(res, 'User updated successfully', { user: updatedUser });
    } catch (error) {
      next(error);
    }
  }

  static async deleteUser(req, res, next) {
    try {
      const { id } = req.params;
      await AdminService.deleteUser(id, req.user.id);

      return ApiResponse.success(res, 'User deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}
