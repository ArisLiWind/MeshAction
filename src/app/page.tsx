"use client";

import dynamic from "next/dynamic";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { LandingPage } from "@/components/landing-page";

const AgentConsole = dynamic(
  () => import("@/components/console/agent-console").then((m) => m.AgentConsole),
  { ssr: false }
);

export default function Home() {
  const account = useCurrentAccount();
  if (account) return <AgentConsole />;
  return <LandingPage />;
}
