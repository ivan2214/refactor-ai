"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { RefactoredCode } from "@/components/refactored-code";
import { refactorCode } from "@/lib/refactor-code";

export function CodeRefactoringTool() {
  const [inputCode, setInputCode] = useState("");
  const [isRefactoring, setIsRefactoring] = useState(false);
  const [refactoredFiles, setRefactoredFiles] = useState<
    { name: string; content: string }[]
  >([]);

  const handleRefactor = async () => {
    if (!inputCode.trim()) return;

    setIsRefactoring(true);
    try {
      const result = await refactorCode(inputCode);
      console.log(result);

      setRefactoredFiles(result);
    } catch (error) {
      console.error("Error refactoring code:", error);
    } finally {
      setIsRefactoring(false);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card className="w-3/3">
        <CardContent className="p-6">
          <form action={handleRefactor}>
            <Textarea
              placeholder="Paste your code here..."
              className="min-h-[300px] max-h-[300px] overflow-y-scroll font-mono text-sm"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
            />
            <div className="mt-4 flex justify-end">
              <Button
                type="submit"
                disabled={isRefactoring || !inputCode.trim()}
              >
                {isRefactoring && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Refactor Code
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {refactoredFiles.length > 0 && <RefactoredCode files={refactoredFiles} />}
    </div>
  );
}
