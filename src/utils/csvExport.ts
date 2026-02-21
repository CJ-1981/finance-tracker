import Papa from 'papaparse'
import type { Transaction, Project, Category } from '../types'

interface ExportOptions {
  transactions: Transaction[]
  project: Project
  categories: Category[]
}

export function exportToCSV({ transactions, project, categories }: ExportOptions) {
  // Build headers dynamically based on project settings
  const headers: string[] = ['Date', 'Description', 'Category']

  // Add custom field headers
  const customFields = project.settings?.custom_fields || []
  customFields.forEach(field => {
    headers.push(field.name)
  })

  // Add currency and amount columns
  headers.push('Currency', 'Amount')

  // Build CSV rows matching the table structure
  const csvData = transactions.map((t) => {
    const row: Record<string, string> = {
      Date: t.date,
      Description: t.description || '',
      Category: categories.find(c => c.id === t.category_id)?.name || 'Uncategorized',
    }

    // Add custom field values
    customFields.forEach(field => {
      row[field.name] = t.custom_data?.[field.name] || '-'
    })

    // Add currency and amount as separate columns
    row['Currency'] = t.currency_code || 'USD'
    row['Amount'] = t.amount.toFixed(2)

    return row
  })

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
  link.setAttribute('download', `${project.name}_transactions_${date}.csv`)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
