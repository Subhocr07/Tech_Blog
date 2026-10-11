import { CommentService } from '../services/comment.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { getSocketIO } from '../config/socket.js';

export class CommentController {
  static async addComment(req, res, next) {
    try {
      const { postId } = req.params;
      const { content } = req.body;

      const { comment, postAuthorId, postTitle } = await CommentService.addComment({
        postId,
        authorId: req.user.id,
        content,
      });

      try {
        const io = getSocketIO();
        if (io) {
          io.to(`user:${postAuthorId}`).emit('notification:comment', {
            message: `${req.user.name} commented on your post "${postTitle}"`,
            postId,
            commentId: comment._id,
            author: {
              id: req.user.id,
              name: req.user.name,
              avatar: req.user.avatar,
            },
            createdAt: comment.createdAt,
          });

          io.emit(`post:${postId}:comment`, { comment });
        }
      } catch (socketErr) {}

      return ApiResponse.created(res, 'Comment posted successfully', { comment });
    } catch (error) {
      next(error);
    }
  }

  static async getCommentsByPost(req, res, next) {
    try {
      const { postId } = req.params;
      const { page, limit } = req.query;

      const { comments, pagination } = await CommentService.getCommentsByPost({
        postId,
        page,
        limit,
      });

      return ApiResponse.success(res, 'Comments fetched successfully', { comments }, pagination);
    } catch (error) {
      next(error);
    }
  }

  static async updateComment(req, res, next) {
    try {
      const { id } = req.params;
      const { content } = req.body;

      const comment = await CommentService.updateComment(id, content, req.user);

      return ApiResponse.success(res, 'Comment updated successfully', { comment });
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
}
