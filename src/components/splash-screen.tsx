"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useConnectWallet, useCurrentAccount } from "@mysten/dapp-kit";
import { cn } from "@/lib/utils";

interface SplashScreenProps {
  onStart: () => void;
}

export function SplashScreen({ onStart }: SplashScreenProps) {
  const [ready, setReady] = useState(false);
  const { mutate: connect } = useConnectWallet();
  const account = useCurrentAccount();

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 60);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (account) onStart();
  }, [account, onStart]);

  const handleConnect = useCallback(() => {
    connect();
  }, [connect]);

  const handleExplore = useCallback(() => {
    onStart();
  }, [onStart]);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#020617] flex flex-col">
      {/* Animated background blobs — pure CSS flowing gradient */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-[10%] -left-[10%] h-[70vw] w-[70vw] rounded-full bg-blue-600/40 blur-[120px] animate-blob"
          aria-hidden="true"
        />
        <div
          className="absolute top-[10%] -right-[10%] h-[60vw] w-[60vw] rounded-full bg-cyan-400/30 blur-[100px] animate-blob animate-blob-delay-1"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-[10%] left-[10%] h-[80vw] w-[80vw] rounded-full bg-indigo-800/40 blur-[140px] animate-blob animate-blob-delay-2"
          aria-hidden="true"
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[40vw] w-[40vw] rounded-full bg-blue-400/20 blur-[90px] animate-blob animate-blob-delay-3"
          aria-hidden="true"
        />
        {/* subtle center glow */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 30%, rgba(59,130,246,0.25), transparent 70%)",
          }}
          aria-hidden="true"
        />
      </div>

      {/* Top nav */}
      <nav className="relative z-20 flex items-center h-14 px-6 bg-black/60 backdrop-blur-md border-b border-white/5">
        <Image
          src="/images/logo-text.jpg"
          alt="MeshAction"
          width={180}
          height={36}
          className="h-7 w-auto object-contain"
          priority
        />
      </nav>

      {/* Main content */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 text-center">
        {/* App Icon */}
        <div
          className={cn(
            "mb-7 transition-all duration-1000 ease-out",
            ready ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
        >
          <Image
            src="/images/logo-icon.png"
            alt="MeshAction"
            width={128}
            height={128}
            className="h-28 w-28 rounded-[22%] shadow-2xl shadow-blue-900/30"
            priority
          />
        </div>

        {/* Title */}
        <h1
          className={cn(
            "text-white text-5xl md:text-6xl font-bold tracking-tight mb-3 transition-all duration-1000 ease-out",
            ready ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
          style={{ transitionDelay: "150ms" }}
        >
          MeshAction
        </h1>

        {/* Subtitle */}
        <p
          className={cn(
            "text-blue-100/80 text-lg md:text-xl max-w-2xl mb-10 leading-relaxed transition-all duration-1000 ease-out",
            ready ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
          style={{ transitionDelay: "300ms" }}
        >
          Build and Execute Trusted On-Chain Actions with AI Agents
        </p>

        {/* Action Buttons */}
        <div
          className={cn(
            "flex flex-wrap items-center justify-center gap-4 mb-16 transition-all duration-1000 ease-out",
            ready ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
          style={{ transitionDelay: "450ms" }}
        >
          <button
            onClick={handleConnect}
            className="relative px-8 py-3.5 rounded-2xl bg-[#0a0e1a] text-white font-medium border border-white/10 hover:border-white/25 hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg shadow-black/40"
          >
            Connect Wallet
          </button>

          <button
            onClick={handleExplore}
            className="relative px-8 py-3.5 rounded-2xl bg-blue-500/20 text-white font-medium border border-white/20 backdrop-blur-xl hover:bg-blue-500/30 hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg shadow-blue-900/20"
          >
            Explore Trading
          </button>
        </div>

        {/* Footer note */}
        <p
          className={cn(
            "text-slate-400/60 text-sm transition-all duration-1000 ease-out",
            ready ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
          style={{ transitionDelay: "600ms" }}
        >
          For trading, transfers, and AI-powered execution.
        </p>
      </main>
    </div>
  );
}
