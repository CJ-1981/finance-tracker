import type {
  Transaction,
  CurrencyFilteredResult,
  CurrencyMatchStatus,
} from "../types";

/**
 * Determines the currency match status for a transaction.
 * @param transactionCurrency - The transaction's currency code
 * @param projectCurrency - The project's currency code
 * @returns The match status: 'matched', 'mismatched', or 'missing'
 */
// @MX:ANCHOR:HIGH_FAN_IN: Core currency matching logic used by filtering and UI components
export function getCurrencyStatus(
  transactionCurrency: string | null | undefined,
  projectCurrency: string | null | undefined,
): CurrencyMatchStatus {
  if (!transactionCurrency) {
    return "missing";
  }

  if (!projectCurrency) {
    // If project has no currency set, treat as matched for backwards compatibility
    return "matched";
  }

  // Case-insensitive comparison
  return transactionCurrency.toUpperCase() === projectCurrency.toUpperCase()
    ? "matched"
    : "mismatched";
}

/**
 * Filters transactions by project currency, separating included from excluded.
 *
 * Transactions are included if:
 * - Their currency_code matches the project currency (case-insensitive)
 * - OR the project has no currency set (backwards compatibility)
 *
 * Transactions are excluded if:
 * - Their currency_code is null/undefined (missing)
 * - Their currency_code does not match the project currency
 *
 * @param transactions - Array of transactions to filter
 * @param projectCurrency - The project's currency code
 * @returns Object with included and excluded transaction arrays
 */
// @MX:ANCHOR:HIGH_FAN_IN: Primary currency filtering function used across calculations
export function filterByCurrency<T extends Transaction | Partial<Transaction>>(
  transactions: T[],
  projectCurrency: string | null | undefined,
): CurrencyFilteredResult<T> {
  const included: T[] = [];
  const excluded: T[] = [];

  for (const transaction of transactions) {
    const status = getCurrencyStatus(
      transaction.currency_code || null,
      projectCurrency || null,
    );

    if (status === "matched") {
      included.push(transaction);
    } else {
      excluded.push(transaction);
    }
  }

  return { included, excluded };
}

/**
 * Checks if a transaction should be included in calculations based on currency match.
 * @param transaction - The transaction to check
 * @param projectCurrency - The project's currency code
 * @returns true if the transaction should be included in calculations
 */
export function isTransactionIncluded(
  transaction: Transaction,
  projectCurrency: string | null | undefined,
): boolean {
  return (
    getCurrencyStatus(transaction.currency_code, projectCurrency) === "matched"
  );
}
