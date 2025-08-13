import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t py-6 text-center text-xs text-muted-foreground">
      <div className="space-y-2">
        <div className="space-x-4">
          <Link href="/privacy" className="hover:text-foreground transition-colors">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-foreground transition-colors">
            Terms
          </Link>
        </div>
        <span>
          Stay Hungry. Stay Foolish. Stay Dangerous.
          <span className="hidden sm:inline"> / </span>
          <br className="inline sm:hidden" />
          VibeCoded with 💛 in Amsterdam / 2025
        </span>
      </div>
    </footer>
  );
}