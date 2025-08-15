"use client";

import * as React from "react";
import Image from "next/image";
import posthog from "posthog-js";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SearchInput } from "@/components/ui/search-input";

function Logo() {
  return (
    <div className="mt-12 mb-0 flex items-center justify-center gap-4 md:gap-6">
      <Image
        src="/video/pacduck_only.gif"
        alt="PacDuck animation"
        width={96}
        height={96}
        className="h-12 w-12 sm:h-16 sm:w-16 md:h-24 md:w-24"
        unoptimized
      />
      <div
        className="text-hf-accent animate-neon-glitch text-xl sm:text-3xl md:text-5xl"
        style={{
          fontFamily: "var(--font-pixelify-sans)",
        }}
      >
        hungryfools.dev
      </div>
      <Image
        src="/video/pacduck_only_flipped.gif"
        alt="PacDuck animation flipped"
        width={96}
        height={96}
        unoptimized
        className="h-12 w-12 sm:h-16 sm:w-16 md:h-24 md:w-24"
      />
    </div>
  );
}

function HeroTagline() {
  return (
    <h1 className="hf-gradient-text text-2xl leading-tight font-semibold sm:text-3xl md:text-5xl md:leading-[1.2]">
      First they ignore you.
      <br />
      Then they call you a{" "}
      <span className="text-hf-yellow italic">vibecoder</span>.
      <br />
      Then they try to hire you.
      <br />
      And then you win.
    </h1>
  );
}

function Subtitle() {
  return (
    <p className="text-muted-foreground mt-12 mb-12 text-xl sm:text-2xl md:text-3xl">
      The directory of hungry and foolish vibecoders{" "}
      <br className="sm:hidden md:block" />
      who ship human-level stuff at superhuman speed.
    </p>
  );
}

function SearchBar() {
  const router = useRouter();

  const handleSearch = (query: string) => {
    if (query.trim()) {
      posthog.capture("directory_search", { query });
      router.push(`/directory?q=${encodeURIComponent(query.trim())}`);
    } else {
      router.push("/directory");
    }
  };

  return (
    <div className="w-full max-w-[600px]">
      <SearchInput
        showIcon={true}
        controlled={true}
        onSubmit={handleSearch}
        className="bg-input/50 border-input text-foreground placeholder:text-muted-foreground h-14 focus-visible:ring-[4px]"
        basePlaceholder="Search developers and projects..."
      />
    </div>
  );
}

function InlineDivider() {
  const { data: session } = useSession();
  if (session?.user) return null;
  return (
    <div className="relative flex w-full max-w-[600px] items-center">
      <Separator className="w-full" />
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="bg-background text-muted-foreground px-3 text-sm">
          or
        </span>
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
        posthog.capture("github_signin_initiated", { provider: "github" });
        signIn("github", { callbackUrl: "/post-auth" });
      }}
    >
      Sign in with GitHub
    </Button>
  );
}

export function Landing() {
  return (
    <div className="flex min-h-full items-center justify-center">
      <div className="hf-container text-center">
        <div className="mb-8 md:mb-12">
          <Logo />
        </div>

        <div className="mb-10 space-y-6">
          <HeroTagline />
          <Subtitle />
        </div>

        <div className="mb-20 flex flex-col items-center gap-6">
          <SearchBar />
          <p className="text-muted-foreground text-sm">
            Press Enter to search or{" "}
            <Link href="/directory" className="hover:text-foreground underline">
              browse all developers
            </Link>
          </p>
          <InlineDivider />
          <CTA />
        </div>
      </div>
    </div>
  );
}

export default Landing;
