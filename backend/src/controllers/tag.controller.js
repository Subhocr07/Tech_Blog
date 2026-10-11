import { Tag } from '../models/Tag.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';

const INITIAL_DEFAULT_TAGS = ['nodejs', 'react', 'mongodb', 'security', 'docker', 'architecture'];

export class TagController {
  static async getTags(req, res, next) {
    try {
      let tags = await Tag.find().sort({ name: 1 });

      if (tags.length === 0) {
        const seedDocs = INITIAL_DEFAULT_TAGS.map((name) => ({ name }));
        await Tag.insertMany(seedDocs, { ordered: false }).catch(() => {});
        tags = await Tag.find().sort({ name: 1 });
      }

      return ApiResponse.success(res, 'Tags fetched successfully', { tags });
    } catch (error) {
      next(error);
    }
  }

  static async createTag(req, res, next) {
    try {
      const { name } = req.body;
      if (!name || typeof name !== 'string') {
        throw ApiError.badRequest('Tag name is required', 'TAG_NAME_REQUIRED');
      }

      const formattedName = name.trim().toLowerCase().replace(/\s+/g, '-');
      if (!/^[a-z0-9-]+$/.test(formattedName)) {
        throw ApiError.badRequest('Tag name can only contain lowercase letters, numbers, and hyphens', 'INVALID_TAG_FORMAT');
      }

      const existingTag = await Tag.findOne({ name: formattedName });
      if (existingTag) {
        throw ApiError.conflict(`Tag "${formattedName}" already exists`, 'TAG_ALREADY_EXISTS');
      }

      const tag = new Tag({ name: formattedName });
      await tag.save();

      return ApiResponse.created(res, 'Tag created successfully', { tag });
    } catch (error) {
      next(error);
    }
  }

  static async deleteTag(req, res, next) {
    try {
      const { id } = req.params;
      const tag = await Tag.findByIdAndDelete(id);

      if (!tag) {
        throw ApiError.notFound('Tag not found', 'TAG_NOT_FOUND');
      }

      return ApiResponse.success(res, `Tag "${tag.name}" deleted successfully`, { tag });
    } catch (error) {
      next(error);
    }
  }
}
