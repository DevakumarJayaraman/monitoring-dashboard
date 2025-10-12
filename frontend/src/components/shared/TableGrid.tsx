import * as React from 'react';
import { useTheme } from '../../context/ThemeContext';

interface TableGridProps {
  columns: { header: string; accessor: string; Cell?: (props: { value: any; row?: any }) => React.ReactNode }[];
  data: any[];
  actions?: (row: any) => React.ReactNode;
}

const TableGrid: React.FC<TableGridProps> = ({ columns, data, actions }) => {
  const { theme } = useTheme();

  // Theme-aware class builders
  const getTableBorder = () => {
    return theme === "light" ? "border-gray-300" : "border-slate-700";
  };

  const getHeaderBg = () => {
    return theme === "light" ? "bg-gray-100" : "bg-slate-800";
  };

  const getHeaderText = () => {
    return theme === "light" ? "text-gray-900" : "text-slate-100";
  };

  const getRowBg = (isEven: boolean) => {
    if (theme === "light") {
      return isEven ? "bg-white" : "bg-gray-50";
    }
    return isEven ? "bg-slate-900" : "bg-slate-800";
  };

  const getCellText = () => {
    return theme === "light" ? "text-gray-900" : "text-slate-100";
  };

  return (
    <table className={`w-full border-collapse border ${getTableBorder()}`}>
      <thead className={getHeaderBg()}>
        <tr>
          {columns.map((column, index) => (
            <th key={index} className={`border ${getTableBorder()} px-4 py-2 text-left ${getHeaderText()}`}>
              {column.header}
            </th>
          ))}
          {actions && <th className={`border ${getTableBorder()} px-4 py-2 ${getHeaderText()}`}>Actions</th>}
        </tr>
      </thead>
      <tbody>
        {data.map((row, rowIndex) => (
          <tr key={rowIndex} className={getRowBg(rowIndex % 2 === 0)}>
            {columns.map((column, colIndex) => (
              <td key={colIndex} className={`border ${getTableBorder()} px-4 py-2 ${getCellText()}`}>
                {column.Cell ? column.Cell({ value: row[column.accessor], row }) : row[column.accessor]}
              </td>
            ))}
            {actions && <td className={`border ${getTableBorder()} px-4 py-2 ${getCellText()}`}>{actions(row)}</td>}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default TableGrid;
