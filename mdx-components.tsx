import type { MDXComponents } from "mdx/types";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({ children }) => (
      <h1 className="mb-6 text-4xl font-bold">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="mt-8 mb-4 text-3xl font-semibold">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="mt-6 mb-3 text-2xl font-semibold">{children}</h3>
    ),
    p: ({ children }) => <p className="mb-4 leading-relaxed">{children}</p>,
    ul: ({ children }) => (
      <ul className="mb-4 list-inside list-disc space-y-1">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="mb-4 list-inside list-decimal space-y-1">{children}</ol>
    ),
    li: ({ children }) => <li className="ml-4">{children}</li>,
    strong: ({ children }) => (
      <strong className="font-semibold">{children}</strong>
    ),
    ...components,
  };
}
