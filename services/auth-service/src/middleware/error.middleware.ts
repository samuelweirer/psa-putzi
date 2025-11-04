/**
 * Error handling middleware
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';

/**
 * Global error handler
 */
export function errorHandler(
  error: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  // Log error
  logger.error('Error handler caught error', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
  });

  // Handle operational errors (AppError)
  if (error instanceof AppError && error.isOperational) {
    return res.status(error.statusCode).json({
      error: error.code,
      message: error.message,
    });
  }

  // Handle validation errors (Joi)
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: error.message,
    });
  }

  // Handle unexpected errors
  logger.error('Unexpected error', {
    error: error.message,
    stack: error.stack,
  });

  return res.status(500).json({
    error: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred',
  });
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: 'NOT_FOUND',
    message: `Route ${req.method} ${req.path} not found`,
  });
}

/**
 * Validation middleware wrapper
 */
export function validate(schema: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const messages = error.details.map((detail: any) => detail.message).join('; ');
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: messages,
        details: error.details,
      });
    }

    next();
  };
}
