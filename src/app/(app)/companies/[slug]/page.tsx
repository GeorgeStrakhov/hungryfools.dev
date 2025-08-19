import { db } from "@/db";
import { companies } from "@/db/schema/company";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Mail } from "lucide-react";

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
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
          <div className="flex items-start gap-6">
            {row.logoUrl && (
              <img
                src={row.logoUrl}
                alt={row.name}
                className="h-20 w-20 rounded-lg"
              />
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold sm:text-4xl">{row.name}</h1>
              {row.oneliner && (
                <p className="text-muted-foreground mt-2 text-lg">
                  {row.oneliner}
                </p>
              )}
            </div>
          </div>

          {row.description && (
            <div className="prose prose-invert mt-8 max-w-none whitespace-pre-wrap">
              {row.description}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {row.url && (
                <a
                  href={row.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-hf-yellow hover:underline"
                >
                  <Globe className="h-4 w-4" />
                  <span>Visit website</span>
                </a>
              )}
              {row.contactEmail && (
                <a
                  href={`mailto:${row.contactEmail}`}
                  className="flex items-center gap-2 text-hf-yellow hover:underline"
                >
                  <Mail className="h-4 w-4" />
                  <span>Contact</span>
                </a>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
