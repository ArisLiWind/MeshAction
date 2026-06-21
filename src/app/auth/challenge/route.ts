import { assertSameOrigin, createWalletChallenge } from "@/lib/auth";
import { jsonError } from "@/lib/api-errors";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const body = (await request.json().catch(() => ({}))) as {
      wallet_address?: string;
    };
    if (!body.wallet_address?.trim()) {
      return Response.json({ error: "wallet_address is required" }, { status: 400 });
    }
    return Response.json(await createWalletChallenge(body.wallet_address.trim()), {
      status: 201,
    });
  } catch (error) {
    return jsonError(error, "auth challenge failed");
  }
}
