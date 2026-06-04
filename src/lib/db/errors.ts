/**
 * Repository-layer error helpers.
 *
 * Repositories never throw raw PostgrestError objects. They throw our own
 * `RepositoryError` subclasses so callers can branch on meaning, not on
 * opaque error codes.
 */

export class RepositoryError extends Error {
  public readonly cause: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.cause = cause;
  }
}

export class NotFoundError extends RepositoryError {
  constructor(entity: string, id: string) {
    super(`${entity} not found: ${id}`);
  }
}

export class UniqueViolationError extends RepositoryError {
  public readonly entity: string;
  public readonly constraint: string | null;

  constructor(entity: string, constraint: string | null, cause?: unknown) {
    super(
      constraint
        ? `Unique violation on ${entity}.${constraint}`
        : `Unique violation on ${entity}`,
      cause,
    );
    this.entity = entity;
    this.constraint = constraint;
  }
}

export class ForeignKeyViolationError extends RepositoryError {
  public readonly entity: string;
  public readonly constraint: string | null;

  constructor(entity: string, constraint: string | null, cause?: unknown) {
    super(
      constraint
        ? `Foreign key violation on ${entity}.${constraint}`
        : `Foreign key violation on ${entity}`,
      cause,
    );
    this.entity = entity;
    this.constraint = constraint;
  }
}

export class CheckViolationError extends RepositoryError {
  public readonly entity: string;
  public readonly constraint: string | null;

  constructor(entity: string, constraint: string | null, cause?: unknown) {
    super(
      constraint
        ? `Check violation on ${entity}.${constraint}`
        : `Check violation on ${entity}`,
      cause,
    );
    this.entity = entity;
    this.constraint = constraint;
  }
}

/**
 * Translate a PostgREST error into a typed RepositoryError when possible.
 * Falls back to a plain RepositoryError for everything else.
 */
export function translateError(
  entity: string,
  error: { code?: string; message: string; details?: string | null },
): RepositoryError {
  switch (error.code) {
    case "23505": // unique_violation
      return new UniqueViolationError(entity, error.details ?? null, error);
    case "23503": // foreign_key_violation
      return new ForeignKeyViolationError(entity, error.details ?? null, error);
    case "23514": // check_violation
      return new CheckViolationError(entity, error.details ?? null, error);
    default:
      return new RepositoryError(
        `${entity} operation failed: ${error.message}`,
        error,
      );
  }
}
