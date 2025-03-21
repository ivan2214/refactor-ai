"use client";

import React from "react";
import { File } from "lucide-react";
import { cn } from "@/lib/utils";
import { RefactoredFile } from "@/lib/types";

interface FileExplorerProps {
  files: RefactoredFile[];
  selectedFile: string | null;
  onSelectFile: (path: string) => void;
}

export function FileExplorer({
  files,
  selectedFile,
  onSelectFile,
}: FileExplorerProps) {
  return (
    <div className="w-64 h-full border-r bg-muted/5 p-2">
      <h3 className="font-semibold mb-2 px-2">Files</h3>
      <div className="space-y-1">
        {files.map((file) => (
          <button
            key={file.name}
            onClick={() => onSelectFile(file.path)}
            className={cn(
              "w-full flex items-center gap-2 px-2 py-1 rounded-md text-sm hover:bg-muted/20 transition-colors",
              selectedFile === file.path && "bg-muted/30"
            )}
          >
            <File className="h-4 w-4" />
            <span className="truncate">{file.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
