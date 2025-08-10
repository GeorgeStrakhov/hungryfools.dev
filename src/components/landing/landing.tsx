"use client";

import * as React from "react";
import Image from "next/image";
import posthog from 'posthog-js';
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { signIn, useSession } from "next-auth/react";

function Logo() {
  return (
    <div className="flex items-center justify-center mt-12 mb-0">
      <Image src="/images/PacDuck.png" alt="PacDuck" width={150} height={150} />
    </div>
  );
}

function HeroTagline() {
  return (
    <h1 className="hf-gradient-text text-4xl md:text-5xl font-semibold leading-tight md:leading-[1.2]">
      First they ignore you.
      <br />
      Then they call you a <span className="text-hf-yellow italic">vibecoder</span>.
      <br />
      Then they try to hire you.
      <br />
      And then you win.
    </h1>
  );
}

function Subtitle() {
  return (
    <p className="text-muted-foreground text-lg md:text-xl">
      The directory of proud vibecoders who ship at superhuman speed.
    </p>
  );
}

function SearchBar() {
  return (
    <div className="w-full max-w-[600px]">
      <Input
        type="text"
        placeholder="Find a developer who builds MVPs in days, not months..."
        className="h-14 bg-input/50 border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-[4px]"
      />
    </div>
  );
}

function InlineDivider() {
  const { data: session } = useSession();
  if (session?.user) return null;
  return (
    <div className="relative w-full max-w-[600px] flex items-center">
      <Separator className="w-full" />
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="bg-background px-3 text-sm text-muted-foreground">or</span>
      </span>
    </div>
  );
}

function CTA() {
  const { data: session } = useSession();
  if (session?.user) return null;
  return (
    <Button
      size="lg"
      className="hf-cta"
      onClick={() => {
        posthog.capture('github_signin_initiated', { provider: 'github' });
        signIn("github", { callbackUrl: "/post-auth" });
      }}
    >
      Sign in with GitHub
    </Button>
  );
}

export function Landing() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 flex items-center">
        <div className="hf-container text-center">
          <div className="mb-20">
            <Logo />
          </div>

          <div className="space-y-6 mb-10">
            <HeroTagline />
            <Subtitle />
          </div>

          <div className="flex flex-col items-center gap-6 mb-20">
            <SearchBar />
            <InlineDivider />
            <CTA />
          </div>
        </div>
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        For the hungry. For the foolish. For the dangerous.
      </footer>
    </div>
  );
}

export default Landing;
