import type { EnvMap } from "./production-env";

export function demoSeedEnabled(env: EnvMap = process.env) {
  const legacyDemoFlag = env.NDL_SEED_DEMO === "true";
  const enabled = env.ENABLE_DEMO_SEED === "true";

  if (legacyDemoFlag && !enabled) {
    throw new Error(
      "ENABLE_DEMO_SEED=true is required for demo seeding. NDL_SEED_DEMO is deprecated and no longer enables demo data.",
    );
  }

  return enabled;
}

export function demoSeedResetEnabled(env: EnvMap = process.env) {
  return env.NDL_SEED_RESET === "true";
}
