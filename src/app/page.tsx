"use client";

import { useCurrentAccount } from "@mysten/dapp-kit";
import { LandingPage } from "@/components/landing-page";
import { AgentConsole } from "@/components/console/agent-console";

export default function Home() {
  const account = useCurrentAccount();
  if (account) {
    return <AgentConsole />;
  }
  return <LandingPage />;
}
