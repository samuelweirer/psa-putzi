/**
 * Custom error classes for auth service
 */

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, code = 'BAD_REQUEST') {
    super(message, 400, code);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string, code = 'UNAUTHORIZED') {
    super(message, 401, code);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string, code = 'FORBIDDEN') {
    super(message, 403, code);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, code = 'NOT_FOUND') {
    super(message, 404, code);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, code = 'CONFLICT') {
    super(message, 409, code);
  }
}

export class PreconditionRequiredError extends AppError {
  constructor(message: string, code = 'PRECONDITION_REQUIRED') {
    super(message, 428, code);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message: string, code = 'TOO_MANY_REQUESTS') {
    super(message, 429, code);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string, code = 'INTERNAL_SERVER_ERROR') {
    super(message, 500, code);
  }
}
