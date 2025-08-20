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
      <div className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Companies</h1>
            <p className="text-muted-foreground mt-2">
              Vibecoder-friendly companies where you can thrive
            </p>
          </div>

          <div className="flex shrink-0">
            {session?.user ? (
              <Button asChild>
                <Link href="/companies/submit">
                  <span className="hidden sm:inline">Add My Company</span>
                  <span className="sm:hidden">Add Company</span>
                </Link>
              </Button>
            ) : (
              <Button asChild>
                <Link href="/api/auth/signin">
                  <span className="hidden sm:inline">
                    Sign in to add company
                  </span>
                  <span className="sm:hidden">Sign in</span>
                </Link>
              </Button>
            )}
          </div>
        </div>
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
