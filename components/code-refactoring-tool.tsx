"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Code, FileText, Copy, Check } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { refactorCodeAction } from "@/lib/actions";
import { toast } from "sonner";
import { readStreamableValue } from "ai/rsc";

export function CodeRefactoringTool() {
  const [inputCode, setInputCode] = useState("");
  const [isRefactoring, setIsRefactoring] = useState(false);
  const [refactoredFiles, setRefactoredFiles] = useState<
    { name: string; content: string }[]
  >([]);
  const [streamStatus, setStreamStatus] = useState("");
  const [createdFiles, setCreatedFiles] = useState<string[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [typingContent, setTypingContent] = useState("");
  const [typingIndex, setTypingIndex] = useState(0);
  const [currentFileContent, setCurrentFileContent] = useState("");
  const [receivedChunks, setReceivedChunks] = useState(false);
  const [processingTime, setProcessingTime] = useState(0);
  const [copied, setCopied] = useState(false);

  const processingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Typing effect for the active file
  useEffect(() => {
    if (!activeFile || !isRefactoring) return;

    const currentFile = refactoredFiles.find((f) => f.name === activeFile);
    if (!currentFile) return;

    if (typingIndex < currentFile.content.length) {
      const timer = setTimeout(() => {
        setTypingContent(
          (prev) => prev + currentFile.content.charAt(typingIndex)
        );
        setTypingIndex((prev) => prev + 1);
      }, 5); // Adjust speed as needed

      return () => clearTimeout(timer);
    }
  }, [activeFile, typingIndex, refactoredFiles, isRefactoring]);

  // Reset typing when active file changes
  useEffect(() => {
    if (activeFile) {
      const currentFile = refactoredFiles.find((f) => f.name === activeFile);
      if (currentFile) {
        setCurrentFileContent(currentFile.content);
        setTypingContent("");
        setTypingIndex(0);
      }
    }
  }, [activeFile, refactoredFiles]);

  // Processing timer
  useEffect(() => {
    if (isRefactoring) {
      startTimeRef.current = Date.now();
      processingTimerRef.current = setInterval(() => {
        const elapsedSeconds = Math.floor(
          (Date.now() - startTimeRef.current) / 1000
        );
        setProcessingTime(elapsedSeconds);
      }, 1000);
    } else if (processingTimerRef.current) {
      clearInterval(processingTimerRef.current);
      processingTimerRef.current = null;
    }

    return () => {
      if (processingTimerRef.current) {
        clearInterval(processingTimerRef.current);
      }
    };
  }, [isRefactoring]);

  // Add a timeout to detect if we're stuck
  useEffect(() => {
    if (isRefactoring && !receivedChunks) {
      const timeout = setTimeout(() => {
        if (!receivedChunks) {
          setStreamStatus(`Still working... (${processingTime}s)`);
        }
      }, 5000); // 5 seconds

      return () => clearTimeout(timeout);
    }
  }, [isRefactoring, receivedChunks, processingTime]);

  const handleRefactor = async () => {
    if (!inputCode.trim()) return;

    setIsRefactoring(true);
    setRefactoredFiles([]);
    setCreatedFiles([]);
    setActiveFile(null);
    setTypingContent("");
    setTypingIndex(0);
    setStreamStatus("Starting refactoring process...");
    setReceivedChunks(false);
    setProcessingTime(0);

    try {
      console.log("Calling server action...");

      // Call the server action to get a stream of partialObjects
      const { object } = await refactorCodeAction(inputCode);

      // Process the stream of partialObjects
      for await (const partialObject of readStreamableValue(object)) {
        console.log("Received partialObject:", partialObject.type);
        setReceivedChunks(true);

        switch (partialObject.type) {
          case "status":
            setStreamStatus(partialObject.message);
            break;

          case "chunk":
            // Just log that we received a chunk
            console.log("Received text chunk");
            break;

          case "file_created":
            console.log("File created:", partialObject.fileName);
            setCreatedFiles((prev) => {
              if (!prev.includes(partialObject.fileName)) {
                return [...prev, partialObject.fileName];
              }
              return prev;
            });
            if (!activeFile) {
              setActiveFile(partialObject.fileName);
            }
            break;

          case "content_update":
            console.log(
              "Content updated:",
              partialObject.files.length,
              "files"
            );
            setRefactoredFiles(partialObject.files);
            break;

          case "step_finish":
            console.log("Step finished:", partialObject.reason);
            break;

          case "result":
            if (partialObject.files && partialObject.files.length > 0) {
              setRefactoredFiles(partialObject.files);

              // Ensure all files are in the created files list
              const newFileNames = partialObject.files.map(
                (f: { name: string; content: string }) => f.name
              );
              setCreatedFiles((prev) => {
                const uniqueFiles = [...new Set([...prev, ...newFileNames])];
                return uniqueFiles;
              });

              // Set active file if none is set
              if (!activeFile && newFileNames.length > 0) {
                setActiveFile(newFileNames[0]);
              }
            }
            break;

          case "error":
            throw new Error(partialObject.message);

          default:
            // Ignore other partialObject types
            break;
        }
      }

      setStreamStatus("Refactoring complete!");
      toast.success("Refactoring complete", {
        description: "Your code has been successfully refactored",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error refactoring code:", error);
      setStreamStatus(
        `Error occurred: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      toast.error("Error", {
        description: `Failed to refactor code: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        duration: 5000,
      });
    } finally {
      setIsRefactoring(false);
    }
  };

  const copyActiveFile = () => {
    if (!activeFile) return;

    const currentFile = refactoredFiles.find((f) => f.name === activeFile);
    if (currentFile) {
      navigator.clipboard.writeText(currentFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Copied to clipboard", {
        duration: 1500,
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">Code Refactoring Tool</h2>
          <Textarea
            placeholder="Paste your code here..."
            className="min-h-[300px] max-h-[300px] overflow-y-scroll font-mono text-sm"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            disabled={isRefactoring}
          />
          <div className="mt-4 flex justify-end">
            <Button
              onClick={handleRefactor}
              disabled={isRefactoring || !inputCode.trim()}
            >
              {isRefactoring && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isRefactoring ? "Refactoring..." : "Refactor Code"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {(isRefactoring || refactoredFiles.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* File List */}
          <Card className="lg:col-span-1">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-4 w-4" />
                <h3 className="font-medium">Files</h3>
              </div>
              <ScrollArea className="h-[400px]">
                <div className="space-y-1">
                  {createdFiles.map((fileName) => (
                    <Button
                      key={fileName}
                      variant="ghost"
                      className={cn(
                        "w-full justify-start text-sm font-medium",
                        activeFile === fileName &&
                          "bg-accent text-accent-foreground"
                      )}
                      onClick={() => setActiveFile(fileName)}
                    >
                      {fileName}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
              <div className="mt-4 text-xs text-muted-foreground">
                {streamStatus}
                {isRefactoring && processingTime > 0 && (
                  <span className="ml-2">({processingTime}s)</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* File Content */}
          <Card className="lg:col-span-3 w-full">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  <h3 className="font-medium">
                    {activeFile ? activeFile : "Code"}
                  </h3>
                </div>
                {activeFile && refactoredFiles.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyActiveFile}
                    className="flex items-center gap-1"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                )}
              </div>
              <div className="relative">
                <pre className="p-4 rounded-md bg-slate-950 text-slate-50 overflow-x-auto text-sm font-mono h-[400px] overflow-y-auto">
                  <code>
                    {isRefactoring
                      ? typingContent
                      : activeFile
                      ? refactoredFiles.find((f) => f.name === activeFile)
                          ?.content || ""
                      : "Select a file to view its content"}
                  </code>
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
