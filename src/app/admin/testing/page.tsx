import Link from "next/link";
import { 
  FlaskConical,
  Brain,
  Mail,
  Image,
  Upload,
  Mic,
  ArrowRight
} from "lucide-react";

const testingServices = [
  {
    name: "Embeddings & Reranking",
    description: "Test BGE-M3 embeddings, similarity search, and document reranking",
    href: "/admin/testing/embeddings",
    icon: Brain,
    status: "Available",
  },
  {
    name: "LLM (Structured)",
    description: "Test structured AI responses with custom Zod schemas",
    href: "/admin/testing/llm",
    icon: FlaskConical,
    status: "Available",
  },
  {
    name: "Email Service",
    description: "Test email sending with attachments and templates",
    href: "/admin/testing/email", 
    icon: Mail,
    status: "Available",
  },
  {
    name: "Image Generation",
    description: "Test AI image generation with Replicate",
    href: "/admin/testing/replicate",
    icon: Image,
    status: "Available",
  },
  {
    name: "File Upload (S3)",
    description: "Test file uploads to Cloudflare R2 storage",
    href: "/admin/testing/s3",
    icon: Upload,
    status: "Available",
  },
  {
    name: "Speech Transcription", 
    description: "Test audio transcription with Whisper AI",
    href: "/admin/testing/speech",
    icon: Mic,
    status: "Available",
  },
];

export default function TestingOverview() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FlaskConical className="h-8 w-8" />
          Service Testing
        </h1>
        <p className="text-muted-foreground mt-2">
          Test all integrated services and APIs to ensure they're working correctly
        </p>
      </div>

      {/* Service Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {testingServices.map((service) => {
          const Icon = service.icon;
          
          return (
            <Link
              key={service.name}
              href={service.href}
              className="group border rounded-lg p-6 hover:border-primary/50 transition-all hover:shadow-md"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold group-hover:text-primary transition-colors">
                  {service.name}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {service.description}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span className="text-xs font-medium text-green-600 dark:text-green-400">
                    {service.status}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Info */}
      <div className="border rounded-lg p-6 bg-muted/20">
        <h3 className="font-semibold mb-3">Testing Guidelines</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>• <strong>Email Service</strong>: Runs in development mode - emails are logged to console, not sent</p>
          <p>• <strong>File Uploads</strong>: Test files are uploaded to your configured storage bucket</p>
          <p>• <strong>AI Services</strong>: Use real API calls - monitor your usage and costs</p>
          <p>• <strong>Error Handling</strong>: All services include comprehensive error messages for debugging</p>
        </div>
      </div>
    </div>
  );
}