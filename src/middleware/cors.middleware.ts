import type { CorsOptions } from "cors";
import { isOriginAllowed } from "@/lib/corsOrigins";

export const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (isOriginAllowed(origin)) {
      callback(null, origin ?? true);
      return;
    }
    callback(null, false);
  },
  credentials: true,
};
