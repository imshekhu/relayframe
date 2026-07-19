import "server-only";

import { Queue, Worker, type Job } from "bullmq";
import IORedis from "ioredis";
import { generationRequestSchema } from "@/domain/schemas";
import { resolveModel } from "@/providers/registry";

export const GENERATION_QUEUE = "relayframe-generation-v1";

export function createGenerationQueue(redisUrl: string) {
  const connection = new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
  });
  return {
    connection,
    queue: new Queue(GENERATION_QUEUE, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 2_000 },
        removeOnComplete: { age: 86_400, count: 10_000 },
        removeOnFail: { age: 604_800, count: 20_000 },
      },
    }),
  };
}

export function createGenerationWorker(
  redisUrl: string,
  onProgress?: (generationId: string, progress: number) => Promise<void>,
) {
  const connection = new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
  });
  return new Worker(
    GENERATION_QUEUE,
    async (job: Job) => {
      const generationId = String(job.data.generationId);
      const request = generationRequestSchema.parse(job.data.request);
      const resolved = resolveModel(request.modelId);
      if (!resolved) throw new Error("Model route unavailable");
      const canonical = {
        generationId,
        modelId: resolved.capability.id,
        operation: request.operation,
        prompt: request.prompt,
        aspectRatio: request.aspectRatio,
        outputCount: request.outputCount,
        inputAssetUrls: [],
        maxCostCredits: Number(job.data.reservedCredits),
      };
      resolved.provider.validate(canonical);
      await onProgress?.(generationId, 20);
      const providerJob = await resolved.provider.submit(
        canonical,
        `${generationId}:provider-submit:v1`,
      );
      let latest = providerJob;
      const deadline = Date.now() + 10 * 60_000;
      while (!["succeeded", "failed", "cancelled"].includes(latest.state)) {
        if (Date.now() >= deadline) {
          await resolved.provider.cancel(providerJob.providerJobId);
          throw new Error("Provider generation deadline exceeded");
        }
        await new Promise((resolve) => setTimeout(resolve, 1_000));
        latest = await resolved.provider.status(providerJob.providerJobId);
        await onProgress?.(generationId, latest.progress);
      }
      if (latest.state !== "succeeded") {
        throw new Error(latest.errorCode ?? "Provider generation failed");
      }
      if (
        latest.actualCostCredits !== undefined &&
        latest.actualCostCredits > canonical.maxCostCredits
      ) {
        throw new Error("Provider cost exceeded authorized reservation");
      }
      return latest;
    },
    {
      connection,
      concurrency: Number(process.env.GENERATION_WORKER_CONCURRENCY ?? 2),
      limiter: {
        max: Number(process.env.GENERATION_RATE_LIMIT ?? 30),
        duration: 60_000,
      },
    },
  );
}
