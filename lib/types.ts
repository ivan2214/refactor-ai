export type FileType = 'js' | 'ts' | 'jsx' | 'tsx';

export type CodeChange = {
  type: 'improvement' | 'suggestion' | 'warning';
  description: string;
  line: number;
};

export type RefactoredFile = {
  name: string;
  path: string;
  content: string;
  changes: CodeChange[];
};

export type RefactoredCode = {
  files: RefactoredFile[];
  summary: string;
  performanceImpact: string;
};

export type EditorTheme = 'light' | 'dark';