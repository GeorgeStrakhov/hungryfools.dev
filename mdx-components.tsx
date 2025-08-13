import type { MDXComponents } from 'mdx/types'

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({ children }) => <h1 className="text-4xl font-bold mb-6">{children}</h1>,
    h2: ({ children }) => <h2 className="text-3xl font-semibold mb-4 mt-8">{children}</h2>,
    h3: ({ children }) => <h3 className="text-2xl font-semibold mb-3 mt-6">{children}</h3>,
    p: ({ children }) => <p className="mb-4 leading-relaxed">{children}</p>,
    ul: ({ children }) => <ul className="list-disc list-inside mb-4 space-y-1">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal list-inside mb-4 space-y-1">{children}</ol>,
    li: ({ children }) => <li className="ml-4">{children}</li>,
    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
    ...components,
  }
}