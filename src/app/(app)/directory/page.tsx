import { db } from "@/db";
import { profiles, projects } from "@/db/schema/profile";
import { ilike, or, eq } from "drizzle-orm";

type SearchParams = { searchParams: Promise<{ q?: string }> };

export default async function DirectoryPage({ searchParams }: SearchParams) {
  const params = await searchParams;
  const q = (params.q ?? "").trim().toLowerCase();

  // Get profiles with their projects for search
  const results = await db
    .select({
      userId: profiles.userId,
      handle: profiles.handle,
      displayName: profiles.displayName,
      headline: profiles.headline,
      skills: profiles.skills,
      // Include project info for matching
      projectName: projects.name,
      projectOneliner: projects.oneliner,
      projectDescription: projects.description,
    })
    .from(profiles)
    .leftJoin(projects, eq(profiles.userId, projects.userId))
    .where(
      q
        ? or(
            ilike(profiles.headline, `%${q}%`),
            ilike(profiles.displayName, `%${q}%`),
            ilike(projects.name, `%${q}%`),
            ilike(projects.oneliner, `%${q}%`),
            ilike(projects.description, `%${q}%`),
          )
        : undefined,
    )
    .limit(100);

  // Group results by user to avoid duplicates
  interface GroupedProfile {
    userId: string;
    handle: string;
    displayName: string | null;
    headline: string | null;
    skills: string[] | null;
    projects: Array<{
      name: string;
      oneliner: string | null;
      description: string | null;
    }>;
  }

  const groupedResults = results.reduce(
    (acc, row) => {
      const key = row.userId;
      if (!acc[key]) {
        acc[key] = {
          userId: row.userId,
          handle: row.handle,
          displayName: row.displayName,
          headline: row.headline,
          skills: row.skills,
          projects: [],
        };
      }

      // Add project if it exists and matches search
      if (row.projectName && q) {
        const projectMatches = [
          row.projectName,
          row.projectOneliner,
          row.projectDescription,
        ].some((text) => text?.toLowerCase().includes(q.toLowerCase()));

        if (projectMatches) {
          acc[key].projects.push({
            name: row.projectName,
            oneliner: row.projectOneliner,
            description: row.projectDescription,
          });
        }
      }

      return acc;
    },
    {} as Record<string, GroupedProfile>,
  );

  const finalResults = Object.values(groupedResults).slice(0, 50);

  return (
    <div className="hf-container py-8">
      <form className="mb-6">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search developers and projects (e.g., agents, realtime, Next.js)"
          className="bg-input border-input h-12 w-full rounded-md px-4"
        />
      </form>
      <div className="grid gap-4">
        {finalResults.map((p: GroupedProfile) => (
          <a
            key={p.userId}
            href={`/u/${p.handle}`}
            className="hover:bg-accent block rounded-md border p-4"
          >
            <div className="font-semibold">{p.displayName || p.handle}</div>
            <div className="text-muted-foreground">@{p.handle}</div>
            <div className="mt-2">{p.headline}</div>

            {/* Show matching projects */}
            {p.projects.length > 0 && (
              <div className="mt-3 space-y-2">
                <div className="text-muted-foreground text-xs font-medium">
                  Projects:
                </div>
                {p.projects.map((project, idx: number) => (
                  <div
                    key={idx}
                    className="bg-muted/50 rounded px-2 py-1 text-sm"
                  >
                    <div className="font-medium">{project.name}</div>
                    {project.oneliner && (
                      <div className="text-muted-foreground text-xs">
                        {project.oneliner}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </a>
        ))}
      </div>
    </div>
  );
}
