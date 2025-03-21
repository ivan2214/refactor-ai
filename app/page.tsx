"use client";

import { useState, useEffect } from "react";
import { FileType, RefactoredCode, TreeNode } from "@/lib/types";
import { CodeEditor } from "@/components/code-editor";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "next-themes";
import { Moon, Sun, Copy, Undo, Redo } from "lucide-react";
import { toast } from "sonner";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { refactor } from "../actions/refactor";
import { readStreamableValue } from "ai/rsc";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export const maxDuration = 30;

export default function Home() {
  const [code, setCode] = useState("");
  const [fileType, setFileType] = useState<FileType>("ts");
  const [refactoredCode, setRefactoredCode] = useState<RefactoredCode | null>(
    null
  );
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [streamingFile, setStreamingFile] = useState<string | null>(null);
  const { theme, setTheme } = useTheme();
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (refactoredCode && refactoredCode.tree.length > 0 && !selectedFile) {
      setSelectedFile(extractFirstFilePath(refactoredCode.tree));
    }
  }, [refactoredCode?.tree, selectedFile]);

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    setHistory((prev) => [...prev.slice(0, historyIndex + 1), newCode]);
    setHistoryIndex((prev) => prev + 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex((prev) => prev - 1);
      setCode(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex((prev) => prev + 1);
      setCode(history[historyIndex + 1]);
    }
  };

  const handleRefactor = async () => {
    if (!code.trim()) {
      toast.error("Please enter some code to refactor");
      return;
    }
    setIsLoading(true);
    setRefactoredCode(null);
    setSelectedFile(null);

    try {
      const { object } = await refactor(code);
      if (!object) {
        toast.error("Failed to refactor code");
        return;
      }

      console.log("Object:", object);

      let firstFile = true;

      for await (const partialObject of readStreamableValue(object)) {
        console.log("Partial object:", partialObject);

        if (partialObject) {
          setRefactoredCode(partialObject);

          if (firstFile && partialObject.tree?.length) {
            console.log(
              "Extracted first file:",
              extractFirstFilePath(partialObject.tree)
            );

            setSelectedFile(extractFirstFilePath(partialObject.tree));
            setStreamingFile(extractFirstFilePath(partialObject.tree));
            firstFile = false;
          }
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to refactor code");
    } finally {
      setIsLoading(false);
      setStreamingFile(null);
    }
  };

  const extractFirstFilePath = (tree: TreeNode[]): string | null => {
    for (const item of tree) {
      if (typeof item === "string") return item;
      if (Array.isArray(item)) {
        const nested = extractFirstFilePath(item[1]);
        if (nested) return `${item[0]}/${nested}`;
      }
    }
    return null;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">AI Code Refactoring Tool</h1>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button onClick={handleRefactor} disabled={isLoading}>
            {isLoading ? "Refactoring..." : "Refactor Code"}
          </Button>
          <Button
            variant="outline"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>

        <div className="h-full p-4 bg-muted/10 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">Original Code</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => copyToClipboard(code)}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <CodeEditor
            code={code}
            onChange={handleCodeChange}
            fileType={fileType}
          />
        </div>

        <ResizablePanelGroup direction="horizontal" className="min-h-[600px]">
          {refactoredCode && (
            <SidebarProvider className="items-start">
              <ResizablePanel defaultSize={30}>
                <AppSidebar
                  tree={
                    refactoredCode?.tree as (
                      | string
                      | (string | (string | string[])[])[]
                    )[]
                  }
                  className="h-full"
                />
              </ResizablePanel>
              <SidebarInset>
                <ResizableHandle />

                <ResizablePanel defaultSize={70}>
                  <div className="h-full p-4 bg-muted/10 rounded-lg">
                    <h2 className="text-lg font-semibold mb-2">
                      Refactored Code
                    </h2>
                    {selectedFile ? (
                      <CodeEditor
                        code={selectedFile}
                        onChange={() => {}}
                        fileType={fileType}
                        readOnly
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        Refactored code will appear here
                      </div>
                    )}
                  </div>
                </ResizablePanel>
              </SidebarInset>
            </SidebarProvider>
          )}
        </ResizablePanelGroup>
      </main>
    </div>
  );
}
