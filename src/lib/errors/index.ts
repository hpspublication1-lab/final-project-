/**
 * Standardized Application Error Classes
 * Strongly typed HTTP & domain errors for clean, uniform error handling.
 */

export abstract class AppError extends Error {
  abstract readonly statusCode: number;
  abstract readonly errorCode: string;

  constructor(message: string, public readonly details?: Record<string, any>) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }

  toJSON() {
    return {
      error: {
        code: this.errorCode,
        message: this.message,
        details: this.details,
      },
    };
  }
}

export class UnauthorizedError extends AppError {
  readonly statusCode = 401;
  readonly errorCode = 'UNAUTHORIZED';
  constructor(message = 'Authentication required') {
    super(message);
  }
}

export class ForbiddenError extends AppError {
  readonly statusCode = 403;
  readonly errorCode = 'FORBIDDEN';
  constructor(message = 'You do not have permission to perform this action') {
    super(message);
  }
}

export class NotFoundError extends AppError {
  readonly statusCode = 404;
  readonly errorCode = 'NOT_FOUND';
  constructor(resource = 'Resource', id?: string) {
    super(id ? `${resource} with ID ${id} not found` : `${resource} not found`);
  }
}

export class ValidationError extends AppError {
  readonly statusCode = 422;
  readonly errorCode = 'VALIDATION_FAILED';
  constructor(message = 'Invalid request parameters', details?: Record<string, any>) {
    super(message, details);
  }
}

export class PaymentRequiredError extends AppError {
  readonly statusCode = 402;
  readonly errorCode = 'PAYMENT_REQUIRED';
  constructor(message = 'Active batch subscription or payment required to access this resource') {
    super(message);
  }
}

export class ConflictError extends AppError {
  readonly statusCode = 409;
  readonly errorCode = 'CONFLICT';
  constructor(message = 'The requested operation conflicts with an existing resource') {
    super(message);
  }
}

export class RateLimitError extends AppError {
  readonly statusCode = 429;
  readonly errorCode = 'RATE_LIMIT_EXCEEDED';
  constructor(message = 'Too many requests. Please try again in a few moments.') {
    super(message);
  }
}
