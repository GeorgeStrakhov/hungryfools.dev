import { db } from "@/db";
import { companies } from "@/db/schema/company";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { eq } from "drizzle-orm";
import Link from "next/link";

export default async function CompaniesPage() {
  const session = await auth();
  const rows = await db
    .select({
      id: companies.id,
      slug: companies.slug,
      name: companies.name,
      logoUrl: companies.logoUrl,
      oneliner: companies.oneliner,
    })
    .from(companies)
    .where(eq(companies.isActive, true));

  return (
    <div className="hf-container py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold sm:text-3xl">
          Vibecoder-Friendly Companies
        </h1>
        {session?.user ? (
          <Button asChild>
            <Link href="/companies/submit">Add my company</Link>
          </Button>
        ) : null}
      </div>

      {rows.length === 0 ? (
        <p className="text-muted-foreground">No companies yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((c) => (
            <Link
              key={c.id}
              href={`/companies/${c.slug}`}
              className="hover:bg-accent rounded-md border p-4 transition-colors"
            >
              <div className="flex items-center gap-3">
                {c.logoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.logoUrl}
                    alt={c.name}
                    className="h-10 w-10 rounded"
                  />
                )}
                <div>
                  <div className="font-semibold">{c.name}</div>
                  {c.oneliner && (
                    <div className="text-muted-foreground line-clamp-2 text-sm">
                      {c.oneliner}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
