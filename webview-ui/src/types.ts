export interface LogLine {
  lineNumber: number;
  timestamp: string;
  level: string;
  message: string;
  raw: string;
}

export interface VSCodeMessage {
  command: string;
  logs?: LogLine[];
  fileName?: string;
  filter?: string;
}

export type SortColumn = 'lineNumber' | 'timestamp' | 'level' | 'message';
export type SortDirection = 'asc' | 'desc';