import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { getSupabaseClient } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { Project, Transaction, Category } from '../types'

interface TransactionModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    project: Project
    categories: Category[]
    transaction?: Transaction | null // For editing
    onGoToSettings: () => void
    allTransactions: Transaction[] // For autocomplete values
    children?: React.ReactNode // Extra UI like bulk edit navigation
}

export default function TransactionModal({
    isOpen,
    onClose,
    onSuccess,
    project,
    categories,
    transaction,
    onGoToSettings,
    allTransactions,
    children
}: TransactionModalProps) {
    const { t } = useTranslation()
    const { user } = useAuth()
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState({
        transactionType: 'expense' as 'income' | 'expense',
        amount: '',
        currency_code: project?.settings?.currency || 'USD',
        category_id: '',
        date: new Date().toISOString().split('T')[0],
    })
    const [customData, setCustomData] = useState<Record<string, any>>({})

    useEffect(() => {
        if (transaction) {
            setFormData({
                transactionType: transaction.amount < 0 ? 'expense' : 'income',
                amount: Math.abs(transaction.amount).toString(),
                currency_code: transaction.currency_code || 'USD',
                category_id: transaction.category_id || '',
                date: transaction.date || new Date().toISOString().split('T')[0],
            })
            // Initialize custom data with existing data, ensuring defaults for select fields
            const initialCustomData = { ...(transaction.custom_data || {}) }
            project?.settings?.custom_fields?.forEach(field => {
                if (field.type === 'select' && field.options && field.options.length > 0) {
                    if (!initialCustomData[field.name]) {
                        initialCustomData[field.name] = field.options[0]
                    }
                }
            })
            setCustomData(initialCustomData)
        } else {
            setFormData({
                transactionType: 'expense',
                amount: '',
                currency_code: project?.settings?.currency || 'USD',
                category_id: categories.length > 0 ? categories[0].id : '',
                date: new Date().toISOString().split('T')[0],
            })
            // Initialize custom data with default values for select fields
            const defaultCustomData: Record<string, any> = {}
            project?.settings?.custom_fields?.forEach(field => {
                if (field.type === 'select' && field.options && field.options.length > 0) {
                    defaultCustomData[field.name] = field.options[0]
                }
            })
            setCustomData(defaultCustomData)
        }
    }, [transaction, project, categories])

    const handleGoToSettings = () => {
        const isDirty = formData.amount !== '' || Object.values(customData).some(v => v !== '')
        if (isDirty) {
            if (!confirm(t('transactions.confirmLeaveSettings'))) {
                return
            }
        }
        onGoToSettings()
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user?.id || !project.id) return

        setSaving(true)
        try {
            const supabase = getSupabaseClient()
            const absoluteAmount = Math.abs(parseFloat(formData.amount))
            const signedAmount = formData.transactionType === 'expense' ? -absoluteAmount : absoluteAmount

            const transactionData = {
                project_id: project.id,
                amount: signedAmount,
                currency_code: formData.currency_code,
                category_id: formData.category_id || null,
                date: formData.date,
                custom_data: customData,
                created_by: user.id,
            }

            let error
            if (transaction) {
                const { error: updateError } = await (supabase.from('transactions') as any)
                    .update(transactionData)
                    .eq('id', transaction.id)
                error = updateError
            } else {
                const { error: insertError } = await (supabase.from('transactions') as any)
                    .insert(transactionData)
                error = insertError
            }

            if (error) throw error
            onSuccess()
            onClose()
        } catch (err) {
            console.error('Error saving transaction:', err)
            alert(t('transactions.failedSave'))
        } finally {
            setSaving(false)
        }
    }

    const ClearButton = ({ onClick, show }: { onClick: () => void, show: boolean }) => {
        if (!show) return null;
        return (
            <button
                type="button"
                onClick={onClick}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors z-10"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        );
    };

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                        {transaction ? t('transactions.editTransaction') : t('transactions.addTransaction')}
                    </h2>
                    <button
                        type="button"
                        onClick={handleGoToSettings}
                        className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                        title="Configure custom fields and categories"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
                {children}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Income/Expense Segmented Control */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Transaction Type
                        </label>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, transactionType: 'income' })}
                                className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
                                    formData.transactionType === 'income'
                                        ? 'bg-emerald-500 text-white shadow-md'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                Income
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, transactionType: 'expense' })}
                                className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
                                    formData.transactionType === 'expense'
                                        ? 'bg-rose-500 text-white shadow-md'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                Expense
                            </button>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="modal-amount" className="block text-sm font-medium text-gray-700 mb-1">
                            Amount *
                        </label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <input
                                    id="modal-amount"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    inputMode="decimal"
                                    className={`input pr-10 w-full ${
                                        formData.transactionType === 'income'
                                            ? 'text-emerald-600 focus:ring-emerald-400 focus:border-emerald-400'
                                            : 'text-rose-600 focus:ring-rose-400 focus:border-rose-400'
                                    }`}
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    required
                                />
                                <ClearButton show={!!formData.amount} onClick={() => setFormData({ ...formData, amount: '' })} />
                            </div>
                            <select
                                id="modal-currency"
                                className="input w-24"
                                value={formData.currency_code}
                                onChange={(e) => setFormData({ ...formData, currency_code: e.target.value })}
                            >
                                <option value="USD">USD</option>
                                <option value="EUR">EUR</option>
                                <option value="GBP">GBP</option>
                                <option value="JPY">JPY</option>
                                <option value="KRW">KRW</option>
                                <option value="CNY">CNY</option>
                                <option value="INR">INR</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="modal-date" className="block text-sm font-medium text-gray-700 mb-1">
                            Date *
                        </label>
                        <div className="relative">
                            <input
                                id="modal-date"
                                type="date"
                                className="input pr-10"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                required
                            />
                            <ClearButton show={!!formData.date} onClick={() => setFormData({ ...formData, date: '' })} />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="modal-category" className="block text-sm font-medium text-gray-700 mb-1">
                            Category
                        </label>
                        <select
                            id="modal-category"
                            className="input"
                            value={formData.category_id}
                            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                            required
                        >
                            {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                            <option value="">Uncategorized</option>
                        </select>
                    </div>

                    {project?.settings?.custom_fields?.map((field: any) => (
                        <div key={field.name}>
                            <label htmlFor={`modal-${field.name}`} className="block text-sm font-medium text-gray-700 mb-1">
                                {field.name}
                            </label>
                            {field.type === 'text' ? (
                                <div className="relative">
                                    <input
                                        id={`modal-${field.name}`}
                                        type="text"
                                        list={`modal-custom-list-${field.name}`}
                                        className="input pr-10"
                                        value={customData[field.name] || ''}
                                        onChange={(e) => setCustomData({ ...customData, [field.name]: e.target.value })}
                                    />
                                    <ClearButton show={!!customData[field.name]} onClick={() => setCustomData({ ...customData, [field.name]: '' })} />
                                    <datalist id={`modal-custom-list-${field.name}`}>
                                        {Array.from(new Set([
                                            ...(project?.settings?.custom_field_values?.[field.name] || []),
                                            ...allTransactions.map(t => t.custom_data?.[field.name]).filter(Boolean)
                                        ])).map((value, i) => (
                                            <option key={i} value={value as string} />
                                        ))}
                                    </datalist>
                                </div>
                            ) : field.type === 'number' ? (
                                <div className="relative">
                                    <input
                                        id={`modal-${field.name}`}
                                        type="number"
                                        step="0.01"
                                        className="input pr-10"
                                        value={customData[field.name] || ''}
                                        onChange={(e) => setCustomData({ ...customData, [field.name]: e.target.value })}
                                    />
                                    <ClearButton show={!!customData[field.name]} onClick={() => setCustomData({ ...customData, [field.name]: '' })} />
                                </div>
                            ) : field.type === 'select' ? (
                                <select
                                    id={`modal-${field.name}`}
                                    className="input"
                                    value={customData[field.name] || (field.options?.[0] || '')}
                                    onChange={(e) => setCustomData({ ...customData, [field.name]: e.target.value })}
                                >
                                    {field.options?.map((option: string) => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                            ) : (
                                <div className="relative">
                                    <input
                                        id={`modal-${field.name}`}
                                        type="date"
                                        className="input pr-10"
                                        value={customData[field.name] || ''}
                                        onChange={(e) => setCustomData({ ...customData, [field.name]: e.target.value })}
                                    />
                                    <ClearButton show={!!customData[field.name]} onClick={() => setCustomData({ ...customData, [field.name]: '' })} />
                                </div>
                            )}
                        </div>
                    ))}

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn btn-secondary flex-1"
                            disabled={saving}
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary flex-1"
                            disabled={saving}
                        >
                            {saving ? t('transactions.saving') : (transaction ? t('common.save') : t('common.add'))}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
