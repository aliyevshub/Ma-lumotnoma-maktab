// To'lov usulini tanlash: PAYMENT_PROVIDER = manual (hozir) | payme | stars (keyin)
import * as manual from "./manual.js";

const PROVIDERS = { manual };

export function provider(env) {
  return PROVIDERS[env.PAYMENT_PROVIDER || "manual"] || manual;
}

export { adminIds } from "./manual.js";
