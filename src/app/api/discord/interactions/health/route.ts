import { discordInteractionsHealthResponse } from "../route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return discordInteractionsHealthResponse();
}
