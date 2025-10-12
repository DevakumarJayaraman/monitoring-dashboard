import type { JSX, ReactNode } from "react";
import { useState } from "react";
import { useTheme } from "../../context/ThemeContext.tsx";

interface TooltipProps {
  content: string;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({ content, children, position = 'top' }: TooltipProps): JSX.Element {
  const { theme } = useTheme();
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const getTooltipBg = () => {
    return theme === "light"
      ? "bg-gray-800 text-white border-gray-700"
      : "bg-slate-800 text-white border-slate-700";
  };

  const arrowClasses = {
    top: `top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent ${theme === "light" ? "border-t-gray-800" : "border-t-slate-800"}`,
    bottom: `bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent ${theme === "light" ? "border-b-gray-800" : "border-b-slate-800"}`,
    left: `left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent ${theme === "light" ? "border-l-gray-800" : "border-l-slate-800"}`,
    right: `right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent ${theme === "light" ? "border-r-gray-800" : "border-r-slate-800"}`,
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className={`absolute z-[100] ${positionClasses[position]} pointer-events-none`}
          role="tooltip"
        >
          <div className="relative">
            <div className={`text-xs font-medium px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap border ${getTooltipBg()}`}>
              {content}
            </div>
            <div
              className={`absolute w-0 h-0 border-4 ${arrowClasses[position]}`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
