import { z } from "zod";

export const joinPartySchema = z.object({
  code: z.string().min(6, "Invalid party code").max(6, "Invalid party code"),
});
