import {
  assertSameOrigin,
  createSessionFromChallenge,
  currentAuthUser,
  setAuthCookie,
} from "@/lib/auth";
import { jsonError } from "@/lib/api-errors";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await currentAuthUser();
    return Response.json({ authenticated: Boolean(user), user });
  } catch (error) {
    return jsonError(error, "auth session unavailable");
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const body = (await request.json().catch(() => ({}))) as {
      challenge_id?: string;
      signature?: string;
    };
    if (!body.challenge_id?.trim() || !body.signature?.trim()) {
      return Response.json(
        { error: "challenge_id and signature are required" },
        { status: 400 }
      );
    }
    const session = await createSessionFromChallenge({
      challengeId: body.challenge_id.trim(),
      signature: body.signature.trim(),
    });
    await setAuthCookie(session.cookie);
    return Response.json({
      authenticated: true,
      user: session.user,
    });
  } catch (error) {
    return jsonError(error, "wallet sign-in failed");
  }
}
