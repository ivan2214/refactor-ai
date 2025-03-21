"use client";

import { useState } from "react";
import { RefactoredCode } from "@/lib/types";
import { CodeEditor } from "@/components/code-editor";
import { AppSidebar, Tree } from "@/components/app-sidebar";

import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { toast } from "sonner";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { refactor } from "@/actions/refactor";
import { readStreamableValue } from "ai/rsc";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export const maxDuration = 30;

export default function Home() {
  const [code, setCode] = useState("");

  const [refactoredCode, setRefactoredCode] = useState<RefactoredCode | null>(
    null
  );
  const { theme, setTheme } = useTheme();

  const [isLoading, setIsLoading] = useState(false);

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
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
      for await (const partialObject of readStreamableValue(object)) {
        if (partialObject) {
          setRefactoredCode(partialObject);
        }
      }
    } catch (error) {
      toast.error("Failed to refactor code");
    } finally {
      setIsLoading(false);
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
        <div className="flex items-center gap-4 mb-6">
          <Button onClick={handleRefactor} disabled={isLoading}>
            {isLoading ? "Refactoring..." : "Refactor Code"}
          </Button>
        </div>

        <ResizablePanelGroup direction="horizontal" className="min-h-[600px]">
          <SidebarProvider>
            <SidebarInset>
              <ResizableHandle />

              <ResizablePanel defaultSize={70}>
                <div className="h-full p-4 bg-muted/10 rounded-lg">
                  <h2 className="text-lg font-semibold mb-2">Original Code</h2>
                  <CodeEditor
                    code={code}
                    onChange={handleCodeChange}
                    fileType={detectedFileType(code)}
                  />
                </div>
              </ResizablePanel>
            </SidebarInset>
            <ResizablePanel defaultSize={30}>
              <AppSidebar
                side="right"
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
            </ResizablePanel>
          </SidebarProvider>
        </ResizablePanelGroup>
      </main>
    </div>
  );
}
