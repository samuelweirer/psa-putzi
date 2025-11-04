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
): void {
  // Log error
  logger.error('Error handler caught error', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
  });

  // Handle operational errors (AppError)
  if (error instanceof AppError && error.isOperational) {
    res.status(error.statusCode).json({
      error: error.code,
      message: error.message,
    });
    return;
  }

  // Handle validation errors (Joi)
  if (error.name === 'ValidationError') {
    res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: error.message,
    });
    return;
  }

  // Handle unexpected errors
  logger.error('Unexpected error', {
    error: error.message,
    stack: error.stack,
  });

  res.status(500).json({
    error: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred',
  });
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: 'NOT_FOUND',
    message: `Route ${req.method} ${req.path} not found`,
  });
}

/**
 * Validation middleware wrapper
 */
export function validate(schema: any) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const messages = error.details.map((detail: any) => detail.message).join('; ');
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: messages,
        details: error.details,
      });
      return;
    }

    next();
  };
}
