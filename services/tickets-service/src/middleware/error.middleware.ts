/**
 * Error handling middleware
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  logger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      statusCode: err.statusCode,
    });
  }

  // Unknown error
  return res.status(500).json({
    error: {
      message: 'Internal server error',
      statusCode: 500,
    },
  });
}

export function notFoundHandler(req: Request, res: Response) {
  return res.status(404).json({
    error: {
      message: `Route ${req.method} ${req.path} not found`,
      statusCode: 404,
    },
  });
}

/**
 * Validation middleware wrapper for Joi schemas
 */
export function validate(schema: any) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Validate query params for GET requests, body for others
    const dataToValidate = req.method === 'GET' ? req.query : req.body;

    const { error } = schema.validate(dataToValidate, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const messages = error.details.map((detail: any) => detail.message).join('; ');
      res.status(400).json({
        error: messages,
        details: error.details,
      });
      return;
    }

    next();
  };
}
