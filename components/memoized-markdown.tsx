"use client";

import type React from "react";

import { marked } from "marked";
import { memo, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";

function parseMarkdownIntoBlocks(markdown: string): string[] {
  const tokens = marked.lexer(markdown);
  return tokens.map((token) => token.raw);
}

// Component mapping to detect React component patterns
const isReactComponent = (code: string) => {
  return (
    /\bfunction\s+[A-Z][A-Za-z0-9]*\s*\(/i.test(code) ||
    /\bconst\s+[A-Z][A-Za-z0-9]*\s*=\s*$$[^)]*$$\s*=>/i.test(code) ||
    /\bclass\s+[A-Z][A-Za-z0-9]*\s+extends\s+React/i.test(code) ||
    /\b(import|export)\s+.*React/i.test(code) ||
    /\bJSX\b/.test(code) ||
    (/\breturn\s+\(/i.test(code) && /<[A-Za-z]/.test(code))
  );
};

// Function to enhance language detection
const enhanceLanguageDetection = (
  language: string | null,
  content: string
): string => {
  if (
    language === "tsx" ||
    language === "jsx" ||
    language === "js" ||
    language === "ts"
  ) {
    if (isReactComponent(content)) {
      return language === "tsx" || language === "ts" ? "tsx" : "jsx";
    }
  }
  return language || "";
};

// Define proper types for the code component
type CodeProps = {
  node: any;
  className?: string;
  children: React.ReactNode;
  inline?: boolean;
  [key: string]: any;
};

const MemoizedMarkdownBlock = memo(
  ({ content }: { content: string }) => {
    return (
      <ReactMarkdown
        components={{
          code: ({ node, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || "");
            const codeContent = String(children).replace(/\n$/, "");

            if (match) {
              // Get the language from the className
              const language = match[1];

              // Enhance language detection
              const enhancedLanguage = enhanceLanguageDetection(
                language,
                codeContent
              );

              return (
                <SyntaxHighlighter
                  style={vscDarkPlus}
                  language={enhancedLanguage}
                  PreTag="div"
                  customStyle={{
                    margin: 0,
                    borderRadius: "4px",
                    backgroundColor: "transparent",
                    fontSize: "0.9rem",
                  }}
                >
                  {codeContent}
                </SyntaxHighlighter>
              );
            }

            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    );
  },
  (prevProps, nextProps) => {
    // Only re-render if content changed
    return prevProps.content === nextProps.content;
  }
);

MemoizedMarkdownBlock.displayName = "MemoizedMarkdownBlock";

export const MemoizedMarkdown = memo(
  ({ content, id }: { content: string; id: string }) => {
    const blocks = useMemo(() => parseMarkdownIntoBlocks(content), [content]);

    return blocks.map((block, index) => (
      <MemoizedMarkdownBlock content={block} key={`${id}-block_${index}`} />
    ));
  }
);

MemoizedMarkdown.displayName = "MemoizedMarkdown";

// Helper function to convert code to markdown with proper language
export function codeToMarkdown(code: string, language = ""): string {
  return `\`\`\`${language}\n${code}\n\`\`\``;
}
