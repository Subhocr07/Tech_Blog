import { AdminService } from '../services/admin.service.js';
import { CommentService } from '../services/comment.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export class AdminController {
  static async getStats(req, res, next) {
    try {
      const data = await AdminService.getDashboardStats();
      return ApiResponse.success(res, 'Dashboard statistics fetched successfully', data);
    } catch (error) {
      next(error);
    }
  }

  static async getPosts(req, res, next) {
    try {
      const { page, limit, search, status, sortBy, startDate, endDate, datePreset } = req.query;
      const { posts, pagination } = await AdminService.getAdminPosts({
        page,
        limit,
        search,
        status,
        sortBy,
        startDate,
        endDate,
        datePreset,
      });

      return ApiResponse.success(res, 'Admin posts fetched successfully', { posts }, pagination);
    } catch (error) {
      next(error);
    }
  }

  static async getComments(req, res, next) {
    try {
      const { page, limit, search } = req.query;
      const { comments, pagination } = await AdminService.getAdminComments({
        page,
        limit,
        search,
      });

      return ApiResponse.success(res, 'Admin comments fetched successfully', { comments }, pagination);
    } catch (error) {
      next(error);
    }
  }

  static async deleteComment(req, res, next) {
    try {
      const { id } = req.params;
      await CommentService.deleteComment(id, req.user);

      return ApiResponse.success(res, 'Comment deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getActivityLogs(req, res, next) {
    try {
      const { page, limit, action } = req.query;
      const { logs, pagination } = await AdminService.getActivityLogs({
        page,
        limit,
        action,
      });

      return ApiResponse.success(res, 'Activity logs fetched successfully', { logs }, pagination);
    } catch (error) {
      next(error);
    }
  }
}
