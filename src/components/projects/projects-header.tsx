"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { analytics, ANALYTICS_EVENTS } from "@/lib/analytics";

export function ProjectsHeader() {
  const { data: session } = useSession();
  const [userHandle, setUserHandle] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.id) {
      // Fetch user handle
      const fetchUserHandle = async () => {
        try {
          const res = await fetch("/api/user/handle");
          const data = await res.json();
          if (data.handle) {
            setUserHandle(data.handle);
          }
        } catch (error) {
          console.error("Failed to fetch user handle:", error);
        }
      };

      fetchUserHandle();
    }
  }, [session?.user?.id]);

  return (
    <div className="mb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground mt-2">
            Discover amazing projects built by our community
          </p>
        </div>

        {session?.user && userHandle && (
          <div className="flex shrink-0">
            <Button asChild>
              <Link
                href={`/u/${userHandle}/projects/new`}
                onClick={() =>
                  analytics.track(ANALYTICS_EVENTS.NAVIGATION_CLICKED, {
                    destination: "new_project",
                    source: "projects_page",
                  })
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">List My Project</span>
                <span className="sm:hidden">Add Project</span>
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
