"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ConnectModal } from "@mysten/dapp-kit";
import { cn } from "@/lib/utils";

export function LandingPage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 60);
    return () => clearTimeout(t);
  }, []);

  const videoFallback = {
    background: "linear-gradient(135deg, #0f172a, #1e3a8a, #06b6d4)",
  };

  return (
    <div className="relative min-h-screen bg-black text-white overflow-x-hidden">
      {/* Navbar (sticky top) */}
      <nav className="sticky top-0 z-50 flex items-center h-16 px-6 md:px-10 bg-black border-b border-white/5">
        <Image
          src="/images/logo-text.png"
          alt="MeshAction"
          width={180}
          height={36}
          className="h-7 w-auto object-contain"
          priority
        />
        <div className="ml-auto flex items-center"></div>
      </nav>

      {/* ===== Page 1: Hero ===== */}
      <section className="relative -mt-16 pt-16 min-h-screen flex flex-col overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0"
          style={videoFallback}
        >
          <source src="/videos/hero-bg.mp4" type="video/mp4" />
        </video>

        {/* bottom fade to black */}
        <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-b from-transparent to-black z-10 pointer-events-none" />

        {/* Hero content */}
        <div className="relative z-20 flex-1 flex flex-col items-center px-4 pt-8">
          <div className="flex-1 flex flex-col items-center justify-center gap-5 w-full max-w-4xl">
            <div className={cn("mb-1 transition-all duration-1000", ready ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>
              <Image
                src="/images/logo-icon.png"
                alt="MeshAction"
                width={80}
                height={80}
                className="h-16 w-16 md:h-20 md:w-20 rounded-[22%] shadow-2xl"
                priority
              />
            </div>

            <h1
              className={cn(
                "text-4xl md:text-5xl font-medium tracking-tight transition-all duration-1000 delay-100",
                ready ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              )}
            >
              MeshAction
            </h1>

            <p
              className={cn(
                "text-blue-100/90 text-base md:text-lg max-w-2xl text-center leading-relaxed transition-all duration-1000 delay-200",
                ready ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              )}
            >
              Build and Execute Trusted On-Chain Actions with AI Agents
            </p>

            <div
              className={cn(
                "flex flex-wrap items-center justify-center gap-4 mt-1 transition-all duration-1000 delay-300",
                ready ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              )}
            >
              <ConnectModal
                trigger={
                  <button className="relative group inline-flex items-center justify-center px-10 py-3.5 rounded-2xl bg-white text-blue-600 font-semibold text-sm hover:bg-slate-100 active:scale-95 transition-all duration-200 shadow-xl">
                    <span className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ padding: '2px', WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)', WebkitMaskComposite: 'xor', mask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)', maskComposite: 'exclude' } as any}>
                      <span className="absolute top-1/2 left-1/2 w-[300px] h-[300px]" style={{ background: 'conic-gradient(from 0deg, transparent, #0098F5, #6800FF, transparent 20%)', animation: 'spin-center 4s linear infinite', transform: 'translate(-50%, -50%)' }} />
                    </span>
                    <span className="relative z-10">Connect Wallet</span>
                  </button>
                }
              />
              <button className="glow-btn px-10 py-3.5 text-sm font-semibold">
                <span className="glow-mask"><span className="glow-ring" /></span>
                <span className="btn-label">Explore Trading</span>
              </button>
            </div>
          </div>

          <p className="mt-6 mb-10 text-slate-400/60 text-sm">For trading, transfers, and AI-powered execution.</p>
        </div>
      </section>

      {/* ===== Transition: Console + Promo ===== */}
      <section className="relative flex flex-col items-center justify-center px-4 py-16 bg-gradient-to-b from-[#0a0f1a] via-[#05080f] to-black">
        {/* macOS Window Mockup (shrunk) */}
        <div className="w-full max-w-[900px] rounded-2xl overflow-hidden border border-slate-600/20 shadow-[0_0_60px_rgba(59,130,246,0.08)] bg-[#0f172a]">
          <div className="h-10 flex items-center gap-2 px-5 border-b border-slate-600/20 bg-[#0f172a]">
            <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
            <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
            <span className="w-3 h-3 rounded-full bg-[#28c840]" />
          </div>
          <img src="/images/console-preview.png" alt="MeshAction Console" className="w-full h-auto block" />
        </div>

        {/* Promo Banner */}
        <div className="mt-8 w-full max-w-[960px] flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-md px-5 py-3.5">
          <span className="text-lg leading-none">🎁</span>
          <p className="text-sm text-slate-200 flex-1 text-left">
            Get up to $500 usage credits when you start using MeshAction before July 31st.
          </p>
          <button className="shrink-0 px-5 py-2 rounded-lg bg-white text-slate-900 text-sm font-semibold hover:bg-slate-100 transition-colors">
            Claim Offer
          </button>
        </div>
      </section>

      {/* ===== Page 3: Bottom CTA ===== */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0"
          style={videoFallback}
        >
          <source src="/videos/hero-bg.mp4" type="video/mp4" />
        </video>

        {/* top fade from black */}
        <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-black to-transparent z-10 pointer-events-none" />
        {/* bottom fade to black (for footer transition) */}
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-b from-transparent to-black z-10 pointer-events-none" />

        <div className="relative z-20 max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-medium tracking-tight mb-4">Get Started with MeshAction</h2>
          <p className="text-blue-100/80 mb-10 text-base md:text-lg">Build and Execute Trusted On-Chain Actions with AI Agents</p>
          <ConnectModal
            trigger={
              <button className="px-10 py-3.5 rounded-2xl bg-white text-blue-600 font-bold text-sm hover:bg-slate-100 active:scale-95 transition-all duration-200">
                Connect Wallet
              </button>
            }
          />
        </div>
      </section>

      {/* ===== Footer (two-row layout per reference) ===== */}
      <footer className="bg-black border-t border-white/5 px-6 md:px-10 py-5">
        <div className="max-w-6xl mx-auto">
          {/* Top row */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">@SuiMesh</span>
            <div className="flex items-center gap-4 text-slate-400">
              <a href="https://t.me/+DnUuxS5PeW8wYzVl" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161l-1.96 9.21c-.146.657-.537.818-1.084.508l-2.998-2.209-1.445 1.39c-.16.16-.296.296-.606.296l.213-3.053 5.56-5.023c.242-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.643-.204-.657-.643.134-.953l11.565-4.462c.538-.196 1.006.121.847.924z"/></svg>
              </a>
              <a href="https://discord.gg/eBkXGq45" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
              </a>
              <a href="https://x.com/suimesh?s=11" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
            </div>
          </div>
          {/* Bottom row: signature on its own line, right-aligned */}
          <div className="flex justify-end mt-3">
            <img src="/images/mori-aris.png" alt="Mori & Aris" className="h-5 w-auto opacity-90" />
          </div>
        </div>
      </footer>
    </div>
  );
}
