// src/utils/error-response.ts
export class ErrorResponse extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;

    // Set prototype explicitly
    Object.setPrototypeOf(this, ErrorResponse.prototype);
  }
}
