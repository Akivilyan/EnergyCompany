export type SimErrorCode =
  | "invalid_phase"
  | "blocked_by_tutorial"
  | "not_unlocked"
  | "insufficient_funds"
  | "not_found"
  | "conflict_in_progress"
  | "invalid_command_payload"
  | "config_missing"
  | "state_invariant_broken";

export interface SimOk<T> {
  ok: true;
  value: T;
}

export interface SimErr {
  ok: false;
  error: SimErrorCode;
  message: string;
  context?: Record<string, string | number | boolean | null>;
}

export type SimResult<T> = SimOk<T> | SimErr;

export function ok<T>(value: T): SimOk<T> {
  return { ok: true, value };
}

export function err(
  error: SimErrorCode,
  message: string,
  context?: SimErr["context"]
): SimErr {
  return { ok: false, error, message, context };
}
