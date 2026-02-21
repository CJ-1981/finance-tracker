import Papa from 'papaparse'
import type { Transaction } from '../types'

export function exportToCSV(transactions: Transaction[], projectName: string) {
  const csvData = transactions.map((t) => ({
    Date: t.date,
    Description: t.description || '',
    Amount: t.amount.toFixed(2),
    Currency: t.currency,
    Status: t.status,
  }))

  const csv = Papa.unparse(csvData, {
    quotes: true,
    delimiter: ',',
    header: true,
    newline: '\n',
  })

  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  const date = new Date().toISOString().split('T')[0]
  link.setAttribute('href', url)
  link.setAttribute('download', `${projectName}_transactions_${date}.csv`)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
