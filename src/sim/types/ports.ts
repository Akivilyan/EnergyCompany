export interface RngPort {
  nextInt(minInclusive: number, maxInclusive: number): number;
}

export interface ClockPort {
  nowUnixMs(): number;
}

export interface LoggerPort {
  info(msg: string, extra?: Record<string, unknown>): void;
  warn(msg: string, extra?: Record<string, unknown>): void;
  error(msg: string, extra?: Record<string, unknown>): void;
}

export interface SimPorts {
  rng: RngPort;
  clock: ClockPort;
  logger: LoggerPort;
}

export const defaultPorts: SimPorts = {
  rng: {
    nextInt(min, max) {
      return min + Math.floor(Math.random() * (max - min + 1));
    }
  },
  clock: { nowUnixMs: () => Date.now() },
  logger: {
    info: () => {},
    warn: () => {},
    error: () => {}
  }
};
