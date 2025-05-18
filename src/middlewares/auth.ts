// src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from "express";
import passport from "passport";
import { ErrorResponse } from "../utils/error-response";

// Protect routes
interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        role: string;
        [key: string]: any;
    };
}

export const protect = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {

passport.authenticate("jwt", { session: false }, (err: any, user: any) => {
    if (err) {
        return next(
            new ErrorResponse("Not authorized to access this route", 401)
        );
    }

    if (!user) {
        return next(
            new ErrorResponse("Not authorized to access this route", 401)
        );
    }

    // Add user to request object
    (req as AuthenticatedRequest).user = user;
    next();
})(req, res, next);
};

// Grant access to specific roles
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      return next(new ErrorResponse("User not found in request", 500));
    }

    if (!roles.includes(user.role)) {
      return next(
        new ErrorResponse(
          `User role '${(req as AuthenticatedRequest).user?.role}' is not authorized to access this route`,
          403
        )
      );
    }

    next();
  };
};
