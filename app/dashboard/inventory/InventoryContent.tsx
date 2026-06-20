'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, X, Package, AlertTriangle, ArrowDownCircle, ArrowUpCircle, History } from 'lucide-react'
import { sendNotification } from '@/lib/notify'

interface Item {
  id: string; name: string; category: string; unit: string
  current_stock: number; low_stock_threshold: number; unit_cost: number
  linked_consumption_name?: string; auto_deduct_enabled: boolean; notes?: string
}
interface Transaction {
  id: string; transaction_type: string; quantity: number; reason?: string; created_at: string
  item?: { name: string; unit: string }
  performed_by_profile?: { full_name: string }
}

const CATEGORY_LABELS: { [k: string]: string } = { bar: 'Bar', breakfast: 'Breakfast', housekeeping: 'Housekeeping', general_supplies: 'General Supplies' }
const CATEGORY_COLORS: { [k: string]: string } = { bar: '#60a5fa', breakfast: '#fbbf24', housekeeping: '#a78bfa', general_supplies: '#34d399' }

const INPUT = { width: '100%', padding: '10px 14px', background: '#221b10', border: '1px solid #2e2010', borderRadius: '8px', color: '#f0d3a8', fontSize: '14px', outline: 'none', fontFamily: 'inherit' } as React.CSSProperties
const LBL = { display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#7a6650', marginBottom: '6px' }

export default function InventoryContent({ items: initItems, transactions: initTx, currentUserId }: { items: Item[]; transactions: Transaction[]; currentUserId: string }) {
  const [items, setItems] = useState(initItems)
  const [transactions, setTransactions] = useState(initTx)
  const [tab, setTab] = useState<'stock' | 'history'>('stock')
  const [category, setCategory] = useState<string>('all')
  const [showStockModal, setShowStockModal] = useState<{ item: Item; type: 'stock_in' | 'stock_out' } | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [stockForm, setStockForm] = useState({ quantity: '', reason: '' })
  const [addForm, setAddForm] = useState({ name: '', category: 'breakfast', unit: 'pcs', current_stock: '0', low_stock_threshold: '5', unit_cost: '', linked_consumption_name: '' })
  const supabase = createClient()

  const filtered = category === 'all' ? items : items.filter(i => i.category === category)
  const lowStockItems = items.filter(i => i.current_stock <= i.low_stock_threshold)

  const categoryCounts: { [k: string]: number } = { all: items.length }
  Object.keys(CATEGORY_LABELS).forEach(c => categoryCounts[c] = items.filter(i => i.category === c).length)

  async function recordTransaction(e: React.FormEvent) {
    e.preventDefault()
    if (!showStockModal) return
    setLoading(true)
    const { item, type } = showStockModal
    const qty = parseFloat(stockForm.quantity)

    const { error } = await supabase.rpc('adjust_inventory_stock', {
      p_item_id: item.id, p_quantity: qty, p_transaction_type: type,
      p_reason: stockForm.reason || null, p_reference_type: 'manual', p_reference_id: null, p_performed_by: currentUserId,
    })

    if (!error) {
      const newStock = type === 'stock_in' ? item.current_stock + qty : Math.max(0, item.current_stock - qty)
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, current_stock: newStock } : i))
      setTransactions(prev => [{ id: crypto.randomUUID(), transaction_type: type, quantity: qty, reason: stockForm.reason, created_at: new Date().toISOString(), item: { name: item.name, unit: item.unit } }, ...prev])

      if (newStock <= item.low_stock_threshold) {
        await sendNotification({ title: 'Low Stock Alert', message: `${item.name} is running low: ${newStock} ${item.unit} remaining`, entity_type: 'maintenance' })
      }
      setShowStockModal(null)
      setStockForm({ quantity: '', reason: '' })
    }
    setLoading(false)
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { data, error } = await supabase.from('inventory_items').insert({
      name: addForm.name, category: addForm.category, unit: addForm.unit,
      current_stock: parseFloat(addForm.current_stock) || 0,
      low_stock_threshold: parseFloat(addForm.low_stock_threshold) || 5,
      unit_cost: parseFloat(addForm.unit_cost) || 0,
      linked_consumption_name: addForm.linked_consumption_name || null,
      auto_deduct_enabled: false,
    }).select().single()

    if (!error && data) {
      setItems(prev => [...prev, data])
      setShowAddModal(false)
      setAddForm({ name: '', category: 'breakfast', unit: 'pcs', current_stock: '0', low_stock_threshold: '5', unit_cost: '', linked_consumption_name: '' })
    }
    setLoading(false)
  }

  return (
    <div className="dashboard-page" style={{ padding: '32px', animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '28px', fontWeight: 600, color: '#f0d3a8' }}>Inventory</h2>
          <p style={{ fontSize: '13px', color: '#7a6650', marginTop: '4px' }}>{items.length} items tracked</p>
        </div>
        <button onClick={() => setShowAddModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'linear-gradient(135deg, #93602a, #a8702e)', color: '#111008', fontWeight: 700, fontSize: '13px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          <Plus size={15} /> Add Item
        </button>
      </div>

      {lowStockItems.length > 0 && (
        <div style={{ padding: '12px 16px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertTriangle size={15} color="#f87171" />
          <span style={{ fontSize: '13px', color: '#f87171', fontWeight: 600 }}>{lowStockItems.length} item{lowStockItems.length > 1 ? 's' : ''} running low: {lowStockItems.map(i => i.name).join(', ')}</span>
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid #2e2010' }}>
        {[{ k: 'stock', label: 'Stock Levels', icon: <Package size={14} /> }, { k: 'history', label: 'Transaction History', icon: <History size={14} /> }].map(t => (
          <button key={t.k} onClick={() => setTab(t.k as any)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', background: 'transparent', border: 'none', borderBottom: tab === t.k ? '2px solid #a8702e' : '2px solid transparent', fontSize: '13px', fontWeight: tab === t.k ? 600 : 400, color: tab === t.k ? '#a8702e' : '#7a6650', cursor: 'pointer', fontFamily: 'inherit', marginBottom: '-1px' }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'stock' && (
        <>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {['all', ...Object.keys(CATEGORY_LABELS)].map(c => {
              const color = c === 'all' ? '#a8702e' : CATEGORY_COLORS[c]
              const isActive = category === c
              return (
                <button key={c} onClick={() => setCategory(c)} style={{ padding: '7px 16px', background: isActive ? `${color}15` : 'transparent', border: `1px solid ${isActive ? `${color}40` : '#2e2010'}`, borderRadius: '100px', fontSize: '12px', fontWeight: 600, color: isActive ? color : '#7a6650', cursor: 'pointer', fontFamily: 'inherit' }}>
                  {c === 'all' ? 'All' : CATEGORY_LABELS[c]} ({categoryCounts[c]})
                </button>
              )
            })}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
            {filtered.map(item => {
              const isLow = item.current_stock <= item.low_stock_threshold
              const color = CATEGORY_COLORS[item.category]
              return (
                <div key={item.id} style={{ background: '#1a160c', border: `1px solid ${isLow ? 'rgba(248,113,113,0.3)' : '#2e2010'}`, borderRadius: '12px', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#c4ab85' }}>{item.name}</div>
                      <span style={{ fontSize: '10px', color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{CATEGORY_LABELS[item.category]}</span>
                    </div>
                    {isLow && <AlertTriangle size={14} color="#f87171" />}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '12px' }}>
                    <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '26px', fontWeight: 700, color: isLow ? '#f87171' : '#f0d3a8' }}>{item.current_stock}</span>
                    <span style={{ fontSize: '12px', color: '#7a6650' }}>{item.unit}</span>
                    <span style={{ fontSize: '11px', color: '#3a3220', marginLeft: 'auto' }}>min: {item.low_stock_threshold}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => setShowStockModal({ item, type: 'stock_in' })} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', padding: '7px', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '6px', fontSize: '11px', color: '#4ade80', cursor: 'pointer', fontFamily: 'inherit' }}>
                      <ArrowUpCircle size={12} /> Stock In
                    </button>
                    <button onClick={() => setShowStockModal({ item, type: 'stock_out' })} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', padding: '7px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '6px', fontSize: '11px', color: '#f87171', cursor: 'pointer', fontFamily: 'inherit' }}>
                      <ArrowDownCircle size={12} /> Stock Out
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {tab === 'history' && (
        <div style={{ background: '#1a160c', border: '1px solid #2e2010', borderRadius: '12px', overflow: 'hidden' }}>
          {transactions.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center' }}><History size={36} color="#3a3220" style={{ margin: '0 auto 12px' }} /><p style={{ color: '#7a6650' }}>No transactions yet</p></div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
              <thead><tr style={{ background: '#221b10' }}>
                {['Item', 'Type', 'Quantity', 'Reason', 'By', 'Date'].map(h => <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7a6650', borderBottom: '1px solid #2e2010' }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {transactions.map(tx => (
                  <tr key={tx.id} style={{ borderBottom: '1px solid #2e2010' }} onMouseEnter={e => (e.currentTarget.style.background = '#221b10')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: 600, color: '#c4ab85' }}>{tx.item?.name}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', background: tx.transaction_type === 'stock_in' ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)', border: `1px solid ${tx.transaction_type === 'stock_in' ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)'}`, borderRadius: '100px', fontSize: '11px', fontWeight: 600, color: tx.transaction_type === 'stock_in' ? '#4ade80' : '#f87171' }}>
                        {tx.transaction_type === 'stock_in' ? <ArrowUpCircle size={10} /> : <ArrowDownCircle size={10} />}
                        {tx.transaction_type === 'stock_in' ? 'In' : 'Out'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '13px', color: '#c4ab85' }}>{tx.quantity} {tx.item?.unit}</td>
                    <td style={{ padding: '12px 14px', fontSize: '12px', color: '#7a6650' }}>{tx.reason || '—'}</td>
                    <td style={{ padding: '12px 14px', fontSize: '12px', color: '#7a6650' }}>{tx.performed_by_profile?.full_name || '—'}</td>
                    <td style={{ padding: '12px 14px', fontSize: '11px', color: '#7a6650' }}>{new Date(tx.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      )}

      {showStockModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: '#1a160c', border: '1px solid #2e2010', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '400px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <div style={{ height: '2px', background: `linear-gradient(90deg, ${showStockModal.type === 'stock_in' ? '#4ade80' : '#f87171'}, transparent)`, marginBottom: '16px', borderRadius: '2px' }} />
                <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '20px', fontWeight: 600, color: '#f0d3a8' }}>{showStockModal.type === 'stock_in' ? 'Stock In' : 'Stock Out'}: {showStockModal.item.name}</h3>
                <p style={{ fontSize: '12px', color: '#7a6650', marginTop: '4px' }}>Current: {showStockModal.item.current_stock} {showStockModal.item.unit}</p>
              </div>
              <button onClick={() => setShowStockModal(null)} style={{ background: '#221b10', border: '1px solid #2e2010', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#7a6650' }}><X size={14} /></button>
            </div>
            <form onSubmit={recordTransaction} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div><label style={LBL}>Quantity ({showStockModal.item.unit})</label><input type="number" step="0.01" required value={stockForm.quantity} onChange={e => setStockForm(f => ({ ...f, quantity: e.target.value }))} placeholder="0" style={INPUT} onFocus={e => e.target.style.borderColor = '#93602a'} onBlur={e => e.target.style.borderColor = '#2e2010'} /></div>
              <div><label style={LBL}>Reason</label><input value={stockForm.reason} onChange={e => setStockForm(f => ({ ...f, reason: e.target.value }))} placeholder={showStockModal.type === 'stock_in' ? 'New delivery, purchase...' : 'Used, damaged, expired...'} style={INPUT} onFocus={e => e.target.style.borderColor = '#93602a'} onBlur={e => e.target.style.borderColor = '#2e2010'} /></div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowStockModal(null)} style={{ flex: 1, padding: '11px', background: 'transparent', border: '1px solid #2e2010', borderRadius: '8px', color: '#7a6650', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                <button type="submit" disabled={loading} style={{ flex: 2, padding: '11px', background: showStockModal.type === 'stock_in' ? 'linear-gradient(135deg, #22c55e, #4ade80)' : 'linear-gradient(135deg, #ef4444, #f87171)', color: 'white', fontWeight: 700, fontSize: '13px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>{loading ? 'Saving...' : `Confirm ${showStockModal.type === 'stock_in' ? 'Stock In' : 'Stock Out'}`}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: '#1a160c', border: '1px solid #2e2010', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '440px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div><div style={{ height: '2px', background: 'linear-gradient(90deg, #a8702e, transparent)', marginBottom: '16px', borderRadius: '2px' }} /><h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '20px', fontWeight: 600, color: '#f0d3a8' }}>Add Inventory Item</h3></div>
              <button onClick={() => setShowAddModal(false)} style={{ background: '#221b10', border: '1px solid #2e2010', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#7a6650' }}><X size={14} /></button>
            </div>
            <form onSubmit={addItem} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div><label style={LBL}>Item Name *</label><input required value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Coca Cola" style={INPUT} onFocus={e => e.target.style.borderColor = '#93602a'} onBlur={e => e.target.style.borderColor = '#2e2010'} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><label style={LBL}>Category</label><select value={addForm.category} onChange={e => setAddForm(f => ({ ...f, category: e.target.value }))} style={{ ...INPUT, appearance: 'none' }} onFocus={e => e.target.style.borderColor = '#93602a'} onBlur={e => e.target.style.borderColor = '#2e2010'}>{Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
                <div><label style={LBL}>Unit</label><input value={addForm.unit} onChange={e => setAddForm(f => ({ ...f, unit: e.target.value }))} placeholder="pcs, kg, crates..." style={INPUT} onFocus={e => e.target.style.borderColor = '#93602a'} onBlur={e => e.target.style.borderColor = '#2e2010'} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><label style={LBL}>Starting Stock</label><input type="number" value={addForm.current_stock} onChange={e => setAddForm(f => ({ ...f, current_stock: e.target.value }))} style={INPUT} onFocus={e => e.target.style.borderColor = '#93602a'} onBlur={e => e.target.style.borderColor = '#2e2010'} /></div>
                <div><label style={LBL}>Low Stock Alert At</label><input type="number" value={addForm.low_stock_threshold} onChange={e => setAddForm(f => ({ ...f, low_stock_threshold: e.target.value }))} style={INPUT} onFocus={e => e.target.style.borderColor = '#93602a'} onBlur={e => e.target.style.borderColor = '#2e2010'} /></div>
              </div>
              <div><label style={LBL}>Unit Cost (GH₵, optional)</label><input type="number" value={addForm.unit_cost} onChange={e => setAddForm(f => ({ ...f, unit_cost: e.target.value }))} placeholder="0.00" style={INPUT} onFocus={e => e.target.style.borderColor = '#93602a'} onBlur={e => e.target.style.borderColor = '#2e2010'} /></div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '11px', background: 'transparent', border: '1px solid #2e2010', borderRadius: '8px', color: '#7a6650', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                <button type="submit" disabled={loading} style={{ flex: 2, padding: '11px', background: 'linear-gradient(135deg, #93602a, #a8702e)', color: '#111008', fontWeight: 700, fontSize: '13px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>{loading ? 'Adding...' : 'Add Item'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}} select option{background:#221b10;color:#f0d3a8} input::placeholder{color:#3a3220}`}</style>
    </div>
  )
}
