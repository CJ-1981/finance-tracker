const fs = require('fs');

const txPagePath = './src/pages/TransactionsPage.tsx';
let txt = fs.readFileSync(txPagePath, 'utf8');

txt = txt.replace(
  `const [formData, setFormData] = useState({`,
  `const [customData, setCustomData] = useState<Record<string, string>>({})
  const [showSettings, setShowSettings] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newFieldName, setNewFieldName] = useState('')
  const [newFieldType, setNewFieldType] = useState<'text' | 'number' | 'date'>('text')
  
  const [formData, setFormData] = useState({`
);

txt = txt.replace(
  `        created_by: user.id,
      } as any)`,
  `        created_by: user.id,
        custom_data: customData,
      } as any)`
);

txt = txt.replace(
  `      setFormData({
        amount: '',
        category_id: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
      })
      setShowAddForm(false)`,
  `      setFormData({
        amount: '',
        category_id: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
      })
      setCustomData({})
      setShowAddForm(false)`
);

const addSettingsFns = `
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCategoryName || !projectId) return
    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('categories')
        .insert([{ project_id: projectId, name: newCategoryName, color: '#' + Math.floor(Math.random()*16777215).toString(16) } as any])
        .select()
        .single()
      if (error) throw error
      setCategories([...categories, data as Category])
      setNewCategoryName('')
    } catch (err) {
      console.error(err)
    }
  }

  const handleAddField = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFieldName || !project) return
    const currentFields = project.settings?.custom_fields || []
    const updatedSettings = {
      ...project.settings,
      currency: project.settings?.currency || 'USD',
      date_format: project.settings?.date_format || 'YYYY-MM-DD',
      notifications_enabled: project.settings?.notifications_enabled ?? true,
      custom_fields: [...currentFields, { name: newFieldName, type: newFieldType }]
    }
    
    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase
        .from('projects')
        .update({ settings: updatedSettings as any })
        .eq('id', projectId)
        
      if (error) throw error
      setProject({ ...project, settings: updatedSettings })
      setNewFieldName('')
    } catch (err) {
      console.error(err)
    }
  }
`;

txt = txt.replace(`const getCategoryName = (categoryId: string) => {`, addSettingsFns + `\n  const getCategoryName = (categoryId: string) => {`);

const dynamicForm = `
              {project?.settings?.custom_fields?.map((field) => (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{field.name}</label>
                  <input
                    type={field.type}
                    className="input"
                    value={customData[field.name] || ''}
                    onChange={(e) => setCustomData({ ...customData, [field.name]: e.target.value })}
                  />
                </div>
              ))}
`;
txt = txt.replace(/<div className="flex gap-2">\s*<button type="submit"/, dynamicForm + '\n              <div className="flex gap-2">\n                <button type="submit"');

const settingsBtn = `
            <div className="flex gap-2">
              <button onClick={() => setShowSettings(!showSettings)} className="btn btn-secondary">
                {showSettings ? 'Close Settings' : 'Template Settings'}
              </button>
              <button onClick={() => setShowAddForm(true)} className="btn btn-primary">
                Add Transaction
              </button>
            </div>
`;
txt = txt.replace(/<button onClick=\{\(\) => setShowAddForm\(true\)\} className="btn btn-primary">\s*Add Transaction\s*<\/button>/, settingsBtn);

const settingsUI = `
        {showSettings && (
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Manage Categories</h2>
              <form onSubmit={handleAddCategory} className="flex gap-2 mb-4">
                <input type="text" className="input" placeholder="New Category Name" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} required />
                <button type="submit" className="btn btn-primary whitespace-nowrap">Add</button>
              </form>
              <ul className="space-y-2">
                {categories.map(c => (
                  <li key={c.id} className="flex items-center gap-2 text-sm p-2 bg-gray-50 rounded">
                    <span className="w-3 h-3 rounded-full" style={{backgroundColor: c.color}}></span>
                    {c.name}
                  </li>
                ))}
              </ul>
            </div>
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Manage Custom Fields</h2>
              <form onSubmit={handleAddField} className="flex gap-2 mb-4">
                <input type="text" className="input flex-1" placeholder="Field Name" value={newFieldName} onChange={e => setNewFieldName(e.target.value)} required />
                <select className="input w-32" value={newFieldType} onChange={e => setNewFieldType(e.target.value as any)}>
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                </select>
                <button type="submit" className="btn btn-primary whitespace-nowrap">Add</button>
              </form>
              <ul className="space-y-2">
                {project?.settings?.custom_fields?.map(f => (
                  <li key={f.name} className="flex items-center gap-2 text-sm p-2 bg-gray-50 rounded">
                    <span className="font-semibold">{f.name}</span> ({f.type})
                  </li>
                ))}
                {(!project?.settings?.custom_fields || project.settings.custom_fields.length === 0) && (
                  <p className="text-sm text-gray-500">No custom fields defined yet.</p>
                )}
              </ul>
            </div>
          </div>
        )}
`;

txt = txt.replace('{showAddForm && (', settingsUI + '\n        {showAddForm && (');

fs.writeFileSync(txPagePath, txt);
console.log('patched');
