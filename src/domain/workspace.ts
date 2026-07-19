import type {
  Asset,
  AuditEvent,
  Brand,
  CreativeBrief,
  Generation,
  LedgerEntry,
  Organization,
  Project,
  StoryboardFrame,
  TestCard,
} from "./types";

export interface WorkspaceSnapshot {
  snapshotAt: string;
  organization: Organization;
  brands: Brand[];
  projects: Project[];
  briefs: CreativeBrief[];
  testCards: TestCard[];
  storyboardFrames: StoryboardFrame[];
  assets: Asset[];
  generations: Generation[];
  ledger: LedgerEntry[];
  audits: AuditEvent[];
  availableCredits: number;
}
