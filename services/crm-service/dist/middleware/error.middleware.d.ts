/**
 * Error handling middleware
 */
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
export declare function errorHandler(err: Error | AppError, req: Request, res: Response, _next: NextFunction): Response<any, Record<string, any>>;
export declare function notFoundHandler(req: Request, res: Response): Response<any, Record<string, any>>;
/**
 * Validation middleware wrapper for Joi schemas
 */
export declare function validate(schema: any): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=error.middleware.d.ts.map