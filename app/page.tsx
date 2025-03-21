"use client";

import { useState, useEffect } from "react";
import { RefactoredCode } from "@/lib/types";
import { CodeEditor } from "@/components/code-editor";
import { AppSidebar, Tree } from "@/components/app-sidebar";

import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { Copy, Moon, Redo, Sun, Undo } from "lucide-react";
import { toast } from "sonner";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { refactor } from "@/actions/refactor";
import { readStreamableValue } from "ai/rsc";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const maxDuration = 30;

export default function Home() {
  const [code, setCode] = useState("");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [refactoredCode, setRefactoredCode] = useState<RefactoredCode | null>(
    null
  );
  const { theme, setTheme } = useTheme();
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingFile, setStreamingFile] = useState<string | null>(null);

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

  const detectedFileType = (code: string): string => {
    // Check for common patterns in the code
    if (code.includes("<?php")) {
      return "php";
    }
    if (
      code.includes("import React") ||
      code.includes("export default") ||
      code.includes("jsx") ||
      code.includes("tsx")
    ) {
      return code.includes("typescript") || code.includes(":") ? "tsx" : "jsx";
    }
    if (
      code.includes("function") ||
      code.includes("=>") ||
      code.includes("const ") ||
      code.includes("let ")
    ) {
      return code.includes("typescript") || code.includes(":") ? "ts" : "js";
    }
    if (
      (code.includes("class ") && code.includes("public ")) ||
      code.includes("private ")
    ) {
      return "java";
    }
    if (code.includes("#include") || code.includes("int main")) {
      return "cpp";
    }
    if (
      code.includes("def ") ||
      (code.includes("import ") && !code.includes('from "react"'))
    ) {
      return "py";
    }
    if (code.includes("<!DOCTYPE html") || code.includes("<html")) {
      return "html";
    }
    if (
      code.includes("@media") ||
      (code.includes("{") && code.includes("}") && code.includes(":"))
    ) {
      return "css";
    }

    // Default to plaintext if no specific type is detected
    return "txt";
  };

  const parsedFilesName = (refactoredCode: RefactoredCode | null): Tree => {
    if (!refactoredCode?.files) return [];

    const fileTree: Record<string, any> = {};

    // Construcción de la estructura jerárquica
    refactoredCode.files?.forEach((file) => {
      const parts = file.path?.replace(/^\.\//, "").split("/");
      let current = fileTree;

      parts?.forEach((part, index) => {
        if (index === parts?.length - 1) {
          // Es un archivo
          if (!current.files) current.files = [];
          current.files.push(part);
        } else {
          // Es un directorio
          if (!current[part]) {
            current[part] = { files: [] };
          }
          current = current[part];
        }
      });
    });

    // Función recursiva para convertir el objeto en el formato `Tree`
    const convertToArray = (obj: Record<string, any>): Tree => {
      const result: Tree = [];

      Object.keys(obj)?.forEach((key) => {
        if (key !== "files") {
          const subTree = convertToArray(obj[key]);
          result.push([key, ...subTree]);
        }
      });

      if (obj.files?.length > 0) {
        result.push(...obj.files);
      }

      return result;
    };

    return convertToArray(fileTree);
  };

  console.log("refactoredCode", parsedFilesName(refactoredCode));

  const getCurrentFile = () => {
    const file = refactoredCode?.files?.find(
      (file) => file.path === selectedFile
    );
    console.log("getCurrentFile", file);

    if (!refactoredCode || !selectedFile) return null;
    return file;
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
      </header>

      <main className="container mx-auto px-4 py-8">
        <section className="flex flex-col gap-4">
          <Card className="h-full p-4 bg-muted/10 rounded-lg">
            <CardHeader className="flex bg-background  z-10 sticky top-5 items-center gap-4 mb-6">
              <h2 className="text-lg font-semibold mb-2">Original Code</h2>
              <Button
                className="cursor-pointer"
                onClick={handleRefactor}
                disabled={isLoading}
              >
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
            </CardHeader>
            <CardContent>
              <CodeEditor
                code={code}
                onChange={handleCodeChange}
                fileType={detectedFileType(code)}
              />
            </CardContent>
          </Card>

          <Card className="h-full p-4 bg-muted/10 rounded-lg">
            <CardContent>
              <SidebarProvider>
                <AppSidebar
                  collapsible="none"
                  tree={parsedFilesName(refactoredCode) as string[]}
                  /* tree={[
                  [
                    "src",
                    [
                      "components",
                      "TodoList.tsx",
                      "TaskInput.tsx",
                      "TodoApp.tsx",
                    ],
                  ],
                ]} */
                />
                <SidebarInset>
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
                          fileType={detectedFileType(
                            getCurrentFile()?.content || ""
                          )}
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
                </SidebarInset>
              </SidebarProvider>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
