import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { PROPERTY_TYPES, CONDITIONS, STATUSES, FEATURES } from '../constants'

const empty = {
  property_type: 'شقة', description: '', rooms: 0, bathrooms: 0,
  price: '', price_period: 'yearly', location: '', condition: 'used',
  status: 'available', area: '', features: [], image_url: '', internal_notes: '',
}

export default function PropertyForm({ admin, editing, onClose, onSaved }) {
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (editing) setForm({ ...empty, ...editing, features: editing.features || [] })
    else setForm(empty)
  }, [editing])

  function update(k, v) { setForm((f) => ({ ...f, [k]: v })) }

  function toggleFeature(feat) {
    setForm((f) => ({
      ...f,
      features: f.features.includes(feat) ? f.features.filter((x) => x !== feat) : [...f.features, feat],
    }))
  }

  async function handleImage(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => update('image_url', reader.result)
    reader.readAsDataURL(file)
  }

  async function save() {
    if (!form.price) { setError('السعر مطلوب'); return }
    setError(''); setSaving(true)
    const payload = {
      property_type: form.property_type,
      description: form.description || null,
      rooms: Number(form.rooms) || 0,
      bathrooms: Number(form.bathrooms) || 0,
      price: Number(form.price),
      price_period: form.price_period,
      location: form.location || null,
      condition: form.condition,
      status: form.status,
      area: form.area ? Number(form.area) : null,
      features: form.features,
      image_url: form.image_url || null,
      internal_notes: form.internal_notes || null,
      updated_by: admin.full_name,
      updated_at: new Date().toISOString(),
    }
    let res
    if (editing) {
      res = await supabase.from('properties').update(payload).eq('id', editing.id)
    } else {
      res = await supabase.from('properties').insert({ ...payload, created_by: admin.full_name })
    }
    setSaving(false)
    if (res.error) { setError('حدث خطأ أثناء الحفظ'); return }
    onSaved()
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-navy text-xl font-bold">{editing ? 'تعديل عقار' : 'إضافة عقار جديد'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-navy text-xl">✕</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <F label="نوع العقار">
            <select value={form.property_type} onChange={(e) => update('property_type', e.target.value)} className="inp2">
              {PROPERTY_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </F>
          <F label="حالة العقار">
            <select value={form.condition} onChange={(e) => update('condition', e.target.value)} className="inp2">
              {CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </F>
          <F label="عدد الغرف"><input type="number" value={form.rooms} onChange={(e) => update('rooms', e.target.value)} className="inp2" /></F>
          <F label="عدد الحمامات"><input type="number" value={form.bathrooms} onChange={(e) => update('bathrooms', e.target.value)} className="inp2" /></F>
          <F label="السعر"><input type="number" value={form.price} onChange={(e) => update('price', e.target.value)} className="inp2" /></F>
          <F label="نوع السعر">
            <select value={form.price_period} onChange={(e) => update('price_period', e.target.value)} className="inp2">
              <option value="yearly">سنوي</option>
              <option value="monthly">شهري</option>
            </select>
          </F>
          <F label="الموقع"><input value={form.location} onChange={(e) => update('location', e.target.value)} className="inp2" /></F>
          <F label="المساحة (م²)"><input type="number" value={form.area} onChange={(e) => update('area', e.target.value)} className="inp2" /></F>
          <F label="حالة الإيجار">
            <select value={form.status} onChange={(e) => update('status', e.target.value)} className="inp2">
              {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </F>
        </div>
        <div className="mt-4">
          <F label="وصف العقار">
            <textarea value={form.description} onChange={(e) => update('description', e.target.value)} className="inp2 h-20 resize-none" />
          </F>
        </div>
        <div className="mt-4">
          <label className="block text-sm text-navy font-medium mb-2">مميزات العقار</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {FEATURES.map((feat) => (
              <label key={feat} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.features.includes(feat)} onChange={() => toggleFeature(feat)} className="accent-gold" />
                {feat}
              </label>
            ))}
          </div>
        </div>
        <div className="mt-4">
          <F label="صورة العقار (اختياري)">
            <input type="file" accept="image/*" onChange={handleImage} className="text-sm" />
          </F>
          {form.image_url && <img src={form.image_url} alt="" className="mt-2 h-24 rounded-lg object-cover" />}
        </div>
        <div className="mt-4">
          <F label="ملاحظات داخلية (للمتحكمين فقط)">
            <textarea value={form.internal_notes} onChange={(e) => update('internal_notes', e.target.value)} className="inp2 h-16 resize-none" />
          </F>
        </div>
        {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
        <div className="flex gap-3 mt-5">
          <button onClick={save} disabled={saving} className="bg-navy text-white px-6 py-2.5 rounded-xl font-bold disabled:opacity-50">
            {saving ? 'جارٍ الحفظ...' : 'حفظ'}
          </button>
          <button onClick={onClose} className="bg-gray-100 text-navy px-6 py-2.5 rounded-xl font-bold">إلغاء</button>
        </div>
      </div>
      <style>{`.inp2{width:100%;border:1px solid #e5e7eb;border-radius:0.55rem;padding:0.5rem 0.7rem;font-size:0.9rem}.inp2:focus{outline:none;border-color:#C9A84C}`}</style>
    </div>
  )
}

function F({ label, children }) {
  return <div><label className="block text-sm text-navy font-medium mb-1.5">{label}</label>{children}</div>
}
