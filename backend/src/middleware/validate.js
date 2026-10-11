import { ApiError } from '../utils/ApiError.js';

export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const parsed = schema.safeParse(req[source]);
      if (!parsed.success) {
        const errors = parsed.error.issues.map((issue) => ({
          field: issue.path.join('.') || source,
          message: issue.message,
        }));

        return res.status(422).json({
          success: false,
          message: 'Validation failed',
          errors,
        });
      }

      req[source] = parsed.data;
      next();
    } catch (err) {
      next(err);
    }
  };
};
