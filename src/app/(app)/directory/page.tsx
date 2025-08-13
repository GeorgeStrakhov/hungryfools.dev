import { db } from "@/db";
import { profiles } from "@/db/schema/profile";
import { ilike } from "drizzle-orm";

type SearchParams = { searchParams: Promise<{ q?: string }> };

export default async function DirectoryPage({ searchParams }: SearchParams) {
  const params = await searchParams;
  const q = (params.q ?? "").trim().toLowerCase();
  const results = await db
    .select()
    .from(profiles)
    .where(q ? ilike(profiles.headline, `%${q}%`) : undefined)
    .limit(50);

  return (
    <div className="hf-container py-8">
      <form className="mb-6">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search developers (e.g., agents, realtime, Next.js)"
          className="bg-input border-input h-12 w-full rounded-md px-4"
        />
      </form>
      <div className="grid gap-4">
        {results.map((p) => (
          <a
            key={p.userId}
            href={`/u/${p.handle}`}
            className="hover:bg-accent block rounded-md border p-4"
          >
            <div className="font-semibold">{p.displayName}</div>
            <div className="text-muted-foreground">@{p.handle}</div>
            <div className="mt-2">{p.headline}</div>
          </a>
        ))}
      </div>
    </div>
  );
}
