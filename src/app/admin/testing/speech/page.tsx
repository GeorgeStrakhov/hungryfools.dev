"use client";

import { useState, useRef } from "react";
import { Loader2, Mic, Copy, Check, File, Volume2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SpeechTestResult {
  success: boolean;
  transcription?: string;
  executionTime: number;
  error?: string;
}

const audioExamples = [
  {
    name: "Sample Audio 1",
    url: "https://www2.cs.uic.edu/~i101/SoundFiles/BabyElephantWalk60.wav",
    description: "Short instrumental piece",
  },
  {
    name: "Sample Audio 2", 
    url: "https://www2.cs.uic.edu/~i101/SoundFiles/StarWars60.wav",
    description: "Famous movie theme",
  },
];

const languages = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "zh", name: "Chinese" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "auto", name: "Auto-detect" },
];

export default function SpeechTestingPage() {
  const [inputType, setInputType] = useState<"file" | "url">("file");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [language, setLanguage] = useState("en");
  const [temperature, setTemperature] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SpeechTestResult | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check if it's an audio file
      if (!file.type.startsWith('audio/')) {
        setError("Please select an audio file");
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleExampleSelect = (example: typeof audioExamples[0]) => {
    setInputType("url");
    setAudioUrl(example.url);
  };

  const handleTest = async () => {
    if (inputType === "file" && !selectedFile) return;
    if (inputType === "url" && !audioUrl.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      
      if (inputType === "file" && selectedFile) {
        formData.append("file", selectedFile);
        formData.append("inputType", "file");
      } else {
        formData.append("audioUrl", audioUrl);
        formData.append("inputType", "url");
      }
      
      formData.append("language", language);
      formData.append("temperature", temperature.toString());

      const response = await fetch("/api/admin/test-speech", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to transcribe audio");
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

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Mic className="h-8 w-8" />
          Speech Transcription Testing
        </h1>
        <p className="text-muted-foreground mt-2">
          Test audio transcription using OpenAI Whisper via Replicate
        </p>
      </div>

      {/* Input Type Selection */}
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Audio Source</label>
          <div className="flex gap-2">
            <button
              onClick={() => setInputType("file")}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                inputType === "file"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent"
              }`}
            >
              Upload File
            </button>
            <button
              onClick={() => setInputType("url")}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                inputType === "url"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent"
              }`}
            >
              Audio URL
            </button>
          </div>
        </div>

        {inputType === "url" && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Example Audio URLs</label>
            <div className="flex flex-wrap gap-2">
              {audioExamples.map((example) => (
                <button
                  key={example.name}
                  onClick={() => handleExampleSelect(example)}
                  className="px-3 py-1 text-xs border rounded-full hover:bg-accent transition-colors"
                  title={example.description}
                >
                  {example.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input Configuration */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          {inputType === "file" ? (
            <div className="space-y-2">
              <label className="text-sm font-medium">Audio File</label>
              <div className="flex items-center gap-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="audio/*"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 border rounded-lg hover:bg-accent transition-colors flex items-center gap-2"
                >
                  <Volume2 className="h-4 w-4" />
                  Choose Audio File
                </button>
                {selectedFile && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
                    <Volume2 className="h-4 w-4" />
                    <span className="text-sm">{selectedFile.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({formatFileSize(selectedFile.size)})
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-medium">Audio URL</label>
              <input
                type="url"
                value={audioUrl}
                onChange={(e) => setAudioUrl(e.target.value)}
                placeholder="https://example.com/audio.mp3"
                className="w-full p-3 border rounded-lg"
              />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Language</label>
            <Select
              value={language}
              onValueChange={setLanguage}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select language..." />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Temperature ({temperature})</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Higher values increase randomness in transcription
            </p>
          </div>
        </div>
      </div>

      {/* Test Button */}
      <button
        onClick={handleTest}
        disabled={
          isLoading ||
          (inputType === "file" && !selectedFile) ||
          (inputType === "url" && !audioUrl.trim())
        }
        className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Transcribing...
          </>
        ) : (
          <>
            <Mic className="h-4 w-4" />
            Transcribe Audio
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
          {result.success && result.transcription ? (
            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Transcription Result</h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Time: {result.executionTime}ms</span>
                  <button
                    onClick={() => copyToClipboard(result.transcription!)}
                    className="flex items-center gap-1 px-2 py-1 rounded hover:bg-accent"
                  >
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    Copy Text
                  </button>
                </div>
              </div>
              
              <div className="p-4 bg-muted/30 rounded-lg">
                <h4 className="font-medium text-sm mb-2">Transcribed Text:</h4>
                <p className="text-sm leading-relaxed">{result.transcription}</p>
              </div>
            </div>
          ) : (
            result.error && (
              <div className="border border-red-500 bg-red-50 dark:bg-red-950/20 p-4 rounded-lg">
                <p className="text-red-600 dark:text-red-400 text-sm font-medium">
                  ❌ Transcription failed: {result.error}
                </p>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}