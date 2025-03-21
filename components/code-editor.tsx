"use client";

import React, { useEffect, useRef } from "react";
import Editor from "react-simple-code-editor";
import Prism from "prismjs";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import { FileType } from "@/lib/types";

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
  fileType: FileType;
  readOnly?: boolean;
  autoScroll?: boolean;
}

export function CodeEditor({
  code,
  onChange,
  fileType,
  readOnly = false,
  autoScroll = false,
}: CodeEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  const highlight = (code: string) => {
    return Prism.highlight(code, Prism.languages[fileType], fileType);
  };

  useEffect(() => {
    if (autoScroll && editorRef.current) {
      const element = editorRef.current;
      element.scrollTop = element.scrollHeight;
    }
  }, [code, autoScroll]);

  return (
    <div
      ref={editorRef}
      className="w-full h-full min-h-[400px] rounded-md border bg-background overflow-auto"
    >
      <Editor
        name="code"
        id="code"
        value={code}
        onValueChange={readOnly ? () => {} : onChange}
        highlight={highlight}
        padding={16}
        readOnly={readOnly}
        style={{
          fontFamily: '"Fira code", "Fira Mono", monospace',
          fontSize: 14,
          height: "100%",
          minHeight: "400px",
        }}
        className="min-h-[400px] focus:outline-none"
      />
    </div>
  );
}
