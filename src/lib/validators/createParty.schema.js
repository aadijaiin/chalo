import { z } from "zod";

export const createPartySchema = z.object({
  name: z.string().min(3, "Party name is too short."),
  duration: z.enum(["1h", "2h", "4h", "8h", "1d", "3d"]),
});
