import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import { User } from '@shared/schema';
import bcrypt from 'bcrypt';

// Extend Express Request to include user and session
declare global {
  namespace Express {
    interface Request {
      user?: User;
      sessionId?: string;
    }
  }
}

export class AuthService {
  private static SALT_ROUNDS = 12;

  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static async authenticateUser(email: string, password: string): Promise<User | null> {
    const user = await storage.getUserByEmail(email);
    if (!user || !user.isActive) {
      return null;
    }

    const isValid = await this.verifyPassword(password, user.passwordHash);
    return isValid ? user : null;
  }

  static async createSession(userId: string): Promise<string> {
    // Create session that expires in 7 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const session = await storage.createSession({
      userId,
      expiresAt
    });

    return session.id;
  }

  static async validateSession(sessionId: string): Promise<User | null> {
    const session = await storage.getSession(sessionId);
    if (!session) {
      return null;
    }

    const user = await storage.getUser(session.userId);
    if (!user || !user.isActive) {
      // Clean up invalid session
      await storage.deleteSession(sessionId);
      return null;
    }

    return user;
  }

  static async logout(sessionId: string): Promise<boolean> {
    return storage.deleteSession(sessionId);
  }
}

// Middleware to check if user is authenticated
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const sessionId = req.headers.authorization?.replace('Bearer ', '') || 
                   req.cookies?.sessionId;

  if (!sessionId) {
    if (process.env.NODE_ENV === 'development') {
      console.log('Auth middleware - No session ID found');
    }
    return res.status(401).json({ error: 'Authentication required' });
  }

  const user = await AuthService.validateSession(sessionId);
  if (!user) {
    if (process.env.NODE_ENV === 'development') {
      console.log('Auth middleware - Session validation failed');
    }
    return res.status(401).json({ error: 'Invalid or expired session' });
  }

  req.user = user;
  req.sessionId = sessionId;
  next();
};

// Middleware to check if user has specific role
export const requireRole = (allowedRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Access denied', 
        message: `This action requires one of the following roles: ${allowedRoles.join(', ')}` 
      });
    }

    next();
  };
};

// Convenience middlewares for specific roles
export const requireParent = requireRole(['parent']);
export const requireDriver = requireRole(['driver']);
export const requireParentOrDriver = requireRole(['parent', 'driver']);

// Middleware to ensure parents can only access their own data
export const requireParentDataAccess = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role !== 'parent') {
    return res.status(403).json({ error: 'Parent access required' });
  }

  // Add parent ID to request for data filtering
  req.parentId = req.user.id;
  next();
};

// Middleware to ensure drivers can only access their assigned routes
export const requireDriverDataAccess = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role !== 'driver') {
    return res.status(403).json({ error: 'Driver access required' });
  }

  // Add driver ID to request for data filtering
  req.driverId = req.user.id;
  next();
};

// Extend Request interface to include role-specific IDs
declare global {
  namespace Express {
    interface Request {
      parentId?: string;
      driverId?: string;
    }
  }
}