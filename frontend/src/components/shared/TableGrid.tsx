import * as React from 'react';
import { useTheme } from '../../context/ThemeContext';

interface TableGridProps<T = Record<string, unknown>> {
  columns: {
    header: string;
    accessor: string;
    width?: string; // Add optional width control
    Cell?: (props: { value: unknown; row?: T }) => React.ReactNode
  }[];
  data: T[];
  actions?: (row: T) => React.ReactNode;
  className?: string; // Add optional className for custom styling
}

const TableGrid = <T extends Record<string, unknown>>({ columns, data, actions, className = '' }: TableGridProps<T>) => {
  const { theme } = useTheme();

  // Theme-aware class builders
  const getTableBorder = () => {
    return theme === "light" ? "border-gray-300" : "border-slate-700";
  };

  const getHeaderBg = () => {
    return theme === "light" ? "bg-gray-100" : "bg-slate-800/80";
  };

  const getHeaderText = () => {
    return theme === "light" ? "text-gray-900" : "text-slate-100";
  };

  const getRowBg = (isEven: boolean) => {
    if (theme === "light") {
      return isEven ? "bg-white" : "bg-gray-50";
    }
    return isEven ? "bg-slate-900/50" : "bg-slate-800/50";
  };

  const getRowHoverBg = () => {
    return theme === "light" ? "hover:bg-blue-50" : "hover:bg-slate-700/30";
  };

  const getCellText = () => {
    return theme === "light" ? "text-gray-900" : "text-slate-100";
  };

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full border-collapse">
        <thead className={`${getHeaderBg()} sticky top-0 z-10`}>
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                className={`border ${getTableBorder()} px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider ${getHeaderText()}`}
                style={column.width ? { width: column.width } : undefined}
              >
                {column.header}
              </th>
            ))}
            {actions && (
              <th className={`border ${getTableBorder()} px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider ${getHeaderText()}`}>
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (actions ? 1 : 0)}
                className={`border ${getTableBorder()} px-4 py-8 text-center text-sm text-slate-400`}
              >
                No data available
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={`${getRowBg(rowIndex % 2 === 0)} ${getRowHoverBg()} transition-colors`}
              >
                {columns.map((column, colIndex) => (
                  <td
                    key={colIndex}
                    className={`border ${getTableBorder()} px-3 py-2 text-sm ${getCellText()} align-top`}
                  >
                    {column.Cell ? column.Cell({ value: row[column.accessor], row }) : String(row[column.accessor] ?? '')}
                  </td>
                ))}
                {actions && (
                  <td className={`border ${getTableBorder()} px-3 py-2 text-center align-top`}>
                    {actions(row)}
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TableGrid;
