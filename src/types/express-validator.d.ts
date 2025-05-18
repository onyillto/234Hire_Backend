// src/types/express-validator.d.ts
declare module "express-validator" {
  import { Request, Response, NextFunction } from "express";

  export interface ValidationChain {
    run(req: Request): Promise<any>;

    // String validation methods
    isString(): ValidationChain;
    trim(): ValidationChain;
    isLength(options: { min?: number; max?: number }): ValidationChain;
    isEmpty(): ValidationChain;
    notEmpty(): ValidationChain;
    isEmail(): ValidationChain;
    normalizeEmail(): ValidationChain;
    isIn(values: any[]): ValidationChain;
    matches(pattern: RegExp | string): ValidationChain;

    // Number validation methods
    isNumeric(): ValidationChain;
    isInt(): ValidationChain;
    isFloat(): ValidationChain;

    // Boolean validation methods
    isBoolean(): ValidationChain;

    // Object validation methods
    isObject(): ValidationChain;
    isArray(): ValidationChain;
    isMongoId(): ValidationChain;

    // Existence checks
    exists(options?: {
      checkNull?: boolean;
      checkFalsy?: boolean;
    }): ValidationChain;

    // Conditional validation
    if(
      condition:
        | ValidationChain
        | ((
            value: any,
            {
              req,
              path,
              location,
            }: { req: Request; path: string; location: string }
          ) => boolean)
    ): ValidationChain;

    // Custom validation
    custom(
      validator: (
        value: any,
        {
          req,
          location,
          path,
        }: { req: Request; location: string; path: string }
      ) => any
    ): ValidationChain;

    // Message
    withMessage(message: string): ValidationChain;

    // Optional flag
    optional(options?: {
      nullable?: boolean;
      checkFalsy?: boolean;
    }): ValidationChain;
  }

  export function body(field: string): ValidationChain;
  export function param(field: string): ValidationChain;
  export function query(field: string): ValidationChain;
  export function validationResult(req: Request): {
    isEmpty(): boolean;
    array(): Array<{
      msg: string;
      param?: string;
      location?: string;
      value?: any;
      [key: string]: any;
    }>;
  };
}
