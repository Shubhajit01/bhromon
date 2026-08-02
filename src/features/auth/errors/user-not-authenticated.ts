export class UserNotAuthenticatedError extends Error {
  name = 'UserNotAuthenticatedError';
  message = 'User not authenticated yet';
}

export function isUserNotAuthenticatedError(
  error: unknown,
): error is UserNotAuthenticatedError {
  return error instanceof UserNotAuthenticatedError;
}
