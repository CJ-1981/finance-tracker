import { useState, useRef, ReactNode, useEffect } from "react";

interface TooltipProps {
  content: string;
  children: ReactNode;
  delay?: number;
  className?: string;
}

/**
 * Tooltip component with configurable hover delay.
 * Provides accessible tooltip information with ARIA attributes.
 * Supports both mouse and touch interactions.
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
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const touchTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Clear any pending timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (touchTimerRef.current) {
        clearTimeout(touchTimerRef.current);
      }
    };
  }, []);

  const showTooltip = () => {
    // Clear any existing timeout before setting a new one
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
      touchTimerRef.current = undefined;
    }
    setIsVisible(false);
  };

  const handleMouseEnter = () => {
    showTooltip();
  };

  const handleMouseLeave = () => {
    hideTooltip();
  };

  const handleFocus = () => {
    showTooltip();
  };

  const handleBlur = () => {
    hideTooltip();
  };

  const handleTouchStart = () => {
    // Tap-and-hold for mobile: show tooltip after 500ms
    touchTimerRef.current = setTimeout(() => {
      setIsVisible(true);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
      touchTimerRef.current = undefined;
    }
    // Don't immediately hide on touch end - let user tap elsewhere to dismiss
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {children}
      {isVisible && (
        <div
          className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2
                     px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg
                     shadow-lg whitespace-nowrap z-50 ${className}`}
          role="tooltip"
          aria-live="polite"
        >
          {content}
          <div
            className="absolute top-full left-1/2 transform -translate-x-1/2
                       -mt-1 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700"
          />
        </div>
      )}
    </div>
  );
}
