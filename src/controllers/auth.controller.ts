import type { Request, Response } from "express";
import * as authService from "@/services/auth.service";
import { success } from "@/utils/apiResponse";

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as { email: string; password: string };
  const result = await authService.adminLogin(email, password);
  success(res, result);
}
