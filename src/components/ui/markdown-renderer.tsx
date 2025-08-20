import { MDXRemote } from "next-mdx-remote/rsc";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

// Define the MDX components with proper Tailwind styling
const mdxComponents = {
  h1: ({ children }: { children: React.ReactNode }) => (
    <h1 className="mt-6 mb-4 text-2xl font-bold">{children}</h1>
  ),
  h2: ({ children }: { children: React.ReactNode }) => (
    <h2 className="mt-5 mb-3 text-xl font-semibold">{children}</h2>
  ),
  h3: ({ children }: { children: React.ReactNode }) => (
    <h3 className="mt-4 mb-2 text-lg font-semibold">{children}</h3>
  ),
  h4: ({ children }: { children: React.ReactNode }) => (
    <h4 className="mt-3 mb-2 text-base font-semibold">{children}</h4>
  ),
  h5: ({ children }: { children: React.ReactNode }) => (
    <h5 className="mt-2 mb-1 text-sm font-semibold">{children}</h5>
  ),
  h6: ({ children }: { children: React.ReactNode }) => (
    <h6 className="mt-2 mb-1 text-sm font-medium">{children}</h6>
  ),
  p: ({ children }: { children: React.ReactNode }) => (
    <p className="mb-4 leading-relaxed">{children}</p>
  ),
  ul: ({ children }: { children: React.ReactNode }) => (
    <ul className="mb-4 ml-4 list-inside list-disc space-y-1">{children}</ul>
  ),
  ol: ({ children }: { children: React.ReactNode }) => (
    <ol className="mb-4 ml-4 list-inside list-decimal space-y-1">{children}</ol>
  ),
  li: ({ children }: { children: React.ReactNode }) => (
    <li className="ml-2">{children}</li>
  ),
  strong: ({ children }: { children: React.ReactNode }) => (
    <strong className="font-semibold">{children}</strong>
  ),
  em: ({ children }: { children: React.ReactNode }) => (
    <em className="italic">{children}</em>
  ),
  code: ({ children }: { children: React.ReactNode }) => (
    <code className="rounded bg-gray-100 px-1 py-0.5 font-mono text-sm dark:bg-gray-800">
      {children}
    </code>
  ),
  pre: ({ children }: { children: React.ReactNode }) => (
    <pre className="mb-4 overflow-x-auto rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
      {children}
    </pre>
  ),
  blockquote: ({ children }: { children: React.ReactNode }) => (
    <blockquote className="mb-4 border-l-4 border-gray-300 pl-4 text-gray-600 italic dark:text-gray-400">
      {children}
    </blockquote>
  ),
  a: ({
    href,
    children,
    ...props
  }: {
    href?: string;
    children: React.ReactNode;
  }) => {
    // Basic safety check
    if (
      !href ||
      (!href.startsWith("http://") && !href.startsWith("https://"))
    ) {
      return <span>{children}</span>;
    }
    return (
      <a
        href={href}
        className="text-blue-600 underline hover:text-blue-800"
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      >
        {children}
      </a>
    );
  },
};

/**
 * Server component that renders markdown content safely using MDX
 */
export function MarkdownRenderer({
  content,
  className = "",
}: MarkdownRendererProps) {
  if (!content?.trim()) return null;

  return (
    <div className={className}>
      <MDXRemote
        source={content}
        components={mdxComponents}
        options={{
          parseFrontmatter: false,
        }}
      />
    </div>
  );
}
