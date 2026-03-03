import { useState, useRef, ReactNode } from "react";

interface TooltipProps {
  content: string;
  children: ReactNode;
  delay?: number;
  className?: string;
}

/**
 * Tooltip component with configurable hover delay.
 * Provides accessible tooltip information with ARIA attributes.
 *
 * @param content - The tooltip text to display
 * @param children - The element that triggers the tooltip on hover
 * @param delay - Hover delay in milliseconds (default: 300ms)
 * @param className - Additional CSS classes for the tooltip
 */
export default function Tooltip({
  content,
  children,
  delay = 300,
  className = "",
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const handleFocus = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const handleBlur = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      {children}
      {isVisible && (
        <div
          className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2
                     px-3 py-2 bg-gray-900 text-white text-sm rounded-lg
                     shadow-lg whitespace-nowrap z-50 ${className}`}
          role="tooltip"
          aria-live="polite"
        >
          {content}
          <div
            className="absolute top-full left-1/2 transform -translate-x-1/2
                       -mt-1 border-4 border-transparent border-t-gray-900"
          />
        </div>
      )}
    </div>
  );
}
