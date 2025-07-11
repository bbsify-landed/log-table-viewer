import React, { useState, useCallback } from 'react';

interface FilterInputProps {
  onFilter: (filterText: string) => void;
}

const FilterInput: React.FC<FilterInputProps> = ({ onFilter }) => {
  const [filterValue, setFilterValue] = useState('');

  const handleBlur = useCallback(() => {
    onFilter(filterValue);
  }, [filterValue, onFilter]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onFilter(filterValue);
    }
  }, [filterValue, onFilter]);

  return (
    <div className="filter-container">
      <input
        type="text"
        className="filter-input"
        placeholder="Filter logs (supports regex)..."
        value={filterValue}
        onChange={(e) => setFilterValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
};

export default FilterInput;