import { User } from '../models/User.js';
import { Post } from '../models/Post.js';
import { Comment } from '../models/Comment.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { ApiError } from '../utils/ApiError.js';

export class AdminService {
  static async getDashboardStats() {
    const [
      totalUsers,
      totalPosts,
      activePosts,
      deletedPosts,
      totalComments,
      recentActivity,
      recentUsers,
    ] = await Promise.all([
      User.countDocuments(),
      Post.countDocuments(),
      Post.countDocuments({ isDeleted: false }),
      Post.countDocuments({ isDeleted: true }),
      Comment.countDocuments({ isDeleted: false }),
      ActivityLog.find().sort({ createdAt: -1 }).limit(10).populate('user', 'name email avatar').lean(),
      User.find().sort({ createdAt: -1 }).limit(5).select('-refreshToken').lean(),
    ]);

    return {
      stats: {
        totalUsers,
        totalPosts,
        activePosts,
        deletedPosts,
        totalComments,
      },
      recentActivity,
      recentUsers,
    };
  }

  static async getUsers({ page = 1, limit = 10, search = '', role = '' }) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const query = {};

    if (role && ['user', 'admin'].includes(role)) {
      query.role = role;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: searchRegex }, { email: searchRegex }];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .select('-refreshToken')
        .lean(),
      User.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    return {
      users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    };
  }

  static async getUserById(userId) {
    const user = await User.findById(userId).select('-refreshToken');
    if (!user) {
      throw ApiError.notFound('User not found', 'USER_NOT_FOUND');
    }
    return user;
  }

  static async updateUser(userId, { name, role, isActive, avatar }) {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found', 'USER_NOT_FOUND');
    }

    if (name !== undefined) user.name = name.trim();
    if (avatar !== undefined) user.avatar = avatar;
    if (role !== undefined && ['user', 'admin'].includes(role)) user.role = role;
    if (isActive !== undefined) user.isActive = Boolean(isActive);

    await user.save();
    return user.toJSON();
  }

  static async deleteUser(userId, currentAdminId) {
    if (userId === currentAdminId) {
      throw ApiError.badRequest('Admins cannot delete their own account', 'CANNOT_DELETE_SELF');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found', 'USER_NOT_FOUND');
    }

    await User.findByIdAndDelete(userId);
    await Post.updateMany({ author: userId }, { isDeleted: true, deletedAt: new Date() });

    return { message: 'User deleted successfully' };
  }

  static async getAdminPosts({ page = 1, limit = 10, search = '', status = 'all', sortBy = 'last_created', startDate = null, endDate = null, datePreset = '' }) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const query = {};

    if (status === 'deleted') {
      query.isDeleted = true;
    } else if (status === 'active') {
      query.isDeleted = false;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ title: searchRegex }, { content: searchRegex }];
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        if (!isNaN(start.getTime())) {
          start.setHours(0, 0, 0, 0);
          query.createdAt.$gte = start;
        }
      }
      if (endDate) {
        const end = new Date(endDate);
        if (!isNaN(end.getTime())) {
          end.setHours(23, 59, 59, 999);
          query.createdAt.$lte = end;
        }
      }
    } else if (datePreset) {
      const now = new Date();
      if (datePreset === 'today') {
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        query.createdAt = { $gte: start };
      } else if (datePreset === 'week') {
        const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        query.createdAt = { $gte: start };
      } else if (datePreset === 'month') {
        const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        query.createdAt = { $gte: start };
      } else if (datePreset === 'year') {
        const start = new Date(now.getFullYear(), 0, 1);
        query.createdAt = { $gte: start };
      }
    }

    let sortOptions = { createdAt: -1 };
    let useCollation = false;

    switch (sortBy) {
      case 'first_created':
      case 'oldest':
        sortOptions = { createdAt: 1 };
        break;
      case 'a_z':
      case 'title_asc':
        sortOptions = { title: 1 };
        useCollation = true;
        break;
      case 'z_a':
      case 'title_desc':
        sortOptions = { title: -1 };
        useCollation = true;
        break;
      case 'last_created':
      case 'newest':
      default:
        sortOptions = { createdAt: -1 };
        break;
    }

    let cursor = Post.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .populate('author', 'name email avatar role')
      .lean();

    if (useCollation) {
      cursor = cursor.collation({ locale: 'en', strength: 2 });
    }

    const [posts, total] = await Promise.all([
      cursor,
      Post.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    return {
      posts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    };
  }

  static async getAdminComments({ page = 1, limit = 15, search = '' }) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 15));
    const skip = (pageNum - 1) * limitNum;

    const query = { isDeleted: false };
    if (search && search.trim()) {
      query.content = new RegExp(search.trim(), 'i');
    }

    const [comments, total] = await Promise.all([
      Comment.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('author', 'name email avatar')
        .populate('post', 'title slug')
        .lean(),
      Comment.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    return {
      comments,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    };
  }

  static async getActivityLogs({ page = 1, limit = 20, action = '' }) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const query = {};
    if (action) {
      query.action = action;
    }

    const [logs, total] = await Promise.all([
      ActivityLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('user', 'name email avatar')
        .lean(),
      ActivityLog.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    return {
      logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    };
  }
}
