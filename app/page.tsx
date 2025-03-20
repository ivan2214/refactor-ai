import { CodeRefactoringTool } from "@/components/code-refactoring-tool";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto py-10">
        <h1 className="text-4xl font-bold mb-6">AI Code Refactoring Tool</h1>
        <p className="text-muted-foreground mb-8">
          Paste your code below and let AI refactor it into separate components
          with proper typing and styling.
        </p>
        <CodeRefactoringTool />
      </div>
    </main>
  );
}
