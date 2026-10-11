import { Post } from '../models/Post.js';
import { ApiError } from '../utils/ApiError.js';
import { generateUniqueSlug } from '../utils/slug.js';

export class PostService {
  static async createPost({ title, content, coverImage, tags, readTime, authorId }) {
    const slug = await generateUniqueSlug(Post, title);
    const computedReadTime = readTime || Math.max(1, Math.ceil(content.split(/\s+/).length / 200));

    const post = new Post({
      title: title.trim(),
      slug,
      content,
      coverImage: coverImage || '',
      tags: Array.isArray(tags) ? tags.map((t) => t.trim().toLowerCase()).filter(Boolean) : [],
      readTime: computedReadTime,
      author: authorId,
    });

    await post.save();
    return post.populate('author', 'name email avatar role');
  }

  static async getPosts({
    page = 1,
    limit = 10,
    search = '',
    tag = '',
    author = '',
    sortBy = 'last_created',
    startDate = null,
    endDate = null,
    datePreset = '',
    includeDeleted = false,
  }) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const query = {};

    if (!includeDeleted) {
      query.isDeleted = false;
    }

    if (tag) {
      const tagList = Array.isArray(tag)
        ? tag.map((t) => t.toLowerCase().trim()).filter(Boolean)
        : tag
            .split(',')
            .map((t) => t.toLowerCase().trim())
            .filter(Boolean);

      if (tagList.length === 1) {
        query.tags = tagList[0];
      } else if (tagList.length > 1) {
        query.tags = { $in: tagList };
      }
    }

    if (author) {
      query.author = author;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { content: searchRegex },
        { tags: searchRegex },
      ];
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

  static async getPostById(postId, includeDeleted = false) {
    const query = { _id: postId };
    if (!includeDeleted) {
      query.isDeleted = false;
    }

    const post = await Post.findOne(query).populate('author', 'name email avatar role');
    if (!post) {
      throw ApiError.notFound('Post not found', 'POST_NOT_FOUND');
    }

    return post;
  }

  static async getPostBySlug(slug, includeDeleted = false) {
    const query = { slug: slug.toLowerCase() };
    if (!includeDeleted) {
      query.isDeleted = false;
    }

    const post = await Post.findOne(query).populate('author', 'name email avatar role');
    if (!post) {
      throw ApiError.notFound('Post not found', 'POST_NOT_FOUND');
    }

    return post;
  }

  static async updatePost(postId, updates, currentUser) {
    const post = await Post.findById(postId);
    if (!post) {
      throw ApiError.notFound('Post not found', 'POST_NOT_FOUND');
    }

    const isOwner = post.author.toString() === currentUser.id;
    const isAdmin = currentUser.role === 'admin';

    if (!isOwner && !isAdmin) {
      throw ApiError.forbidden('You are not authorized to edit this post', 'UNAUTHORIZED_POST_EDIT');
    }

    if (updates.title && updates.title !== post.title) {
      post.slug = await generateUniqueSlug(Post, updates.title, post._id);
      post.title = updates.title.trim();
    }

    if (updates.content !== undefined) {
      post.content = updates.content;
      post.readTime = Math.max(1, Math.ceil(updates.content.split(/\s+/).length / 200));
    }

    if (updates.coverImage !== undefined) {
      post.coverImage = updates.coverImage;
    }

    if (updates.tags !== undefined) {
      post.tags = Array.isArray(updates.tags)
        ? updates.tags.map((t) => t.trim().toLowerCase()).filter(Boolean)
        : [];
    }

    if (updates.readTime !== undefined) {
      post.readTime = updates.readTime;
    }

    await post.save();
    return post.populate('author', 'name email avatar role');
  }

  static async softDeletePost(postId, currentUser) {
    const post = await Post.findById(postId);
    if (!post) {
      throw ApiError.notFound('Post not found', 'POST_NOT_FOUND');
    }

    const isOwner = post.author.toString() === currentUser.id;
    const isAdmin = currentUser.role === 'admin';

    if (!isOwner && !isAdmin) {
      throw ApiError.forbidden('You are not authorized to delete this post', 'UNAUTHORIZED_POST_DELETE');
    }

    post.isDeleted = true;
    post.deletedAt = new Date();
    await post.save();

    return post;
  }

  static async restorePost(postId) {
    const post = await Post.findById(postId);
    if (!post) {
      throw ApiError.notFound('Post not found', 'POST_NOT_FOUND');
    }

    post.isDeleted = false;
    post.deletedAt = null;
    await post.save();

    return post.populate('author', 'name email avatar role');
  }
}
