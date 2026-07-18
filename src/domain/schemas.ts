import { z } from "zod";

export const organizationIdSchema = z
  .string()
  .regex(/^org_[a-zA-Z0-9_-]+$/);

export const generationRequestSchema = z.object({
  projectId: z.string().regex(/^prj_[a-zA-Z0-9_-]+$/).optional(),
  operation: z.enum([
    "text_to_image",
    "image_to_image",
    "text_to_video",
    "image_to_video",
  ]),
  prompt: z.string().trim().min(8).max(4000),
  modelId: z.string().min(1).max(100),
  aspectRatio: z.enum(["1:1", "4:5", "9:16", "16:9"]),
  outputCount: z.number().int().min(1).max(4),
  idempotencyKey: z.string().min(8).max(120),
});

export const brandPackSchema = z.object({
  name: z.string().trim().min(2).max(120),
  website: z.string().url().or(z.literal("")),
  description: z.string().trim().min(20).max(2000),
  colors: z.array(z.string().regex(/^#[0-9a-fA-F]{6}$/)).min(1).max(8),
  tone: z.array(z.string().min(2).max(50)).max(12),
  audiences: z.array(z.string().min(3).max(240)).min(1).max(12),
  approvedClaims: z.array(z.string().min(3).max(300)).max(30),
  prohibitedClaims: z.array(z.string().min(3).max(300)).max(30),
  requiredDisclaimers: z.array(z.string().min(3).max(500)).max(20),
});

export const creativeBriefSchema = z.object({
  product: z.string().trim().min(2).max(200),
  campaignObjective: z.string().trim().min(10).max(1000),
  audience: z.string().trim().min(5).max(500),
  offer: z.string().trim().min(2).max(500),
  emotion: z.string().trim().min(2).max(100),
  placement: z.string().trim().min(2).max(100),
  constraints: z.array(z.string().min(2).max(300)).max(30),
});

export type GenerationRequest = z.infer<typeof generationRequestSchema>;
