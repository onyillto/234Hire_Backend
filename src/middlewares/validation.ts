import { Request, Response, NextFunction } from "express";
import { validationResult, ValidationChain } from "express-validator";
import { ErrorResponse } from "../utils/error-response";

export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    console.log("🔍 Validation middleware called");
    console.log("📝 Request body:", req.body);

    // Run all validations
    await Promise.all(validations.map((validation) => validation.run(req)));

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map((error: any) => error.msg);
      console.log("❌ Validation errors:", errorMessages);
      return next(new ErrorResponse(errorMessages[0], 400));
    }

    console.log("✅ Validation passed");
    next();
  };
};
