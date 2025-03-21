export type FileType = "js" | "ts" | "jsx" | "tsx";

export type TreeNode = string | [string, TreeNode[]];

export type RefactoredCode = {
  tree: TreeNode[];
};

export type EditorTheme = "light" | "dark";
