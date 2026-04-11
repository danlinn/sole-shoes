import { z } from "zod";

export const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  city: z.string().optional(),
});

export const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  city: z.string().optional(),
  preferredContact: z.string().optional(),
});

export const shoePostSchema = z.object({
  type: z.enum(["LOST", "FOUND"]),
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  description: z.string().min(10, "Description must be at least 10 characters").max(2000),
  brand: z.string().min(1, "Brand is required"),
  model: z.string().optional(),
  category: z.enum([
    "SNEAKER", "BOOT", "SANDAL", "HEEL", "LOAFER",
    "DRESS_SHOE", "ATHLETIC", "SLIPPER", "OTHER",
  ]),
  size: z.string().min(1, "Size is required"),
  primaryColor: z.string().min(1, "Primary color is required"),
  secondaryColor: z.string().optional(),
  side: z.enum(["LEFT", "RIGHT"]),
  genderCategory: z.string().optional(),
  condition: z.enum(["NEW", "LIKE_NEW", "GOOD", "FAIR", "WORN"]),
  locationText: z.string().min(1, "Location is required"),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  dateOccurred: z.string().min(1, "Date is required"),
  reward: z.string().optional(),
});

export const matchRequestSchema = z.object({
  shoePostId: z.string().min(1),
  message: z.string().min(5, "Message must be at least 5 characters").max(1000),
});

export const messageSchema = z.object({
  conversationId: z.string().min(1),
  body: z.string().min(1, "Message cannot be empty").max(2000),
});

export const reportSchema = z.object({
  shoePostId: z.string().optional(),
  reportedUserId: z.string().optional(),
  reason: z.string().min(5, "Please provide a reason").max(500),
  details: z.string().max(2000).optional(),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type ShoePostInput = z.infer<typeof shoePostSchema>;
export type MatchRequestInput = z.infer<typeof matchRequestSchema>;
export type MessageInput = z.infer<typeof messageSchema>;
export type ReportInput = z.infer<typeof reportSchema>;
