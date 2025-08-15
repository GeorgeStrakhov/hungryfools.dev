"use client";

import * as React from "react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/media/image-upload";
import { signIn, useSession } from "next-auth/react";
import { submitCompany } from "@/lib/actions/companies";
import Link from "next/link";

export default function SubmitCompanyPage() {
  const { data: session } = useSession();
  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [url, setUrl] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [oneliner, setOneliner] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await submitCompany({
        name,
        logoUrl,
        url,
        contactEmail,
        oneliner,
        description,
      });
      setSuccess("Thanks! Your company is pending approval.");
      setName("");
      setLogoUrl("");
      setUrl("");
      setContactEmail("");
      setOneliner("");
      setDescription("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (!session?.user) {
    return (
      <div className="hf-container py-8">
        <h1 className="text-2xl font-bold sm:text-3xl">Add My Company</h1>
        <p className="text-muted-foreground mt-2">
          Sign in to submit your company.
        </p>
        <div className="mt-4">
          <Button
            onClick={() =>
              signIn("github", { callbackUrl: "/companies/submit" })
            }
          >
            Sign in with GitHub
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="hf-container py-8">
      <h1 className="text-2xl font-bold sm:text-3xl">Add My Company</h1>
      <p className="text-muted-foreground mt-2">
        Submit your company to be listed as vibecoder-friendly. We&apos;ll
        review and approve it shortly.
      </p>

      {success ? (
        <div className="mt-8 rounded-lg border p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10 text-green-600">
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold">
            Thanks! Your company is pending approval.
          </h2>
          <p className="text-muted-foreground mt-2">
            We&apos;ll notify the admins and get back to you shortly.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/companies" className="underline">
              Browse companies
            </Link>
            <span className="text-muted-foreground">·</span>
            <Link href="/" className="underline">
              Back to home
            </Link>
          </div>
        </div>
      ) : (
        <form className="mt-8 space-y-6" onSubmit={onSubmit}>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Company Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Logo</label>
            <ImageUpload
              value={logoUrl}
              onChange={(url) => setLogoUrl(url || "")}
              uploadUrl="/api/companies/upload-logo"
              label="Upload company logo"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Website</label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Contact Email
            </label>
            <Input
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="hello@example.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Oneliner</label>
            <Input
              value={oneliner}
              onChange={(e) => setOneliner(e.target.value)}
              placeholder="Short tagline (<= 140 chars)"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Description
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
            />
          </div>

          {error && <div className="text-destructive text-sm">{error}</div>}

          <div className="pt-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Submitting…" : "Submit"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
