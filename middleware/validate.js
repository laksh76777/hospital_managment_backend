import { z } from 'zod';

/**
 * Express middleware for request body validation using Zod
 * @param {z.ZodSchema} schema - Zod schema to validate req.body against
 */
export const validate = (schema) => {
  return async (req, res, next) => {
    try {
      const parsed = await schema.parseAsync(req.body);
      req.body = parsed;
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        const formattedErrors = err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));

        const fieldErrors = {};
        formattedErrors.forEach((e) => {
          const key = e.field || '_general';
          if (!fieldErrors[key]) {
            fieldErrors[key] = e.message;
          }
        });

        const errorMessage = formattedErrors.map((e) => `${e.field ? e.field + ': ' : ''}${e.message}`).join('; ');

        return res.status(400).json({
          success: false,
          message: errorMessage || 'Request validation failed',
          errors: formattedErrors,
          fieldErrors,
        });
      }
      next(err);
    }
  };
};

export default validate;
