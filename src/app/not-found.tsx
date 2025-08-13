import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function Logo() {
  return (
    <div className="flex items-center justify-center gap-4 md:gap-6 mt-12 mb-0">
      <img
        src="/video/pacduck_only.gif"
        alt="PacDuck animation"
        className="w-12 h-12 sm:w-16 sm:h-16 md:w-24 md:h-24"
      />
      <div
        className="text-hf-accent text-xl sm:text-3xl md:text-5xl animate-neon-glitch"
        style={{ fontFamily: "var(--font-pixelify-sans)" }}
      >
        hungryfools.dev
      </div>
      <img
        src="/video/pacduck_only_flipped.gif"
        alt="PacDuck animation flipped"
        className="w-12 h-12 sm:w-16 sm:h-16 md:w-24 md:h-24"
      />
    </div>
  );
}

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-full">
      <div className="hf-container text-center">
        <div className="mb-8 md:mb-12">
          <Logo />
        </div>

        <div className="space-y-4 mb-10">
          <h1 className="hf-gradient-text text-2xl sm:text-3xl md:text-5xl font-semibold leading-tight md:leading-[1.2]">
            404 — Page not found
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl">
            The page you’re looking for has moved or doesn’t exist.
          </p>
        </div>

        <div className="flex items-center justify-center">
          <Button asChild size="lg" className="hf-cta">
            <Link href="/">Go back home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}


