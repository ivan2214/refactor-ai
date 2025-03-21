"use client";

import React from "react";
import { Folder, File, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { RefactoredFile } from "@/lib/types";

interface FileExplorerProps {
  files: RefactoredFile[];
  selectedFile: string | null;
  onSelectFile: (path: string) => void;
  streamingFile: string | null;
}

function buildFileTree(files: RefactoredFile[]) {
  const tree: Record<string, any> = {};
  files.forEach((file) => {
    const parts = file.path ? file.path.split("/") : [];
    let current = tree;
    parts.forEach((part, index) => {
      if (!current[part]) {
        current[part] = index === parts.length - 1 ? file : {};
      }
      current = current[part];
    });
  });
  return tree;
}

function renderTree(
  tree: Record<string, any>,
  onSelectFile: (path: string) => void,
  selectedFile: string | null,
  streamingFile: string | null,
  path = ""
) {
  return Object.entries(tree).map(([key, value]) => {
    const fullPath = path ? `${path}/${key}` : key;
    if (typeof value === "object" && !("content" in value)) {
      return (
        <div key={fullPath} className="ml-2">
          <div className="flex items-center gap-2 font-semibold">
            <Folder className="h-4 w-4" />
            {key}
          </div>
          <div className="ml-4">
            {renderTree(
              value,
              onSelectFile,
              selectedFile,
              streamingFile,
              fullPath
            )}
          </div>
        </div>
      );
    }
    return (
      <button
        key={fullPath}
        onClick={() => onSelectFile(fullPath)}
        className={cn(
          "w-full flex items-center gap-2 px-2 py-1 rounded-md text-sm hover:bg-muted/20 transition-colors",
          selectedFile === fullPath && "bg-muted/30"
        )}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <File className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">{key}</span>
        </div>
        {streamingFile === fullPath && (
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        )}
      </button>
    );
  });
}

export function FileExplorer({
  files,
  selectedFile,
  onSelectFile,
  streamingFile,
}: FileExplorerProps) {
  const fileTree = buildFileTree(files);
  return (
    <div className="w-64 h-full border-r bg-muted/5 p-2">
      <h3 className="font-semibold mb-2 px-2">Files</h3>
      <div className="space-y-1">
        {renderTree(fileTree, onSelectFile, selectedFile, streamingFile)}
      </div>
    </div>
  );
}
