import { db } from "@/db";
import { companies } from "@/db/schema/company";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

type Params = { params: Promise<{ slug: string }> };

export default async function CompanyDetailPage({ params }: Params) {
  const { slug } = await params;
  const [row] = await db
    .select()
    .from(companies)
    .where(eq(companies.slug, slug))
    .limit(1);

  if (!row || !row.isActive) {
    notFound();
  }

  return (
    <div className="hf-container py-8">
      <div className="flex items-center gap-4">
        {row.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={row.logoUrl} alt={row.name} className="h-16 w-16 rounded" />
        )}
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">{row.name}</h1>
          {row.oneliner && (
            <p className="text-muted-foreground mt-1">{row.oneliner}</p>
          )}
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {row.url && (
          <a
            href={row.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            Visit website
          </a>
        )}
        {row.contactEmail && (
          <a href={`mailto:${row.contactEmail}`} className="underline">
            Contact
          </a>
        )}
      </div>

      {row.description && (
        <div className="prose prose-invert mt-8 max-w-none whitespace-pre-wrap">
          {row.description}
        </div>
      )}
    </div>
  );
}
