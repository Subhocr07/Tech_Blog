import slugify from 'slugify';

export const createBaseSlug = (text) => {
  if (!text) return `post-${Date.now()}`;
  return slugify(text, {
    lower: true,
    strict: true,
    trim: true,
  }) || `post-${Date.now()}`;
};

export const generateUniqueSlug = async (model, title, excludeId = null) => {
  const baseSlug = createBaseSlug(title);
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const query = { slug };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const existing = await model.findOne(query).select('_id').lean();
    if (!existing) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }
};
