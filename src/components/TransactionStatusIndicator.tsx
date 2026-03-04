import { getCurrencyStatus } from "../utils/currencyFilter";
import type { CurrencyMatchStatus } from "../types";
import Tooltip from "./Tooltip";

interface TransactionStatusIndicatorProps {
  currencyCode: string | null | undefined;
  projectCurrency: string | null | undefined;
  amount?: number; // Reserved for future use (display amount in tooltip)
  showIcon?: boolean;
  className?: string;
}

/**
 * Visual indicator component for transaction currency status.
 *
 * Displays nothing for matching currencies (standard styling).
 * Shows warning indicator (yellow) for mismatched currencies.
 * Shows error indicator (red) for missing currency information.
 *
 * @param currencyCode - The transaction's currency code
 * @param projectCurrency - The project's currency code
 * @param amount - Optional transaction amount for display (reserved for future use)
 * @param showIcon - Whether to show the warning icon (default: true)
 * @param className - Additional CSS classes
 */
// @MX:NOTE: Visual indicator for currency status - shows warning/exclusion for mismatched currencies
export default function TransactionStatusIndicator({
  currencyCode,
  projectCurrency,
  amount: _amount, // Reserved for future use (display amount in tooltip)
  showIcon = true,
  className = "",
}: TransactionStatusIndicatorProps) {
  const status: CurrencyMatchStatus = getCurrencyStatus(
    currencyCode,
    projectCurrency,
  );

  // No indicator for matching currency - standard styling applies
  if (status === "matched") {
    return null;
  }

  const isMismatched = status === "mismatched";

  // Determine styling based on status
  const bgColor = isMismatched ? "bg-yellow-50 dark:bg-yellow-900/20" : "bg-red-50 dark:bg-red-900/20";
  const borderColor = isMismatched ? "border-yellow-200 dark:border-yellow-800" : "border-red-200 dark:border-red-800";
  const iconColor = isMismatched ? "text-yellow-600 dark:text-yellow-400" : "text-red-600 dark:text-red-400";

  // Generate tooltip text based on status
  const getTooltipText = (): string => {
    if (status === "missing") {
      return "Currency information missing. Transaction excluded from calculations.";
    }
    return `This transaction is excluded from calculations because its currency (${currencyCode || "N/A"}) does not match the project currency (${projectCurrency || "N/A"}).`;
  };

  const tooltipContent = getTooltipText();

  return (
    <Tooltip content={tooltipContent} delay={300}>
      <span
        className={`${bgColor} ${borderColor} border rounded px-2 py-1 text-xs font-medium ${iconColor} ${className} cursor-help`}
        role="status"
        aria-live="polite"
        aria-label={tooltipContent}
        tabIndex={0}
      >
        {showIcon && <span className="mr-1" aria-hidden="true">⚠️</span>}
        {status === "missing" ? "No Currency" : `${currencyCode}`}
      </span>
    </Tooltip>
  );
}

/**
 * Helper function to get the CSS class name for a transaction row
 * based on its currency match status.
 *
 * @param currencyCode - The transaction's currency code
 * @param projectCurrency - The project's currency code
 * @returns CSS class string for row styling
 */
export function getTransactionRowClassName(
  currencyCode: string | null | undefined,
  projectCurrency: string | null | undefined,
): string {
  const status = getCurrencyStatus(currencyCode, projectCurrency);

  if (status === "matched") {
    return "";
  }

  if (status === "mismatched") {
    return "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 border-l-4";
  }

  // Missing currency
  return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 border-l-4";
}
