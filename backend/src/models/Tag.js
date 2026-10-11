import mongoose from 'mongoose';

const tagSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tag name is required'],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [2, 'Tag name must be at least 2 characters long'],
      maxlength: [30, 'Tag name cannot exceed 30 characters'],
      match: [
        /^[a-z0-9-]+$/,
        'Tag name can only contain lowercase letters, numbers, and hyphens',
      ],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const Tag = mongoose.model('Tag', tagSchema);
