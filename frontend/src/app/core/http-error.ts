import { HttpErrorResponse } from '@angular/common/http';
import { ApiError } from './models/user.model';

/** Turn an HttpErrorResponse into a message that is safe to show the user. */
export function describeHttpError(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) return 'Cannot reach the server. Is the API running?';
    const body = err.error as Partial<ApiError> | null;
    if (body?.error) return body.error;
  }
  return 'Something went wrong. Please try again.';
}
