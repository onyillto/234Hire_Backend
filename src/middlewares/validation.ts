// src/middleware/validation.middleware.ts
import { Request, Response, NextFunction } from "express";
import * as expressValidator from "express-validator";
const { validationResult } = expressValidator;
import { ErrorResponse } from "../utils/error-response";

// Middleware to validate request based on provided validation chains
export const validate = (validations: expressValidator.ValidationChain[]) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    // Run all validations
    await Promise.all(validations.map((validation) => validation.run(req)));

    // Check for validation errors
    const errors = validationResult(req);

    if (errors.isEmpty()) {
      return next();
    }

    // Format error messages
    const errorMessages = errors.array().map((err) => {
      if ("msg" in err) {
        return `${err.msg}${err.param ? ` (${err.param})` : ""}`;
      }
      return "Invalid value";
    });

    // Return error response
    next(new ErrorResponse(errorMessages.join(", "), 400));
  };
};
