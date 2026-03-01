import { z } from "zod";

export const adminLoginSchema = z.object({
  passcode: z.string().min(1),
});

export const createUserSchema = z.object({
  displayName: z.string().min(2).max(50),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/),
  defaultCity: z.string().min(2).max(60).optional(),
  timezone: z.string().min(2).max(60).optional(),
  spotifyEnabled: z.boolean().optional(),
});

export const updateUserSchema = z.object({
  displayName: z.string().min(2).max(50).optional(),
  defaultCity: z.string().min(2).max(60).optional(),
  timezone: z.string().min(2).max(60).optional(),
  spotifyEnabled: z.boolean().optional(),
});

export const updateWorkoutSourceSchema = z.object({
  sourceType: z.enum(["google_sheet", "template"]),
  publishUrl: z.string().url().nullable().optional(),
  editUrl: z.string().url().nullable().optional(),
  goal: z.string().nullable().optional(),
  split: z.string().nullable().optional(),
  templateId: z.string().nullable().optional(),
});

export const createCalendarEventSchema = z.object({
  title: z.string().min(2).max(120),
  eventDate: z.string().datetime(),
  notes: z.string().max(500).nullable().optional(),
});

export const updateCalendarEventStatusSchema = z.object({
  eventId: z.string().uuid(),
  status: z.enum(["planned", "done"]),
});
