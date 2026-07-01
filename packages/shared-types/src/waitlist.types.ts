import { z } from "zod";

export const joinWaitlistSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  phone: z.string().min(7, "Phone must be at least 7 digits"),
  countryCode: z.string().min(1, "Country code is required"),
  country: z.string().min(1, "Country is required"),
  chessLevel: z.enum(["casual", "club", "competitive"]),
  referredBy: z.string().email("Invalid referrer email").optional().or(z.literal("")),
});

export type JoinWaitlistDTO = z.infer<typeof joinWaitlistSchema>;
