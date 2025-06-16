// src/auth/interfaces/authenticated-request.interface.ts
import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user: {
    userId: string;  // identity_document del usuario
    email: string;
    roles: string[];
  };
}