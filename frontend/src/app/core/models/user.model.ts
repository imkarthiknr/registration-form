/** A user as returned by the API. The password hash never leaves the server. */
export interface User {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}

/** Payload sent to `POST /api/users`. */
export interface RegistrationRequest {
  name: string;
  email: string;
  password: string;
}

/** Error body returned by the API for 4xx responses. */
export interface ApiError {
  error: string;
  fields?: Partial<Record<keyof RegistrationRequest, string>>;
}
