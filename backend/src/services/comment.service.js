import { Comment } from '../models/Comment.js';
import { Post } from '../models/Post.js';
import { ApiError } from '../utils/ApiError.js';

export class CommentService {
  static async addComment({ postId, authorId, content }) {
    const post = await Post.findOne({ _id: postId, isDeleted: false });
    if (!post) {
      throw ApiError.notFound('Blog post not found or has been deleted', 'POST_NOT_FOUND');
    }

    const comment = new Comment({
      post: postId,
      author: authorId,
      content: content.trim(),
    });

    await comment.save();

    const populated = await comment.populate('author', 'name email avatar role');

    return {
      comment: populated,
      postAuthorId: post.author.toString(),
      postTitle: post.title,
    };
  }

  static async getCommentsByPost({ postId, page = 1, limit = 20 }) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const query = {
      post: postId,
      isDeleted: false,
    };

    const [comments, total] = await Promise.all([
      Comment.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('author', 'name email avatar role')
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

  static async updateComment(commentId, content, currentUser) {
    const comment = await Comment.findById(commentId);
    if (!comment || comment.isDeleted) {
      throw ApiError.notFound('Comment not found', 'COMMENT_NOT_FOUND');
    }

    const isOwner = comment.author.toString() === currentUser.id;
    const isAdmin = currentUser.role === 'admin';

    if (!isOwner && !isAdmin) {
      throw ApiError.forbidden('You are not authorized to edit this comment', 'UNAUTHORIZED_COMMENT_EDIT');
    }

    comment.content = content.trim();
    await comment.save();

    return comment.populate('author', 'name email avatar role');
  }

  static async deleteComment(commentId, currentUser) {
    const comment = await Comment.findById(commentId);
    if (!comment) {
      throw ApiError.notFound('Comment not found', 'COMMENT_NOT_FOUND');
    }

    const isCommentOwner = comment.author.toString() === currentUser.id;
    const isAdmin = currentUser.role === 'admin';

    const post = await Post.findById(comment.post);
    const isPostOwner = post && post.author.toString() === currentUser.id;

    if (!isCommentOwner && !isAdmin && !isPostOwner) {
      throw ApiError.forbidden('You are not authorized to delete this comment', 'UNAUTHORIZED_COMMENT_DELETE');
    }

    comment.isDeleted = true;
    comment.deletedAt = new Date();
    await comment.save();

    return comment;
  }
}
