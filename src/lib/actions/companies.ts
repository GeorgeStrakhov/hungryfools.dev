"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { companies } from "@/db/schema/company";
import { users } from "@/db/schema/auth";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import slugify from "slugify";
import {
  EmailTemplates,
  formatEmailAddress,
  sendEmail,
} from "@/lib/services/email/email";

const companyInput = z.object({
  name: z.string().min(1).max(200),
  logoUrl: z.string().url().optional().or(z.literal("")),
  url: z.string().url().optional().or(z.literal("")),
  contactEmail: z.string().email().optional().or(z.literal("")),
  oneliner: z.string().max(140).optional().or(z.literal("")),
  description: z.string().max(2000).optional().or(z.literal("")),
});

function generateSlug(base: string): string {
  const slugBase = slugify(base, { lower: true, strict: true, trim: true });
  return slugBase || `company-${Date.now()}`;
}

async function ensureUniqueSlug(desiredSlug: string): Promise<string> {
  let slug = desiredSlug;
  let suffix = 1;
  // Check for existing slug and add numeric suffix until unique
  // Limit attempts to avoid infinite loop
  // Drizzle query per attempt is acceptable given small N
  // You could also fetch all and check in-memory, but this is fine
  while (true) {
    const [existing] = await db
      .select({ id: companies.id })
      .from(companies)
      .where(eq(companies.slug, slug))
      .limit(1);
    if (!existing) return slug;
    slug = `${desiredSlug}-${suffix++}`;
  }
}

export type CompanyPayload = z.infer<typeof companyInput>;

export async function submitCompany(input: unknown) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  const data = companyInput.parse(input);
  const baseSlug = generateSlug(data.name);
  const slug = await ensureUniqueSlug(baseSlug);
  const now = new Date();

  const [created] = await db
    .insert(companies)
    .values({
      name: data.name,
      slug,
      logoUrl: data.logoUrl || null,
      url: data.url || null,
      contactEmail: data.contactEmail || null,
      oneliner: data.oneliner || null,
      description: data.description || null,
      isActive: false,
      createdByUserId: session.user.id,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  // Notify admins
  const adminRows = await db
    .select({ email: users.email })
    .from(users)
    .where(and(eq(users.isAdmin, true)));
  const adminEmails = adminRows.map((r) => r.email).filter(Boolean) as string[];

  if (adminEmails.length > 0) {
    const note = EmailTemplates.notification(
      `New company submission: ${data.name}`,
      `A new company has been submitted and is pending approval.\n\nName: ${data.name}\nWebsite: ${data.url || "-"}\nContact: ${data.contactEmail || "-"}\n\nOneliner: ${data.oneliner || "-"}`,
      `${process.env.NEXT_PUBLIC_APP_URL || "https://hungryfools.dev"}/admin/companies`,
      "Review in Admin",
    );

    await sendEmail({
      from: formatEmailAddress(
        "PacDuck@hungryfools.dev",
        "PacDuck @ Hungry Fools",
      ),
      to: adminEmails,
      subject: `New company submission: ${data.name}`,
      htmlBody: note.htmlBody,
      textBody: note.textBody,
      tag: "company_submission",
      metadata: { slug },
    });
  }

  revalidatePath("/companies");
  revalidatePath("/admin/companies");
  return created;
}

export async function adminCreateCompany(input: unknown) {
  const session = await auth();
  if (!session?.user?.isAdmin) throw new Error("Unauthorized");
  const data = companyInput.parse(input);
  const slug = await ensureUniqueSlug(generateSlug(data.name));
  const now = new Date();

  const [created] = await db
    .insert(companies)
    .values({
      name: data.name,
      slug,
      logoUrl: data.logoUrl || null,
      url: data.url || null,
      contactEmail: data.contactEmail || null,
      oneliner: data.oneliner || null,
      description: data.description || null,
      isActive: true,
      createdByUserId: session.user.id,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  revalidatePath("/companies");
  revalidatePath(`/companies/${created.slug}`);
  revalidatePath("/admin/companies");
  return created;
}

export async function adminUpdateCompany(id: string, input: unknown) {
  const session = await auth();
  if (!session?.user?.isAdmin) throw new Error("Unauthorized");
  const data = companyInput.parse(input);

  // Fetch existing to compare slug if name changes
  const [existing] = await db
    .select()
    .from(companies)
    .where(eq(companies.id, id))
    .limit(1);
  if (!existing) throw new Error("Company not found");

  let slug = existing.slug;
  if (data.name && data.name !== existing.name) {
    slug = await ensureUniqueSlug(generateSlug(data.name));
  }

  await db
    .update(companies)
    .set({
      name: data.name,
      slug,
      logoUrl: data.logoUrl || null,
      url: data.url || null,
      contactEmail: data.contactEmail || null,
      oneliner: data.oneliner || null,
      description: data.description || null,
      updatedAt: new Date(),
    })
    .where(eq(companies.id, id));

  revalidatePath("/companies");
  revalidatePath(`/companies/${slug}`);
  revalidatePath("/admin/companies");
  if (slug !== existing.slug) {
    revalidatePath(`/companies/${existing.slug}`);
  }
  return { success: true };
}

export async function adminToggleCompanyActive(id: string, isActive: boolean) {
  const session = await auth();
  if (!session?.user?.isAdmin) throw new Error("Unauthorized");
  const [existing] = await db
    .select({ slug: companies.slug })
    .from(companies)
    .where(eq(companies.id, id))
    .limit(1);
  if (!existing) throw new Error("Company not found");

  await db
    .update(companies)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(companies.id, id));

  revalidatePath("/companies");
  revalidatePath(`/companies/${existing.slug}`);
  revalidatePath("/admin/companies");
  return { success: true };
}

export async function adminDeleteCompany(id: string) {
  const session = await auth();
  if (!session?.user?.isAdmin) throw new Error("Unauthorized");
  const [existing] = await db
    .select({ slug: companies.slug })
    .from(companies)
    .where(eq(companies.id, id))
    .limit(1);
  if (!existing) throw new Error("Company not found");

  await db.delete(companies).where(eq(companies.id, id));

  revalidatePath("/companies");
  revalidatePath(`/companies/${existing.slug}`);
  revalidatePath("/admin/companies");
  return { success: true };
}
