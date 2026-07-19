import type {
  Asset,
  Generation,
  LedgerEntry,
  Project,
} from "@/domain/types";

export interface GenerationRepository {
  findById(
    organizationId: string,
    generationId: string,
  ): Promise<Generation | null>;
  findByIdempotencyKey(
    organizationId: string,
    key: string,
  ): Promise<(Generation & { requestHash: string }) | null>;
  insert(generation: Generation & { requestHash: string }): Promise<void>;
  transition(input: {
    organizationId: string;
    generationId: string;
    expectedState: Generation["state"];
    expectedVersion: number;
    nextState: Generation["state"];
    progress: number;
    patch?: Partial<Generation>;
  }): Promise<boolean>;
}

export interface LedgerRepository {
  availableBalance(organizationId: string): Promise<number>;
  reservedForGeneration(
    organizationId: string,
    generationId: string,
  ): Promise<number>;
  append(entry: LedgerEntry): Promise<boolean>;
}

export interface ProjectRepository {
  findById(
    organizationId: string,
    projectId: string,
  ): Promise<Project | null>;
  committedCredits(
    organizationId: string,
    projectId: string,
  ): Promise<number>;
}

export interface AssetRepository {
  insertMany(assets: Asset[]): Promise<void>;
}

export interface OutboxRepository {
  enqueue(input: {
    id: string;
    organizationId: string;
    aggregateType: "generation";
    aggregateId: string;
    eventType: "generation.requested";
    payload: Record<string, unknown>;
    createdAt: string;
  }): Promise<void>;
}

export interface TransactionRepositories {
  generations: GenerationRepository;
  ledger: LedgerRepository;
  projects: ProjectRepository;
  assets: AssetRepository;
  outbox: OutboxRepository;
}

export interface UnitOfWork {
  transaction<T>(
    work: (repositories: TransactionRepositories) => Promise<T>,
  ): Promise<T>;
}
