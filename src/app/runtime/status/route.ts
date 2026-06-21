import { getSuiRuntimeStatus } from "@/lib/sui-executor";

export const runtime = "nodejs";

export async function GET() {
  return Response.json({ runtime: getSuiRuntimeStatus() });
}
