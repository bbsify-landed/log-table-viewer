import React from 'react';

interface HeaderProps {
  fileName: string;
  totalLines: number;
  filteredLines: number;
}

const Header: React.FC<HeaderProps> = ({ fileName, totalLines, filteredLines }) => {
  const statsText = totalLines === filteredLines 
    ? `${totalLines} lines`
    : `${filteredLines} / ${totalLines} lines`;

  return (
    <div className="header">
      <div className="file-name">{fileName}</div>
      <div className="stats">{statsText}</div>
    </div>
  );
};

export default Header;