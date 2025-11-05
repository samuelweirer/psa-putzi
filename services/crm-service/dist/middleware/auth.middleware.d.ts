/**
 * Authentication middleware
 *
 * This middleware validates JWT tokens and extracts user context.
 * In production, the API Gateway will forward user context in headers.
 */
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
export declare function authenticate(req: AuthRequest, _res: Response, next: NextFunction): void;
/**
 * Optional authentication - does not fail if no token
 */
export declare function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction): void;
//# sourceMappingURL=auth.middleware.d.ts.map