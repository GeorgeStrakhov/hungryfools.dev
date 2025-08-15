"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signIn, signOut } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import posthog from "posthog-js";
import { useEffect, useState } from "react";
import { getAvatarUrl } from "@/lib/utils/avatar";

function UserAvatar() {
  const { data: session } = useSession();
  const [userHandle, setUserHandle] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const user = session?.user;
  const initials =
    user?.name
      ?.split(" ")
      .map((s) => s[0])
      .join("")
      ?.toUpperCase() ?? "U";
  const isAdmin = user?.isAdmin ?? false;

  useEffect(() => {
    if (user?.id) {
      // Fetch user handle and profile data
      Promise.all([
        fetch("/api/user/handle").then((res) => res.json()),
        fetch("/api/user/profile").then((res) => res.json()),
      ])
        .then(([handleData, profileData]) => {
          if (handleData.handle) {
            setUserHandle(handleData.handle);
          }
          if (profileData.profileImage) {
            setProfileImage(profileData.profileImage);
          }
        })
        .catch(console.error);
    }
  }, [user?.id]);

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="outline-none">
        <Avatar className="size-8">
          <AvatarImage
            src={getAvatarUrl(profileImage, user.image)}
            alt={user.name ?? "User"}
          />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {userHandle && (
          <>
            <DropdownMenuItem asChild>
              <Link href={`/u/${userHandle}`}>
                <svg
                  className="mr-2 h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                My Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Settings
          </Link>
        </DropdownMenuItem>
        {isAdmin && (
          <DropdownMenuItem asChild>
            <Link href="/admin">
              <svg
                className="mr-2 h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              Admin
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <button
            className="w-full"
            onClick={() => {
              posthog.capture("user-signed-out");
              signOut({ callbackUrl: "/" });
            }}
          >
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Sign out
          </button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Topbar() {
  const { data: session } = useSession();

  return (
    <header className="supports-[backdrop-filter]:bg-background/80 bg-background/60 sticky top-0 z-40 w-full border-b backdrop-blur">
      <div className="flex h-14 w-full items-center justify-between gap-3 px-6 md:px-8">
        <Link
          href="/"
          className="text-hf-accent flex items-center gap-2 font-semibold"
        >
          <Image
            src="/images/PacDuck.png"
            alt="PacDuck"
            width={20}
            height={20}
            className="w-auto"
          />
        </Link>
        <div className="flex items-center gap-3">
          {session?.user ? (
            <UserAvatar />
          ) : (
            <Button
              variant="outline"
              onClick={() => {
                posthog.capture("sign-in-clicked", { provider: "github" });
                signIn("github", { callbackUrl: "/post-auth" });
              }}
            >
              Sign in
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

export default Topbar;
