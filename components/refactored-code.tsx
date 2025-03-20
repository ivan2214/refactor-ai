"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { toast } from "sonner";

interface RefactoredCodeProps {
  files: { name: string; content: string }[];
}

export function RefactoredCode({ files }: RefactoredCodeProps) {
  const [activeFile, setActiveFile] = useState(files[0]?.name || "");

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast("Copied to clipboard", {
      description: "The code has been copied to your clipboard",
      duration: 3000,
    });
  };

  return (
    <Card>
      <CardContent className="p-6">
        <Tabs value={activeFile} onValueChange={setActiveFile}>
          <div className="flex items-center justify-between mb-4">
            <TabsList className="h-9 overflow-x-auto whitespace-nowrap">
              {files.map((file) => (
                <TabsTrigger
                  key={file.name}
                  value={file.name}
                  className="px-3 py-1.5 text-xs"
                >
                  {file.name}
                </TabsTrigger>
              ))}
            </TabsList>
            <Button
              variant="outline"
              size="sm"
              className="ml-2"
              onClick={() => {
                const currentFile = files.find((f) => f.name === activeFile);
                if (currentFile) {
                  copyToClipboard(currentFile.content);
                }
              }}
            >
              <Copy className="h-3.5 w-3.5 mr-1.5" />
              Copy
            </Button>
          </div>
          {files.map((file) => (
            <TabsContent key={file.name} value={file.name} className="mt-0">
              <div className="relative">
                <pre className="p-4 rounded-md bg-slate-950 text-slate-50 overflow-x-auto text-sm font-mono">
                  <code>{file.content}</code>
                </pre>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
