import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Topbar } from "@/components/topbar";
import { Footer } from "@/components/footer";

function Logo() {
  return (
    <div className="mb-0 flex items-center justify-center gap-4 md:gap-6">
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
        style={{ fontFamily: "var(--font-pixelify-sans)" }}
      >
        oh oh 404
      </div>
      <Image
        src="/video/pacduck_only_flipped.gif"
        alt="PacDuck animation flipped"
        width={96}
        height={96}
        className="h-12 w-12 sm:h-16 sm:w-16 md:h-24 md:w-24"
        unoptimized
      />
    </div>
  );
}

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <Topbar />
      <main className="flex flex-1 items-center justify-center">
        <div className="hf-container text-center">
          <div className="mb-8 md:mb-12">
            <Logo />
          </div>

          <div className="mb-10 space-y-4">
            <h1 className="hf-gradient-text text-2xl leading-tight font-semibold sm:text-3xl md:text-5xl md:leading-[1.2]">
              Looks like PacDuck accidentally ate this page. Sorry about that!
            </h1>
          </div>

          <div className="flex items-center justify-center mt-18">
            <Button asChild size="lg" className="hf-cta">
              <Link href="/">Go back home</Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
