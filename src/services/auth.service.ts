import bcrypt from "bcryptjs";
import type { User } from "@prisma/client";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ForbiddenError } from "@/lib/errors";
import { HttpError } from "@/utils/httpError";
import { signToken } from "@/utils/jwt";

export type SafeUser = Omit<User, "password">;

function toSafeUser(user: User): SafeUser {
  const { password: _p, ...rest } = user;
  return rest;
}

export async function adminLogin(
  email: string,
  password: string
): Promise<{ user: SafeUser; token: string }> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (!user?.password) {
    throw new HttpError(401, "Invalid credentials");
  }
  if (user.role !== Role.ADMIN) {
    throw new ForbiddenError("Admin access only");
  }
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    throw new HttpError(401, "Invalid credentials");
  }
  const token = signToken({
    id: user.id,
    role: user.role,
    email: user.email,
  });
  return { user: toSafeUser(user), token };
}
