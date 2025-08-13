"use client";

import { useState } from "react";
import { Loader2, Mail, Copy, Check, Plus, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EmailTestResult {
  success: boolean;
  response: unknown;
  executionTime: number;
}

const emailTemplates = {
  basic: {
    name: "Basic Email",
    from: "test@hungryfools.dev",
    to: "user@example.com",
    subject: "Test Email",
    htmlBody: "<h1>Hello!</h1><p>This is a test email from HungryFools.</p>",
    textBody: "Hello! This is a test email from HungryFools.",
  },
  notification: {
    name: "Notification",
    from: "notifications@hungryfools.dev",
    to: "user@example.com",
    subject: "Account Notification",
    htmlBody:
      "<h2>Account Update</h2><p>Your profile has been updated successfully.</p><p><a href='#'>View Profile</a></p>",
    textBody:
      "Account Update\n\nYour profile has been updated successfully.\n\nView Profile: https://hungryfools.dev/profile",
  },
  welcome: {
    name: "Welcome Email",
    from: "welcome@hungryfools.dev",
    to: "newuser@example.com",
    subject: "Welcome to HungryFools!",
    htmlBody:
      "<h1>Welcome to HungryFools!</h1><p>We're excited to have you join our community of vibecoders.</p><p><strong>Next steps:</strong></p><ul><li>Complete your profile</li><li>Explore the directory</li><li>Connect with other developers</li></ul>",
    textBody:
      "Welcome to HungryFools!\n\nWe're excited to have you join our community of vibecoders.\n\nNext steps:\n- Complete your profile\n- Explore the directory\n- Connect with other developers",
  },
};

export default function EmailTestingPage() {
  const [selectedTemplate, setSelectedTemplate] =
    useState<keyof typeof emailTemplates>("basic");
  const [from, setFrom] = useState(emailTemplates.basic.from);
  const [to, setTo] = useState(emailTemplates.basic.to);
  const [subject, setSubject] = useState(emailTemplates.basic.subject);
  const [htmlBody, setHtmlBody] = useState(emailTemplates.basic.htmlBody);
  const [textBody, setTextBody] = useState(emailTemplates.basic.textBody);
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [tag, setTag] = useState("");
  const [metadata, setMetadata] = useState<
    Array<{ key: string; value: string }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EmailTestResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleTemplateChange = (templateKey: keyof typeof emailTemplates) => {
    setSelectedTemplate(templateKey);
    const template = emailTemplates[templateKey];
    setFrom(template.from);
    setTo(template.to);
    setSubject(template.subject);
    setHtmlBody(template.htmlBody);
    setTextBody(template.textBody);
  };

  const addMetadata = () => {
    setMetadata([...metadata, { key: "", value: "" }]);
  };

  const removeMetadata = (index: number) => {
    setMetadata(metadata.filter((_, i) => i !== index));
  };

  const updateMetadata = (
    index: number,
    field: "key" | "value",
    value: string,
  ) => {
    const updated = [...metadata];
    updated[index][field] = value;
    setMetadata(updated);
  };

  const handleTest = async () => {
    if (!from.trim() || !to.trim() || !subject.trim()) return;
    if (!htmlBody.trim() && !textBody.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const emailData: Record<string, unknown> = {
        from,
        to,
        subject,
        htmlBody: htmlBody.trim() || undefined,
        textBody: textBody.trim() || undefined,
        cc: cc.trim() || undefined,
        bcc: bcc.trim() || undefined,
        tag: tag.trim() || undefined,
      };

      // Add metadata if any
      const validMetadata = metadata.filter(
        (m) => m.key.trim() && m.value.trim(),
      );
      if (validMetadata.length > 0) {
        emailData.metadata = Object.fromEntries(
          validMetadata.map((m) => [m.key.trim(), m.value.trim()]),
        );
      }

      const response = await fetch("/api/admin/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to send email");
      }

      const result = await response.json();
      setResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <Mail className="h-8 w-8" />
          Email Testing
        </h1>
        <p className="text-muted-foreground mt-2">
          Test email sending functionality (development mode - logged to
          console)
        </p>
      </div>

      {/* Template Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Email Template</label>
        <Select
          value={selectedTemplate}
          onValueChange={(value) =>
            handleTemplateChange(value as keyof typeof emailTemplates)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select an email template..." />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(emailTemplates).map(([key, template]) => (
              <SelectItem key={key} value={key}>
                {template.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Email Fields */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">From</label>
            <input
              type="email"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              placeholder="sender@domain.com"
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">To</label>
            <input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="recipient@domain.com"
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">CC (optional)</label>
            <input
              type="email"
              value={cc}
              onChange={(e) => setCc(e.target.value)}
              placeholder="cc@domain.com"
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">BCC (optional)</label>
            <input
              type="email"
              value={bcc}
              onChange={(e) => setBcc(e.target.value)}
              placeholder="bcc@domain.com"
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tag (optional)</label>
            <input
              type="text"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="email-tag"
              className="w-full rounded-lg border p-3"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">HTML Body</label>
            <textarea
              value={htmlBody}
              onChange={(e) => setHtmlBody(e.target.value)}
              placeholder="<h1>Email content...</h1>"
              className="h-32 w-full resize-none rounded-lg border p-3 font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Text Body</label>
            <textarea
              value={textBody}
              onChange={(e) => setTextBody(e.target.value)}
              placeholder="Plain text email content..."
              className="h-32 w-full resize-none rounded-lg border p-3 font-mono text-sm"
            />
          </div>

          {/* Metadata */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Metadata (optional)</label>
              <button
                onClick={addMetadata}
                className="hover:bg-accent flex items-center gap-1 rounded px-2 py-1 text-xs"
              >
                <Plus className="h-3 w-3" />
                Add
              </button>
            </div>
            {metadata.map((item, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={item.key}
                  onChange={(e) => updateMetadata(index, "key", e.target.value)}
                  placeholder="key"
                  className="flex-1 rounded border p-2 text-sm"
                />
                <input
                  type="text"
                  value={item.value}
                  onChange={(e) =>
                    updateMetadata(index, "value", e.target.value)
                  }
                  placeholder="value"
                  className="flex-1 rounded border p-2 text-sm"
                />
                <button
                  onClick={() => removeMetadata(index)}
                  className="hover:bg-accent rounded p-2"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Test Button */}
      <button
        onClick={handleTest}
        disabled={
          isLoading ||
          !from.trim() ||
          !to.trim() ||
          !subject.trim() ||
          (!htmlBody.trim() && !textBody.trim())
        }
        className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded-lg px-6 py-3 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Mail className="h-4 w-4" />
            Send Test Email
          </>
        )}
      </button>

      {/* Error Display */}
      {error && (
        <div className="rounded-lg border border-red-500 bg-red-50 p-4 dark:bg-red-950/20">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div className="space-y-4">
          <div className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Email Result</h3>
              <div className="text-muted-foreground flex items-center gap-4 text-sm">
                <span>Time: {result.executionTime}ms</span>
                <button
                  onClick={() =>
                    copyToClipboard(JSON.stringify(result.response, null, 2))
                  }
                  className="hover:bg-accent flex items-center gap-1 rounded px-2 py-1"
                >
                  {copied ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                  Copy Response
                </button>
              </div>
            </div>

            {result.success ? (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/20">
                <p className="mb-2 text-sm font-medium text-green-600 dark:text-green-400">
                  ✅ Email processed successfully (development mode)
                </p>
                <div className="font-mono text-xs text-green-600 dark:text-green-400">
                  <p>
                    Message ID:{" "}
                    {((result.response as Record<string, unknown>)
                      ?.MessageID as string) || "N/A"}
                  </p>
                  <p>
                    To:{" "}
                    {((result.response as Record<string, unknown>)
                      ?.To as string) || "N/A"}
                  </p>
                  <p>
                    Submitted:{" "}
                    {((result.response as Record<string, unknown>)
                      ?.SubmittedAt as string) || "N/A"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/20">
                <p className="text-sm font-medium text-red-600 dark:text-red-400">
                  ❌ Email failed to send
                </p>
              </div>
            )}

            <div className="bg-muted/30 rounded-lg p-4">
              <h4 className="mb-2 text-sm font-medium">Full Response:</h4>
              <pre className="overflow-x-auto font-mono text-xs">
                {JSON.stringify(result.response, null, 2)}
              </pre>
            </div>
          </div>

          <div className="rounded-lg border bg-blue-50 p-4 dark:bg-blue-950/20">
            <h4 className="mb-2 text-sm font-medium text-blue-600 dark:text-blue-400">
              💡 Development Mode
            </h4>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              Check your terminal/console where Next.js is running to see the
              full email content that would be sent.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
