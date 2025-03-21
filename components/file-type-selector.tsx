"use client";

import { FileType } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FileTypeSelectorProps {
  value: FileType;
  onChange: (value: FileType) => void;
}

export function FileTypeSelector({ value, onChange }: FileTypeSelectorProps) {
  return (
    <Select value={value} onValueChange={onChange as (value: string) => void}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select file type" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="js">JavaScript (.js)</SelectItem>
        <SelectItem value="ts">TypeScript (.ts)</SelectItem>
        <SelectItem value="jsx">React JSX (.jsx)</SelectItem>
        <SelectItem value="tsx">React TSX (.tsx)</SelectItem>
      </SelectContent>
    </Select>
  );
}