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
  result: any;
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
    systemPrompt: "Extract user profile information from the input text. Return a JSON object with name, profession, location, and optionally an array of skills. If something is unknown, use 'N/A'.",
    exampleInput: "Hi, I'm John, a software engineer from San Francisco. I specialize in React, TypeScript, and Node.js.",
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
    systemPrompt: "Analyze the given task and break it down into structured information including title, priority level, category, estimated hours, and subtasks.",
    exampleInput: "Build a user authentication system with email/password login, password reset, and session management for a web application.",
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
    systemPrompt: "Analyze the sentiment and emotional content of the text. Provide sentiment classification, confidence score, detected emotions, key topics, and a brief summary.",
    exampleInput: "I'm really excited about the new features we're building! The team has been incredibly collaborative and the progress is amazing. Sometimes I worry about deadlines, but overall I'm very optimistic about the project.",
  },
};

export default function LLMTestingPage() {
  const [selectedSchema, setSelectedSchema] = useState<keyof typeof predefinedSchemas>("userProfile");
  const [isCustomSchema, setIsCustomSchema] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState(predefinedSchemas.userProfile.systemPrompt);
  const [userPrompt, setUserPrompt] = useState(predefinedSchemas.userProfile.exampleInput);
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
          schema: isCustomSchema ? customSchema : predefinedSchemas[selectedSchema].schema,
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
        <h1 className="text-3xl font-bold flex items-center gap-2">
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
              className={`px-4 py-2 rounded-lg border transition-colors ${
                !isCustomSchema 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-accent"
              }`}
            >
              Predefined
            </button>
            <button
              onClick={() => setIsCustomSchema(true)}
              className={`px-4 py-2 rounded-lg border transition-colors ${
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
              onValueChange={(value) => handleSchemaChange(value as keyof typeof predefinedSchemas)}
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
              className="w-full p-3 border rounded-lg resize-none h-32 font-mono text-sm"
            />
          </div>
        )}

        {!isCustomSchema && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Schema Preview</label>
            <div className="p-3 bg-muted/50 rounded-lg">
              <pre className="text-sm font-mono">{predefinedSchemas[selectedSchema].schema}</pre>
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
            className="w-full p-3 border rounded-lg resize-none h-32 text-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">User Prompt</label>
          <textarea
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            placeholder="User input to process..."
            className="w-full p-3 border rounded-lg resize-none h-32 text-sm"
          />
        </div>
      </div>

      {/* Test Button */}
      <button
        onClick={handleTest}
        disabled={isLoading || !systemPrompt.trim() || !userPrompt.trim() || (isCustomSchema && !customSchema.trim())}
        className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
        <div className="border border-red-500 bg-red-50 dark:bg-red-950/20 p-4 rounded-lg">
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div className="space-y-4">
          <div className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Structured Response</h3>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Model: {result.model}</span>
                <span>Time: {result.executionTime}ms</span>
                <button
                  onClick={() => copyToClipboard(JSON.stringify(result.result, null, 2))}
                  className="flex items-center gap-1 px-2 py-1 rounded hover:bg-accent"
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  Copy
                </button>
              </div>
            </div>
            
            <div className="p-4 bg-muted/30 rounded-lg w-full overflow-hidden">
              <pre className="text-sm font-mono overflow-x-auto w-full">
                {JSON.stringify(result.result, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}