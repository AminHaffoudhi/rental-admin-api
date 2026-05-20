export {};

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      user?: { id: string; role: "ADMIN"; email: string };
    }
    interface Response {
      requestId: string;
    }
  }
}
