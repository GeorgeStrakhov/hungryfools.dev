"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import posthog from 'posthog-js';

function UserAvatar() {
  const { data } = useSession();
  const user = data?.user;
  const initials = user?.name?.split(" ").map((s) => s[0]).join("")?.toUpperCase() ?? "U";

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="outline-none">
        <Avatar className="size-8">
          <AvatarImage src={user.image ?? undefined} alt={user.name ?? "User"} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href="/profile/edit">Edit profile</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <button
            onClick={() => {
              posthog.capture('user-signed-out');
              signOut({ callbackUrl: '/' });
            }}
          >
            Sign out
          </button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Topbar() {
  const { data, status } = useSession();

  return (
    <header className="sticky top-0 z-40 w-full border-b backdrop-blur supports-[backdrop-filter]:bg-background/80 bg-background/60">
      <div className="hf-container h-14 flex items-center justify-between gap-3">
        <Link href="/" className="text-hf-accent font-semibold">
          hungryfools.ai
        </Link>
        <div className="flex items-center gap-3">
          {status === "loading" ? null : data?.user ? (
            <UserAvatar />
          ) : (
            <Button variant="outline" onClick={() => {
              posthog.capture('sign-in-clicked', { provider: 'github' });
              signIn("github");
            }}>Sign in</Button>
          )}
        </div>
      </div>
    </header>
  );
}

export default Topbar;
