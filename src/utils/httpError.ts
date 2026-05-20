import { AppError } from "@/lib/errors";

export class HttpError extends AppError {
  constructor(statusCode: number, message: string, code?: string) {
    super(message, statusCode, code ?? "HTTP_ERROR");
    this.name = "HttpError";
  }
}
