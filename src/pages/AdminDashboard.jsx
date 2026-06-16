import { useEffect, useState, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { STATUSES, statusInfo, conditionLabel, formatPrice, formatDate } from '../constants'
import PropertyForm from '../components/PropertyForm'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [admin, setAdmin] = useState(null)
  const [tab, setTab] = useState('properties')
  const [properties, setProperties] = useState([])
  const [requests, setRequests] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('الكل')
  const [copied, setCopied] = useState(null)
  const prevReqCount = useRef(0)

  useEffect(() => {
    const stored = sessionStorage.getItem('admin')
    if (!stored) { navigate('/admin'); return }
    setAdmin(JSON.parse(stored))
  }, [])

  useEffect(() => {
    if (!admin) return
    loadAll()
    const ch = supabase.channel('admin-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'properties' }, loadProperties)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, () => loadRequests(true))
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [admin])

  async function loadAll() { await Promise.all([loadProperties(), loadRequests(false)]) }

  async function loadProperties() {
    const { data } = await supabase.from('properties').select('*').order('created_at', { ascending: false })
    setProperties(data || [])
  }

  async function loadRequests(notify) {
    const { data } = await supabase.from('requests').select('*').order('created_at', { ascending: false })
    const list = data || []
    if (notify && list.length > prevReqCount.current && prevReqCount.current !== 0) playBeep()
    prevReqCount.current = list.length
    setRequests(list)
  }

  function playBeep() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.frequency.value = 880; osc.type = 'sine'
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)
      osc.start(); osc.stop(ctx.currentTime + 0.5)
    } catch (e) {}
  }

  function logout() { sessionStorage.removeItem('admin'); navigate('/admin') }

  async function quickStatus(prop, newStatus) {
    await supabase.from('properties').update({ status: newStatus, updated_by: admin.full_name, updated_at: new Date().toISOString() }).eq('id', prop.id)
  }

  async function deleteProperty(prop) {
    if (!confirm(`تأكيد حذف العقار: ${prop.property_type}؟`)) return
    await supabase.from('deleted_log').insert({ original_id: prop.id, data: prop, deleted_by: admin.full_name })
    await supabase.from('properties').delete().eq('id', prop.id)
  }

  async function setRequestFollowing(req) {
    await supabase.from('requests').update({ status: 'following' }).eq('id', req.id)
  }

  async function deleteRequest(req) {
    if (!confirm(`تأكيد حذف طلب: ${req.full_name}؟`)) return
    await supabase.from('requests').delete().eq('id', req.id)
  }

  function copyPhone(phone) {
    navigator.clipboard.writeText(phone)
    setCopied(phone)
    setTimeout(() => setCopied(null), 1500)
  }

  const stats = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)
    return {
      available: properties.filter((p) => p.status === 'available').length,
      rented: properties.filter((p) => p.status === 'rented').length,
      newToday: requests.filter((r) => r.status === 'new' && new Date(r.created_at) >= today).length,
      thisWeek: requests.filter((r) => new Date(r.created_at) >= weekAgo).length,
    }
  }, [properties, requests])

  const filteredProps = useMemo(() => {
    let list = [...properties]
    if (statusFilter !== 'الكل') list = list.filter((p) => p.status === statusFilter)
    if (search.trim()) {
      const q = search.trim()
      list = list.filter((p) => (p.description || '').includes(q) || (p.location || '').includes(q) || p.property_type.includes(q))
    }
    return list
  }, [properties, statusFilter, search])

  if (!admin) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-navy text-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-gold text-xl font-extrabold">لوحة تحكم مكتب الهويمل</h1>
            <p className="text-gray-300 text-sm">مرحباً، {admin.full_name}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => window.open('/', '_blank')} className="text-gray-300 text-sm hover:text-gold">عرض الموقع</button>
            <button onClick={logout} className="bg-gold/20 text-gold px-4 py-2 rounded-lg text-sm font-bold hover:bg-gold/30">خروج</button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-5 grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="إعلانات متاحة" value={stats.available} />
        <Stat label="إعلانات مؤجرة" value={stats.rented} />
        <Stat label="طلبات جديدة اليوم" value={stats.newToday} highlight />
        <Stat label="طلبات هذا الأسبوع" value={stats.thisWeek} />
      </div>

      <div className="max-w-7xl mx-auto px-4">
        <div className="flex gap-2 border-b border-gray-200">
          <TabBtn active={tab === 'properties'} onClick={() => setTab('properties')}>الإعلانات ({properties.length})</TabBtn>
          <TabBtn active={tab === 'requests'} onClick={() => setTab('requests')}>
            الطلبات ({requests.length})
            {requests.some((r) => r.status === 'new') && <span className="mr-1 inline-block w-2 h-2 bg-red-500 rounded-full" />}
          </TabBtn>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-5">
        {tab === 'properties' ? (
          <PropertiesTab list={filteredProps} search={search} setSearch={setSearch}
            statusFilter={statusFilter} setStatusFilter={setStatusFilter}
            onAdd={() => { setEditing(null); setShowForm(true) }}
            onEdit={(p) => { setEditing(p); setShowForm(true) }}
            onDelete={deleteProperty} onQuickStatus={quickStatus} />
        ) : (
          <RequestsTab list={requests} copyPhone={copyPhone} copied={copied}
            onFollow={setRequestFollowing} onDelete={deleteRequest} />
        )}
      </div>

      {showForm && (
        <PropertyForm admin={admin} editing={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); loadProperties() }} />
      )}
    </div>
  )
}

function Stat({ label, value, highlight }) {
  return (
    <div className={`rounded-2xl p-4 border ${highlight && value > 0 ? 'bg-gold/10 border-gold' : 'bg-white border-gray-100'}`}>
      <p className="text-gray-500 text-sm">{label}</p>
      <p className="text-navy text-2xl font-extrabold mt-1">{value}</p>
    </div>
  )
}

function TabBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick} className={`px-4 py-3 font-bold text-sm border-b-2 ${active ? 'border-gold text-navy' : 'border-transparent text-gray-400'}`}>
      {children}
    </button>
  )
}

function PropertiesTab({ list, search, setSearch, statusFilter, setStatusFilter, onAdd, onEdit, onDelete, onQuickStatus }) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <button onClick={onAdd} className="bg-gold text-navy px-5 py-2.5 rounded-xl font-bold">+ إضافة عقار</button>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث في الإعلانات..."
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 min-w-[180px]" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
          <option value="الكل">الكل</option>
          {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label} فقط</option>)}
        </select>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="p-3 text-right">#</th>
              <th className="p-3 text-right">النوع</th>
              <th className="p-3 text-right">السعر</th>
              <th className="p-3 text-right">الغرف</th>
              <th className="p-3 text-right">الموقع</th>
              <th className="p-3 text-right">الحالة</th>
              <th className="p-3 text-right">من أضافه</th>
              <th className="p-3 text-right">التاريخ</th>
              <th className="p-3 text-right">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => {
              const s = statusInfo(p.status)
              return (
                <tr key={p.id} className="border-t border-gray-100">
                  <td className="p-3">{p.id}</td>
                  <td className="p-3">{p.property_type}</td>
                  <td className="p-3 whitespace-nowrap">{formatPrice(p.price, p.price_period)}</td>
                  <td className="p-3">{p.rooms || '-'}</td>
                  <td className="p-3">{p.location || '-'}</td>
                  <td className="p-3">
                    <select value={p.status} onChange={(e) => onQuickStatus(p, e.target.value)}
                      className="rounded-md px-2 py-1 text-xs font-bold border-0" style={{ color: s.color, background: s.bg }}>
                      {STATUSES.map((st) => <option key={st.value} value={st.value}>{st.label}</option>)}
                    </select>
                  </td>
                  <td className="p-3 text-xs text-gray-500">{p.created_by || '-'}</td>
                  <td className="p-3 text-xs text-gray-500 whitespace-nowrap">{formatDate(p.created_at)}</td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <button onClick={() => onEdit(p)} className="text-navy bg-gray-100 px-2.5 py-1 rounded-md text-xs font-bold">تعديل</button>
                      <button onClick={() => onDelete(p)} className="text-red-600 bg-red-50 px-2.5 py-1 rounded-md text-xs font-bold">حذف</button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {list.length === 0 && <tr><td colSpan="9" className="p-6 text-center text-gray-400">لا توجد إعلانات</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function RequestsTab({ list, copyPhone, copied, onFollow, onDelete }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {list.map((r) => (
        <div key={r.id} className={`rounded-2xl border p-4 ${r.status === 'new' ? 'bg-gold/10 border-gold' : 'bg-white border-gray-100'}`}>
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-navy font-bold text-lg">{r.full_name}</h3>
              <button onClick={() => copyPhone(r.phone)} className="text-gold font-bold text-sm mt-1 flex items-center gap-1">
                {r.phone}
                <span className="text-xs text-gray-400">{copied === r.phone ? '(تم النسخ)' : '(نسخ)'}</span>
              </button>
            </div>
            {r.status === 'new' && <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">جديد</span>}
            {r.status === 'following' && <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full font-bold">قيد المتابعة</span>}
          </div>
          <div className="mt-3 text-sm text-gray-600 space-y-1">
            {r.property_type && <p>النوع المطلوب: {r.property_type}</p>}
            {r.rooms && <p>عدد الغرف: {r.rooms}</p>}
            {(r.price_from || r.price_to) && <p>نطاق السعر: {r.price_from || '0'} — {r.price_to || '∞'} ريال</p>}
            {r.preferred_location && <p>الموقع المفضل: {r.preferred_location}</p>}
            {r.notes && <p>ملاحظات: {r.notes}</p>}
            <p className="text-xs text-gray-400 pt-1">{formatDate(r.created_at)}</p>
          </div>
          <div className="flex gap-2 mt-3">
            {r.status === 'new' && <button onClick={() => onFollow(r)} className="bg-navy text-white px-4 py-1.5 rounded-lg text-xs font-bold">قيد المتابعة</button>}
            <button onClick={() => onDelete(r)} className="bg-red-50 text-red-600 px-4 py-1.5 rounded-lg text-xs font-bold">حذف</button>
          </div>
        </div>
      ))}
      {list.length === 0 && <p className="text-gray-400 text-center py-8 col-span-2">لا توجد طلبات</p>}
    </div>
  )
}
