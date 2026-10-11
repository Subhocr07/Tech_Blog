import { PostService } from '../services/post.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { getSocketIO } from '../config/socket.js';

export class PostController {
  static async createPost(req, res, next) {
    try {
      const { title, content, coverImage, tags, readTime } = req.body;
      const post = await PostService.createPost({
        title,
        content,
        coverImage,
        tags,
        readTime,
        authorId: req.user.id,
      });

      try {
        const io = getSocketIO();
        if (io) {
          io.emit('post:created', {
            id: post._id,
            title: post.title,
            slug: post.slug,
            author: {
              id: post.author._id,
              name: post.author.name,
              avatar: post.author.avatar,
            },
            createdAt: post.createdAt,
          });
        }
      } catch (socketErr) {}

      return ApiResponse.created(res, 'Post created successfully', { post });
    } catch (error) {
      next(error);
    }
  }

  static async getPosts(req, res, next) {
    try {
      const { page, limit, search, tag, author, sortBy, startDate, endDate, datePreset } = req.query;
      const { posts, pagination } = await PostService.getPosts({
        page,
        limit,
        search,
        tag,
        author,
        sortBy,
        startDate,
        endDate,
        datePreset,
        includeDeleted: false,
      });

      return ApiResponse.success(res, 'Posts fetched successfully', { posts }, pagination);
    } catch (error) {
      next(error);
    }
  }

  static async getPostById(req, res, next) {
    try {
      const { id } = req.params;
      const isAdmin = req.user?.role === 'admin';
      const post = await PostService.getPostById(id, isAdmin);

      return ApiResponse.success(res, 'Post fetched successfully', { post });
    } catch (error) {
      next(error);
    }
  }

  static async getPostBySlug(req, res, next) {
    try {
      const { slug } = req.params;
      const isAdmin = req.user?.role === 'admin';
      const post = await PostService.getPostBySlug(slug, isAdmin);

      return ApiResponse.success(res, 'Post fetched successfully', { post });
    } catch (error) {
      next(error);
    }
  }

  static async updatePost(req, res, next) {
    try {
      const { id } = req.params;
      const post = await PostService.updatePost(id, req.body, req.user);

      return ApiResponse.success(res, 'Post updated successfully', { post });
    } catch (error) {
      next(error);
    }
  }

  static async deletePost(req, res, next) {
    try {
      const { id } = req.params;
      await PostService.softDeletePost(id, req.user);

      return ApiResponse.success(res, 'Post deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  static async restorePost(req, res, next) {
    try {
      const { id } = req.params;
      const post = await PostService.restorePost(id);

      return ApiResponse.success(res, 'Post restored successfully', { post });
    } catch (error) {
      next(error);
    }
  }
}
