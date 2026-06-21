import { getSuiRuntimeStatus } from "@/lib/sui-executor";
import { getSuiMeshProtocolStatus } from "@/lib/suimesh-canonical";

export const runtime = "nodejs";

export async function GET() {
  return Response.json({
    runtime: getSuiRuntimeStatus(),
    protocol: await getSuiMeshProtocolStatus(),
  });
}
