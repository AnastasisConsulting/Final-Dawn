// /packages/sentient-core/tools/sentientCoreTools.ts

/* ============================================================================
   Sentient Core – Tool Definitions (TypeScript)
   - Mirrors the JSON/YAML tool surface exactly
   - Strongly typed, deterministic, auditable
   - No side effects here: execution handled elsewhere
============================================================================ */

export type Tag = string;

export type Axis = "x" | "y" | "z" | "xy" | "xz" | "yz" | "free";

export type EmoteMode =
  | "curious"
  | "excited"
  | "calm"
  | "alert"
  | "playful"
  | "hostile";

export type FocusTarget = "player" | "object" | "memory" | "event";
export type IgnoreTarget = "player" | "object" | "stimulus";

export type IncreaseDecrease = "increase" | "decrease";

export type SaveKind = "animation" | "state";

export type ListFormat = "table" | "json";
export type MatchMode = "best" | "exact" | "all_matches";

export type DumpWhat = "knobs" | "motion";
export type TraceWhat = "motion" | "last" | "chain";

/* ============================================================================
   Base Tool Envelope
============================================================================ */

export interface ToolCall<TParams = unknown> {
  name: string;
  params: TParams;
}

/* ============================================================================
   Player-Tier Tools
============================================================================ */

export interface AwakenParams {
  actions: ("focus" | "alert")[];
}

export interface RestParams {
  actions: ("idle" | "decay")[];
}

export interface PauseParams {
  actions: ("freeze" | "hold")[];
}

export interface ResumeParams {}

export interface FocusParams {
  target: FocusTarget;
}

export interface IgnoreParams {
  target: IgnoreTarget;
}

export interface EmoteParams {
  mode: EmoteMode;
}

export interface CuriosityParams {
  action: IncreaseDecrease;
}

export interface DisciplineParams {
  action: IncreaseDecrease;
}

export interface ApproachParams {
  target: "player" | "object";
}

export interface RetreatParams {
  target: "player" | "object";
}

export interface OrbitParams {
  target: "player" | "object";
  axis: Axis;
}

export interface TagParams {
  tags: Tag[];
}

export interface SaveParams {
  kind: SaveKind;
  tags?: Tag[];
}

export interface RecallParams {
  tags: Tag[];
  top_k?: number;
}

/* ============================================================================
   Developer-Tier Tools
============================================================================ */

export interface StopParams {}

export interface StepParams {
  frames: number;
}

export interface NewMotionParams {
  tags: Tag[];
}

export interface SnapshotParams {
  tags: Tag[];
}

export interface ReplaceParams {
  tags: Tag[];
}

export interface ApplyParams {
  tags: Tag[];
  match?: "best" | "exact";
}

export interface ListParams {
  tags?: Tag[];
  format?: ListFormat;
  top_k?: number;
}

export interface AcceptParams {
  tags?: Tag[];
}

export interface RejectParams {}

export interface QuarantineParams {
  tags?: Tag[];
}

export interface ReplaceLastParams {
  tags: Tag[];
}

export interface DeleteParams {
  tags: Tag[];
  mode?: MatchMode;
}

export interface CloneParams {
  source_tags: Tag[];
  new_tags?: Tag[];
}

export interface RetagParams {
  old_tags: Tag[];
  new_tags: Tag[];
  mode?: MatchMode;
}

export interface LockKnobParams {
  knob_id: string;
}

export interface UnlockKnobParams {
  knob_id: string;
}

export interface ClampParams {
  knob_id: string;
  min: number;
  max: number;
}

export interface ZeroParams {
  knob_id: string;
}

export interface DumpParams {
  what: DumpWhat;
  format?: "json" | "text";
}

export interface TraceParams {
  what: TraceWhat;
  depth?: number;
}

export interface PanicParams {}

export interface ResetDevParams {}

export interface ResetParams {
  prompt: string;
  confirmation: {
    ack: boolean;
    token?: string;
  };
}

/* ============================================================================
   Tool Name → Params Mapping
============================================================================ */

export interface SentientCoreToolMap {
  sc_awaken: AwakenParams;
  sc_rest: RestParams;
  sc_pause: PauseParams;
  sc_resume: ResumeParams;
  sc_focus: FocusParams;
  sc_ignore: IgnoreParams;
  sc_emote: EmoteParams;
  sc_curiosity: CuriosityParams;
  sc_discipline: DisciplineParams;
  sc_approach: ApproachParams;
  sc_retreat: RetreatParams;
  sc_orbit: OrbitParams;
  sc_tag: TagParams;
  sc_save: SaveParams;
  sc_recall: RecallParams;

  sc_stop: StopParams;
  sc_step: StepParams;
  sc_new: NewMotionParams;
  sc_snapshot: SnapshotParams;
  sc_replace: ReplaceParams;
  sc_apply: ApplyParams;
  sc_list: ListParams;
  sc_accept: AcceptParams;
  sc_reject: RejectParams;
  sc_quarantine: QuarantineParams;
  sc_replace_last: ReplaceLastParams;
  sc_delete: DeleteParams;
  sc_clone: CloneParams;
  sc_retag: RetagParams;
  sc_lock_knob: LockKnobParams;
  sc_unlock_knob: UnlockKnobParams;
  sc_clamp: ClampParams;
  sc_zero: ZeroParams;
  sc_dump: DumpParams;
  sc_trace: TraceParams;
  sc_panic: PanicParams;
  sc_reset_dev: ResetDevParams;
  sc_reset: ResetParams;
}

/* ============================================================================
   Typed ToolCall Helper
============================================================================ */

export type SentientCoreToolCall<
  T extends keyof SentientCoreToolMap = keyof SentientCoreToolMap
> = ToolCall<SentientCoreToolMap[T]> & {
  name: T;
};

/* ============================================================================
   Example (for reference, not execution)
============================================================================ */
/*
const call: SentientCoreToolCall<"sc_replace"> = {
  name: "sc_replace",
  params: {
    tags: ["alert", "disciplined", "combat-ready"]
  }
};
*/
