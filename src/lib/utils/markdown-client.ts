import { marked } from "marked";

/**
 * Client-side markdown renderer (simplified for previews only)
 * Only for preview purposes in forms - final content uses MDX server-side
 */

/**
 * Basic client-side markdown rendering for previews
 * Note: This is basic and only for previews - production uses MDX
 */
export function renderMarkdownPreview(markdown: string): string {
  if (!markdown?.trim()) return "";

  try {
    // Basic safety: remove script tags and on* attributes
    const saferMarkdown = markdown
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/\son\w+\s*=/gi, " ");

    // Convert markdown to HTML with basic styling
    const html = marked.parse(saferMarkdown.trim()) as string;

    // Add basic Tailwind classes for preview (simplified)
    return html
      .replace(/<h1>/g, '<h1 class="text-lg font-bold mt-3 mb-2">')
      .replace(/<h2>/g, '<h2 class="text-base font-semibold mt-3 mb-1">')
      .replace(/<h3>/g, '<h3 class="text-sm font-semibold mt-2 mb-1">')
      .replace(/<p>/g, '<p class="mb-2 leading-relaxed">')
      .replace(/<strong>/g, '<strong class="font-semibold">')
      .replace(/<em>/g, '<em class="italic">')
      .replace(
        /<code>/g,
        '<code class="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs font-mono">',
      )
      .replace(/<ul>/g, '<ul class="list-disc list-inside mb-2 ml-2">')
      .replace(/<ol>/g, '<ol class="list-decimal list-inside mb-2 ml-2">')
      .replace(
        /<a href="([^"]*)"([^>]*)>/g,
        '<a href="$1"$2 class="text-blue-600 underline">',
      );
  } catch (error) {
    console.error("Error processing markdown preview:", error);
    return markdown.replace(/[<>]/g, "");
  }
}
