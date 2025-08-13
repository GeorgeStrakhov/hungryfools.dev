"use client";

import { useState } from "react";
import { Loader2, Brain, Copy, Check } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LLMTestResult {
  result: unknown;
  model: string;
  executionTime: number;
}

const predefinedSchemas = {
  userProfile: {
    name: "User Profile",
    description: "Extract user information from text",
    schema: `{
  name: z.string(),
  profession: z.string(),
  location: z.string(),
  skills: z.array(z.string()).optional(),
}`,
    systemPrompt:
      "Extract user profile information from the input text. Return a JSON object with name, profession, location, and optionally an array of skills. If something is unknown, use 'N/A'.",
    exampleInput:
      "Hi, I'm John, a software engineer from San Francisco. I specialize in React, TypeScript, and Node.js.",
  },
  taskAnalysis: {
    name: "Task Analysis",
    description: "Analyze and break down tasks",
    schema: `{
  title: z.string(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  category: z.string(),
  estimatedHours: z.number(),
  subtasks: z.array(z.string()),
}`,
    systemPrompt:
      "Analyze the given task and break it down into structured information including title, priority level, category, estimated hours, and subtasks.",
    exampleInput:
      "Build a user authentication system with email/password login, password reset, and session management for a web application.",
  },
  sentimentAnalysis: {
    name: "Sentiment Analysis",
    description: "Analyze sentiment and extract key information",
    schema: `{
  sentiment: z.enum(['positive', 'negative', 'neutral']),
  confidence: z.number().min(0).max(1),
  emotions: z.array(z.string()),
  keyTopics: z.array(z.string()),
  summary: z.string(),
}`,
    systemPrompt:
      "Analyze the sentiment and emotional content of the text. Provide sentiment classification, confidence score, detected emotions, key topics, and a brief summary.",
    exampleInput:
      "I'm really excited about the new features we're building! The team has been incredibly collaborative and the progress is amazing. Sometimes I worry about deadlines, but overall I'm very optimistic about the project.",
  },
};

export default function LLMTestingPage() {
  const [selectedSchema, setSelectedSchema] =
    useState<keyof typeof predefinedSchemas>("userProfile");
  const [isCustomSchema, setIsCustomSchema] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState(
    predefinedSchemas.userProfile.systemPrompt,
  );
  const [userPrompt, setUserPrompt] = useState(
    predefinedSchemas.userProfile.exampleInput,
  );
  const [customSchema, setCustomSchema] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LLMTestResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSchemaChange = (schemaKey: keyof typeof predefinedSchemas) => {
    setSelectedSchema(schemaKey);
    const schema = predefinedSchemas[schemaKey];
    setSystemPrompt(schema.systemPrompt);
    setUserPrompt(schema.exampleInput);
    setIsCustomSchema(false);
  };

  const handleTest = async () => {
    if (!systemPrompt.trim() || !userPrompt.trim()) return;
    if (isCustomSchema && !customSchema.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/admin/test-llm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemPrompt,
          userPrompt,
          schema: isCustomSchema
            ? customSchema
            : predefinedSchemas[selectedSchema].schema,
          isCustomSchema,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate structured response");
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
          <Brain className="h-8 w-8" />
          LLM Testing
        </h1>
        <p className="text-muted-foreground mt-2">
          Test structured AI responses with custom Zod schemas
        </p>
      </div>

      {/* Schema Selection */}
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Schema Type</label>
          <div className="flex gap-2">
            <button
              onClick={() => setIsCustomSchema(false)}
              className={`rounded-lg border px-4 py-2 transition-colors ${
                !isCustomSchema
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent"
              }`}
            >
              Predefined
            </button>
            <button
              onClick={() => setIsCustomSchema(true)}
              className={`rounded-lg border px-4 py-2 transition-colors ${
                isCustomSchema
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent"
              }`}
            >
              Custom
            </button>
          </div>
        </div>

        {!isCustomSchema && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Predefined Schema</label>
            <Select
              value={selectedSchema}
              onValueChange={(value) =>
                handleSchemaChange(value as keyof typeof predefinedSchemas)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a schema..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(predefinedSchemas).map(([key, schema]) => (
                  <SelectItem key={key} value={key}>
                    {schema.name} - {schema.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {isCustomSchema && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Custom Zod Schema</label>
            <textarea
              value={customSchema}
              onChange={(e) => setCustomSchema(e.target.value)}
              placeholder={`z.object({\n  field1: z.string(),\n  field2: z.number(),\n  field3: z.boolean().optional(),\n})`}
              className="h-32 w-full resize-none rounded-lg border p-3 font-mono text-sm"
            />
          </div>
        )}

        {!isCustomSchema && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Schema Preview</label>
            <div className="bg-muted/50 rounded-lg p-3">
              <pre className="font-mono text-sm">
                {predefinedSchemas[selectedSchema].schema}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Prompts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">System Prompt</label>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="Instructions for the LLM..."
            className="h-32 w-full resize-none rounded-lg border p-3 text-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">User Prompt</label>
          <textarea
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            placeholder="User input to process..."
            className="h-32 w-full resize-none rounded-lg border p-3 text-sm"
          />
        </div>
      </div>

      {/* Test Button */}
      <button
        onClick={handleTest}
        disabled={
          isLoading ||
          !systemPrompt.trim() ||
          !userPrompt.trim() ||
          (isCustomSchema && !customSchema.trim())
        }
        className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded-lg px-6 py-3 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Brain className="h-4 w-4" />
            Generate Structured Response
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
              <h3 className="font-semibold">Structured Response</h3>
              <div className="text-muted-foreground flex items-center gap-4 text-sm">
                <span>Model: {result.model}</span>
                <span>Time: {result.executionTime}ms</span>
                <button
                  onClick={() =>
                    copyToClipboard(JSON.stringify(result.result, null, 2))
                  }
                  className="hover:bg-accent flex items-center gap-1 rounded px-2 py-1"
                >
                  {copied ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                  Copy
                </button>
              </div>
            </div>

            <div className="bg-muted/30 w-full overflow-hidden rounded-lg p-4">
              <pre className="w-full overflow-x-auto font-mono text-sm">
                {JSON.stringify(result.result, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
