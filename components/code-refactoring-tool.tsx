"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Code, Copy, Check, RefreshCw, Folder } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { refactorCodeAction } from "@/lib/actions";
import { toast } from "sonner";
import { readStreamableValue } from "ai/rsc";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MemoizedMarkdown,
  codeToMarkdown,
} from "@/components/memoized-markdown";

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
  const codeViewerRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef<number>(0);

  // Save scroll position when typing or updating content
  useEffect(() => {
    if (codeViewerRef.current) {
      scrollPositionRef.current = codeViewerRef.current.scrollTop;
    }
  }, [typingContent, currentFileContent]);

  // Restore scroll position after update
  useEffect(() => {
    if (codeViewerRef.current && scrollPositionRef.current > 0) {
      codeViewerRef.current.scrollTop = scrollPositionRef.current;
    }
  }, [typingContent, currentFileContent]);

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

  // Better content updating strategy to avoid jumps
  const updateFileContent = (newFile: { name: string; content: string }) => {
    setRefactoredFiles((prev) => {
      // Check if file already exists
      const fileExists = prev.some((file) => file.name === newFile.name);

      if (fileExists) {
        // Update existing file
        return prev.map((file) =>
          file.name === newFile.name
            ? { ...file, content: newFile.content }
            : file
        );
      } else {
        // Add new file
        return [...prev, newFile];
      }
    });
  };

  // Reset typing when active file changes
  useEffect(() => {
    if (activeFile) {
      const currentFile = refactoredFiles.find((f) => f.name === activeFile);
      if (currentFile) {
        // Save scroll position before content change
        if (codeViewerRef.current) {
          scrollPositionRef.current = codeViewerRef.current.scrollTop;
        }

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
    scrollPositionRef.current = 0;

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
            // Use stable update to prevent jumps
            partialObject.files.forEach(
              (file: { name: string; content: string }) => {
                updateFileContent(file);
              }
            );
            break;

          case "step_finish":
            console.log("Step finished:", partialObject.reason);
            break;

          case "result":
            if (partialObject.files && partialObject.files.length > 0) {
              // Process each file individually to avoid jumps
              partialObject.files.forEach(
                (file: { name: string; content: string }) => {
                  updateFileContent(file);
                }
              );

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

  // Get file extension for syntax highlighting class
  const getFileExtension = (filename: string) => {
    const parts = filename.split(".");
    return parts.length > 1 ? parts.pop()?.toLowerCase() : "txt";
  };

  // Group files by folder structure
  const groupFilesByFolder = () => {
    const groups: Record<string, string[]> = {};

    createdFiles.forEach((file) => {
      const parts = file.split("/");
      const folder = parts.length > 1 ? parts[0] : "root";

      if (!groups[folder]) {
        groups[folder] = [];
      }

      groups[folder].push(file);
    });

    return groups;
  };

  const fileGroups = groupFilesByFolder();

  // Get current file content as markdown with proper language
  const getCurrentFileMarkdown = () => {
    if (!activeFile) return "";

    const currentFile = refactoredFiles.find((f) => f.name === activeFile);
    if (!currentFile) return "";

    const content = isRefactoring ? typingContent : currentFile.content;
    // Auto-detect language based on file extension and content
    const ext = getFileExtension(activeFile);

    // Use specific React-related language identifiers for better highlighting
    let language = ext;
    if (
      (ext === "js" || ext === "jsx" || ext === "tsx" || ext === "ts") &&
      /import.*React|React.Component|function\s+[A-Z]|const\s+[A-Z].*=>|<[A-Z][A-Za-z]*>/.test(
        content
      )
    ) {
      language = ext === "ts" || ext === "tsx" ? "tsx" : "jsx";
    }

    return codeToMarkdown(content, language);
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            Code Refactoring Tool
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs defaultValue="input" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="input">Input Code</TabsTrigger>
              <TabsTrigger value="instructions">Instructions</TabsTrigger>
            </TabsList>
            <TabsContent value="input">
              <Textarea
                placeholder="Paste your code here..."
                className="min-h-[300px] max-h-[300px] overflow-y-scroll font-mono text-sm bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                disabled={isRefactoring}
              />
            </TabsContent>
            <TabsContent value="instructions">
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-md min-h-[300px] max-h-[300px] overflow-y-auto">
                <h3 className="font-medium mb-2">How to use:</h3>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Paste your code in the input tab</li>
                  <li>Click "Refactor Code" to start the process</li>
                  <li>View the refactored files in the file explorer</li>
                  <li>Click on any file to view its content</li>
                  <li>Use the copy button to copy the code to clipboard</li>
                </ol>
              </div>
            </TabsContent>
          </Tabs>
          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {isRefactoring && (
                <div className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                  Processing... {processingTime > 0 && `(${processingTime}s)`}
                </div>
              )}
            </div>
            <Button
              onClick={handleRefactor}
              disabled={isRefactoring || !inputCode.trim()}
              className="relative overflow-hidden group"
            >
              {isRefactoring ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Refactoring...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 transition-transform group-hover:rotate-90" />
                  Refactor Code
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {(isRefactoring || refactoredFiles.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* File Explorer */}
          <Card className="lg:col-span-1 border-primary/20 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Folder className="h-4 w-4 text-primary" />
                File Explorer
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {Object.entries(fileGroups).map(([folder, files]) => (
                    <div key={folder} className="space-y-1">
                      {folder !== "root" && (
                        <div className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-muted-foreground uppercase">
                          <Folder className="h-3 w-3" />
                          {folder}
                        </div>
                      )}
                      <div className="space-y-1 pl-2">
                        {files.map((fileName) => {
                          const ext = getFileExtension(fileName);
                          return (
                            <Button
                              key={fileName}
                              variant="ghost"
                              className={cn(
                                "w-full justify-start text-sm font-medium rounded-md transition-all",
                                activeFile === fileName
                                  ? "bg-primary/10 text-primary font-medium"
                                  : "hover:bg-primary/5"
                              )}
                              onClick={() => setActiveFile(fileName)}
                            >
                              <div className="flex items-center gap-2 w-full overflow-hidden">
                                <Code className="h-3.5 w-3.5 flex-shrink-0" />
                                <span className="truncate">
                                  {fileName.split("/").pop()}
                                </span>
                                <Badge
                                  variant="outline"
                                  className="ml-auto text-[10px] px-1 py-0 h-4 bg-slate-100 dark:bg-slate-800"
                                >
                                  {ext}
                                </Badge>
                              </div>
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="mt-4 text-xs text-muted-foreground border-t pt-2">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "h-2 w-2 rounded-full",
                      isRefactoring ? "bg-amber-500" : "bg-emerald-500"
                    )}
                  ></div>
                  <span>{streamStatus}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Code Viewer with Memoized Markdown */}
          <Card className="lg:col-span-3 w-full border-primary/20 shadow-md">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Code className="h-4 w-4 text-primary" />
                  {activeFile ? (
                    <div className="flex items-center gap-2">
                      <span>{activeFile}</span>
                      <Badge variant="outline" className="ml-1">
                        {getFileExtension(activeFile || "")}
                      </Badge>
                    </div>
                  ) : (
                    "Code Viewer"
                  )}
                </CardTitle>
                {activeFile && refactoredFiles.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyActiveFile}
                    className="flex items-center gap-1 transition-all"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-green-500" />
                        <span className="text-green-500">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        Copy
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="relative rounded-md overflow-hidden border">
                <div className="absolute top-0 left-0 right-0 h-8 bg-slate-100 dark:bg-slate-800 border-b flex items-center px-4 z-10">
                  <div className="flex space-x-2">
                    <div className="h-3 w-3 rounded-full bg-red-500"></div>
                    <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                    <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  </div>
                </div>
                <div
                  ref={codeViewerRef}
                  className="pt-8 h-[400px] overflow-y-auto bg-slate-950 text-slate-50"
                >
                  {activeFile ? (
                    <div className="px-4 py-2 min-h-[calc(400px-2rem)]">
                      <MemoizedMarkdown
                        id={activeFile}
                        content={getCurrentFileMarkdown()}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-400">
                      <p>Select a file to view its content</p>
                    </div>
                  )}
                </div>
                {isRefactoring && !typingContent && activeFile && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-950/50 z-20">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-sm text-slate-300">
                        Generating code...
                      </p>
                    </div>
                  </div>
                )}
              </div>
              {activeFile && !isRefactoring && (
                <div className="mt-2 text-xs text-muted-foreground">
                  <span>
                    Line count:{" "}
                    {(
                      refactoredFiles
                        .find((f) => f.name === activeFile)
                        ?.content.split("\n").length || 0
                    ).toLocaleString()}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
