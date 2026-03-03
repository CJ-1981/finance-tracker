import type {
  Transaction,
  CurrencyFilteredResult,
  CurrencyMatchStatus,
} from "../types";

/**
 * Determines the currency match status for a transaction.
 *
 * Performs case-insensitive and whitespace-normalized comparison between
 * transaction currency and project currency. Handles missing/null currencies
 * with appropriate status codes.
 *
 * @param transactionCurrency - The transaction's currency code
 * @param projectCurrency - The project's currency code
 * @returns The match status: 'matched', 'mismatched', or 'missing'
 */
// @MX:ANCHOR:HIGH_FAN_IN: Core currency matching logic used by filtering and UI components
// @MX:NOTE: Determines currency match status with case-insensitive, whitespace-normalized comparison
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

  // Case-insensitive and whitespace-normalized comparison
  const normalizedTx = transactionCurrency.trim().toUpperCase();
  const normalizedProj = projectCurrency.trim().toUpperCase();

  return normalizedTx === normalizedProj ? "matched" : "mismatched";
}

/**
 * Filters transactions by project currency, separating included from excluded.
 *
 * Transactions are included if:
 * - Their currency_code matches the project currency (case-insensitive, whitespace-normalized)
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
// @MX:NOTE: Single-pass filtering separating included/excluded transactions by currency match
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
 *
 * Convenience wrapper around getCurrencyStatus for boolean inclusion checks.
 *
 * @param transaction - The transaction to check
 * @param projectCurrency - The project's currency code
 * @returns true if the transaction should be included in calculations
 */
// @MX:NOTE: Boolean check for individual transaction inclusion based on currency match
export function isTransactionIncluded(
  transaction: Transaction,
  projectCurrency: string | null | undefined,
): boolean {
  return (
    getCurrencyStatus(transaction.currency_code, projectCurrency) === "matched"
  );
}
