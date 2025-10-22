import React, { useContext } from 'react'
import { WizardContext } from './WizardLayout'

const StepTestsInjections = () => {
  const { data, setData, navigate } = useContext(WizardContext)
  const add = (key, tpl) => setData({ ...data, [key]: [ ...(data[key] || []), { ...tpl } ] })
  const upd = (key, idx, field, val) => setData({ ...data, [key]: (data[key] || []).map((x, i) => i === idx ? { ...x, [field]: val } : x) })
  return (
    <div style={{ display: 'grid', gap: 12, maxWidth: 680 }}>
      <div>
        <strong>Tests</strong>
        {(data.tests || []).map((t, i) => (
          <div key={i} style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <input placeholder="Name" value={t.name || ''} onChange={(e) => upd('tests', i, 'name', e.target.value)} />
            <input placeholder="Result" value={t.result || ''} onChange={(e) => upd('tests', i, 'result', e.target.value)} />
          </div>
        ))}
        <button onClick={() => add('tests', { name: '', result: '' })}>Add Test</button>
      </div>
      <div>
        <strong>Injections</strong>
        {(data.injections || []).map((t, i) => (
          <div key={i} style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <input placeholder="Name" value={t.name || ''} onChange={(e) => upd('injections', i, 'name', e.target.value)} />
            <input placeholder="Dose" value={t.dose || ''} onChange={(e) => upd('injections', i, 'dose', e.target.value)} />
          </div>
        ))}
        <button onClick={() => add('injections', { name: '', dose: '' })}>Add Injection</button>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => navigate('../basic')}>Back</button>
        <button onClick={() => navigate('../medications')}>Next: Medications</button>
      </div>
    </div>
  )
}

export default StepTestsInjections


