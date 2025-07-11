import React from 'react';
import { LogLine, SortColumn, SortDirection } from '../types';

interface LogTableProps {
  logs: LogLine[];
  onSort: (column: SortColumn) => void;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  expandedRows: Set<number>;
  onToggleExpansion: (lineNumber: number) => void;
}

const LogTable: React.FC<LogTableProps> = ({
  logs,
  onSort,
  sortColumn,
  sortDirection,
  expandedRows,
  onToggleExpansion
}) => {
  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) return '';
    return sortDirection === 'asc' ? '▲' : '▼';
  };

  if (logs.length === 0) {
    return (
      <table className="log-table">
        <thead>
          <tr>
            <th onClick={() => onSort('lineNumber')}>Line # {getSortIcon('lineNumber')}</th>
            <th onClick={() => onSort('timestamp')}>Timestamp {getSortIcon('timestamp')}</th>
            <th onClick={() => onSort('level')}>Level {getSortIcon('level')}</th>
            <th onClick={() => onSort('message')}>Message {getSortIcon('message')}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={4} className="no-logs">
              No logs loaded. Open a .log file to view its contents.
            </td>
          </tr>
        </tbody>
      </table>
    );
  }

  return (
    <table className="log-table">
      <thead>
        <tr>
          <th onClick={() => onSort('lineNumber')}>Line # {getSortIcon('lineNumber')}</th>
          <th onClick={() => onSort('timestamp')}>Timestamp {getSortIcon('timestamp')}</th>
          <th onClick={() => onSort('level')}>Level {getSortIcon('level')}</th>
          <th onClick={() => onSort('message')}>Message {getSortIcon('message')}</th>
        </tr>
      </thead>
      <tbody>
        {logs.map((log) => {
          const isExpanded = expandedRows.has(log.lineNumber);
          return (
            <React.Fragment key={log.lineNumber}>
              <tr 
                className="expandable-row" 
                onClick={() => onToggleExpansion(log.lineNumber)}
              >
                <td className="line-number">
                  <span className="expand-icon">
                    {isExpanded ? '▼' : '▶'}
                  </span>
                  {log.lineNumber}
                </td>
                <td>{log.timestamp}</td>
                <td className={`level-${log.level}`}>{log.level}</td>
                <td className="message-col">{log.message}</td>
              </tr>
              {isExpanded && (
                <tr>
                  <td colSpan={4}>
                    <div className="expanded-content">
                      <strong>Raw log line:</strong>
                      <br />
                      {log.raw}
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          );
        })}
      </tbody>
    </table>
  );
};

export default LogTable;