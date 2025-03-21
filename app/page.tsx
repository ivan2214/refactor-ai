"use client";

import { useState, useEffect } from "react";
import { FileType, RefactoredCode } from "@/lib/types";
import { CodeEditor } from "@/components/code-editor";
import { FileExplorer } from "@/components/file-explorer";
import { FileTypeSelector } from "@/components/file-type-selector";
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
import { refactor } from "./action";
import { readStreamableValue } from "ai/rsc";

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
    if (refactoredCode && refactoredCode?.files?.length > 0 && !selectedFile) {
      setSelectedFile(refactoredCode?.files[0].path);
    }
  }, [refactoredCode?.files, selectedFile]);

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
      let firstFile = true;

      for await (const partialObject of readStreamableValue(object)) {
        if (partialObject) {
          setRefactoredCode(partialObject);

          if (firstFile && partialObject.files?.[0]?.path) {
            setSelectedFile(partialObject.files[0].path);
            setStreamingFile(partialObject.files[0].path);
            firstFile = false;
          }
        }
      }
    } catch (error) {
      toast.error("Failed to refactor code");
    } finally {
      setIsLoading(false);
      setStreamingFile(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const getCurrentFile = () => {
    const file = refactoredCode?.files?.find(
      (file) => file.path === selectedFile
    );
    console.log("getCurrentFile", file);

    if (!refactoredCode || !selectedFile) return null;
    return file;
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
          <FileTypeSelector value={fileType} onChange={setFileType} />
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

        <ResizablePanelGroup direction="horizontal" className="min-h-[600px]">
          <ResizablePanel defaultSize={50}>
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
          </ResizablePanel>

          <ResizableHandle />

          <ResizablePanel defaultSize={50}>
            <div className="h-full flex">
              {refactoredCode && refactoredCode?.files?.length > 0 && (
                <FileExplorer
                  files={refactoredCode?.files}
                  selectedFile={selectedFile}
                  onSelectFile={setSelectedFile}
                  streamingFile={streamingFile}
                />
              )}
              <div className="flex-1 p-4 bg-muted/10">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-semibold">Refactored Code</h2>
                  {getCurrentFile() && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        copyToClipboard(getCurrentFile()?.content || "")
                      }
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {getCurrentFile() ? (
                  <>
                    <CodeEditor
                      code={getCurrentFile()?.content || ""}
                      onChange={() => {}}
                      fileType={fileType}
                      readOnly
                      autoScroll={streamingFile === selectedFile}
                    />
                    <Separator className="my-4" />
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold mb-2">Summary</h3>
                        <p className="text-sm text-muted-foreground">
                          {refactoredCode?.summary}
                        </p>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">
                          Performance Impact
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {refactoredCode?.performanceImpact}
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Refactored code will appear here
                  </div>
                )}
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>
    </div>
  );
}
