import React, { useState, useEffect, useCallback } from 'react';
import { LogLine, VSCodeMessage, SortColumn, SortDirection } from './types';
import LogTable from './components/LogTable';
import FilterInput from './components/FilterInput';
import Header from './components/Header';

declare const acquireVsCodeApi: () => {
  postMessage: (message: any) => void;
};

const App: React.FC = () => {
  const [allLogs, setAllLogs] = useState<LogLine[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogLine[]>([]);
  const [fileName, setFileName] = useState<string>('No file selected');
  const [sortColumn, setSortColumn] = useState<SortColumn>('lineNumber');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [vscode, setVscode] = useState<any>(null);

  useEffect(() => {
    try {
      if (typeof acquireVsCodeApi !== 'undefined') {
        const api = acquireVsCodeApi();
        setVscode(api);
      }
    } catch (error) {
      console.error('Error acquiring VSCode API:', error);
    }
  }, []);

  const applyFilter = useCallback((filterText: string) => {
    if (!filterText) {
      setFilteredLogs([...allLogs]);
    } else {
      try {
        const regex = new RegExp(filterText, 'i');
        const filtered = allLogs.filter(log => 
          regex.test(log.message) || 
          regex.test(log.level) || 
          regex.test(log.timestamp)
        );
        setFilteredLogs(filtered);
      } catch (e) {
        const searchText = filterText.toLowerCase();
        const filtered = allLogs.filter(log => 
          log.message.toLowerCase().includes(searchText) ||
          log.level.toLowerCase().includes(searchText) ||
          log.timestamp.toLowerCase().includes(searchText)
        );
        setFilteredLogs(filtered);
      }
    }
  }, [allLogs]);

  const handleSort = useCallback((column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  }, [sortColumn, sortDirection]);

  const sortedLogs = React.useMemo(() => {
    return [...filteredLogs].sort((a, b) => {
      let aVal: any, bVal: any;
      
      switch (sortColumn) {
        case 'lineNumber':
          aVal = a.lineNumber;
          bVal = b.lineNumber;
          break;
        case 'timestamp':
          aVal = a.timestamp;
          bVal = b.timestamp;
          break;
        case 'level':
          aVal = a.level;
          bVal = b.level;
          break;
        case 'message':
          aVal = a.message;
          bVal = b.message;
          break;
        default:
          return 0;
      }

      if (typeof aVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      } else {
        return sortDirection === 'asc' ? 
          aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
    });
  }, [filteredLogs, sortColumn, sortDirection]);

  const toggleRowExpansion = useCallback((lineNumber: number) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(lineNumber)) {
        newSet.delete(lineNumber);
      } else {
        newSet.add(lineNumber);
      }
      return newSet;
    });
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent<VSCodeMessage>) => {
      const message = event.data;
      switch (message.command) {
        case 'updateLogs':
          if (message.logs && message.fileName) {
            setAllLogs(message.logs);
            setFilteredLogs(message.logs);
            setFileName(message.fileName);
            setExpandedRows(new Set());
          }
          break;
        case 'applyFilter':
          if (message.filter !== undefined) {
            applyFilter(message.filter);
          }
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [applyFilter]);

  return (
    <div>
      <Header fileName={fileName} totalLines={allLogs.length} filteredLines={filteredLogs.length} />
      <FilterInput onFilter={applyFilter} />
      <LogTable 
        logs={sortedLogs}
        onSort={handleSort}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        expandedRows={expandedRows}
        onToggleExpansion={toggleRowExpansion}
      />
    </div>
  );
};

export default App;