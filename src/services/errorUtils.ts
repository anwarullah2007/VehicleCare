export type AppErrorKind =
  | 'VALIDATION'
  | 'AUTHENTICATION'
  | 'AUTHORIZATION'
  | 'NOT_FOUND'
  | 'NETWORK'
  | 'UNKNOWN';

export interface AppError {
  kind: AppErrorKind;
  message: string;
}

export type ServiceResult<T> =
  | { data: T; error: null }
  | { data: null; error: AppError };

interface SupabaseLikeError {
  message?: string;
  code?: string;
  status?: number;
}

export function normalizeSupabaseError(
  err: unknown,
  fallbackMessage = 'An unexpected error occurred. Please try again.',
): AppError {
  if (!err || typeof err !== 'object') {
    return { kind: 'UNKNOWN', message: fallbackMessage };
  }

  const { message = '', code = '', status } = err as SupabaseLikeError;
  const lower = message.toLowerCase();

  if (code === '23505' || lower.includes('duplicate key')) {
    return {
      kind: 'VALIDATION',
      message: 'A record with this unique value already exists.',
    };
  }

  if (code === '23514' || code === '23502' || lower.includes('violates check')) {
    return {
      kind: 'VALIDATION',
      message: 'One or more fields contain invalid values.',
    };
  }

  if (code === '42501' || status === 403 || lower.includes('row-level security')) {
    return {
      kind: 'AUTHORIZATION',
      message: 'You do not have permission to perform this action.',
    };
  }

  if (
    status === 401 ||
    lower.includes('invalid login credentials') ||
    lower.includes('jwt') ||
    lower.includes('session')
  ) {
    return {
      kind: 'AUTHENTICATION',
      message: message || 'Authentication required. Please sign in again.',
    };
  }

  if (code === 'PGRST116' || status === 404) {
    return {
      kind: 'NOT_FOUND',
      message: 'The requested record could not be found.',
    };
  }

  if (lower.includes('fetch') || lower.includes('network')) {
    return {
      kind: 'NETWORK',
      message: 'Network error. Please check your connection and try again.',
    };
  }

  return {
    kind: 'UNKNOWN',
    message: message || fallbackMessage,
  };
}
