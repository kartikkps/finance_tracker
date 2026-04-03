// Extend Express Request to include authenticated user
// This file must be referenced in tsconfig "files" to take effect

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
