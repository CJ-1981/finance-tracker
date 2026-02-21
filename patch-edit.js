const fs = require('fs');
const txPagePath = './src/pages/TransactionsPage.tsx';
let txt = fs.readFileSync(txPagePath, 'utf8');

txt = txt.replace(
  `const [newFieldType, setNewFieldType] = useState<'text' | 'number' | 'date'>('text')`,
  `const [newFieldType, setNewFieldType] = useState<'text' | 'number' | 'date'>('text')\n  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null)`
);

const handleSubmitOld = `    try {
      const supabase = getSupabaseClient()
      // Type assertion needed: Supabase insert types require generated types from Supabase CLI
      const { error } = await supabase.from('transactions').insert({
        project_id: projectId,
        amount: parseFloat(formData.amount),
        category_id: formData.category_id,
        description: formData.description,
        date: formData.date,
        currency: project?.settings?.currency || 'USD',
        created_by: user.id,
        custom_data: customData,
      } as any)

      if (error) throw error`;

const handleSubmitNew = `    try {
      const supabase = getSupabaseClient()
      if (editingTransactionId) {
        const { error } = await supabase.from('transactions').update({
          amount: parseFloat(formData.amount),
          category_id: formData.category_id,
          description: formData.description,
          date: formData.date,
          custom_data: customData,
        } as any).eq('id', editingTransactionId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('transactions').insert({
          project_id: projectId,
          amount: parseFloat(formData.amount),
          category_id: formData.category_id,
          description: formData.description,
          date: formData.date,
          currency: project?.settings?.currency || 'USD',
          created_by: user.id,
          custom_data: customData,
        } as any)
        if (error) throw error
      }`;

txt = txt.replace(handleSubmitOld, handleSubmitNew);

txt = txt.replace(
  `setShowAddForm(false)`,
  `setShowAddForm(false)\n      setEditingTransactionId(null)`
);

const handleEditFn = `
  const handleEdit = (transaction: Transaction) => {
    setEditingTransactionId(transaction.id)
    setFormData({
      amount: transaction.amount.toString(),
      category_id: transaction.category_id || '',
      description: transaction.description || '',
      date: transaction.date || new Date().toISOString().split('T')[0],
    })
    setCustomData(transaction.custom_data || {})
    setShowAddForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
`;

txt = txt.replace(
  `const handleDelete = async (transactionId: string) => {`,
  handleEditFn + `\n  const handleDelete = async (transactionId: string) => {`
);

txt = txt.replace(
  `<button onClick={() => setShowAddForm(true)} className="btn btn-primary">`,
  `<button onClick={() => {
                setEditingTransactionId(null)
                setFormData({ amount: '', category_id: '', description: '', date: new Date().toISOString().split('T')[0] })
                setCustomData({})
                setShowAddForm(true)
              }} className="btn btn-primary">`
);

txt = txt.replace(
  `<h2 className="text-lg font-semibold mb-4">Add New Transaction</h2>`,
  `<h2 className="text-lg font-semibold mb-4">{editingTransactionId ? 'Edit Transaction' : 'Add New Transaction'}</h2>`
);

txt = txt.replace(
  `<button type="submit" className="btn btn-primary">
                  Save Transaction
                </button>`,
  `<button type="submit" className="btn btn-primary">
                  {editingTransactionId ? 'Update Transaction' : 'Save Transaction'}
                </button>`
);

txt = txt.replace(
  `<button
                          onClick={() => handleDelete(transaction.id)}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>`,
  `<button
                          onClick={() => handleEdit(transaction)}
                          className="text-sm text-blue-600 hover:text-blue-800 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(transaction.id)}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>`
);

fs.writeFileSync(txPagePath, txt);
console.log('patched edit');
