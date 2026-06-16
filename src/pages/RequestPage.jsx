import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../supabase'
import { PROPERTY_TYPES, ROOM_OPTIONS } from '../constants'

export default function RequestPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const presetType = location.state?.propertyType || ''

  const [form, setForm] = useState({
    full_name: '', phone: '', property_type: presetType,
    rooms: '', price_from: '', price_to: '',
    preferred_location: '', notes: '',
  })
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  function update(key, val) { setForm((f) => ({ ...f, [key]: val })) }

  async function submit() {
    if (!form.full_name.trim() || !form.phone.trim()) {
      setError('الاسم ورقم الهاتف إلزاميان'); return
    }
    setError(''); setSending(true)
    const { error } = await supabase.from('requests').insert({
      full_name: form.full_name, phone: form.phone,
      property_type: form.property_type || null,
      rooms: form.rooms || null,
      price_from: form.price_from ? Number(form.price_from) : null,
      price_to: form.price_to ? Number(form.price_to) : null,
      preferred_location: form.preferred_location || null,
      notes: form.notes || null,
    })
    setSending(false)
    if (error) { setError('حدث خطأ، حاول مرة أخرى'); return }
    setDone(true)
  }

  if (done) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-gold/15 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-gold text-3xl font-bold">✓</span>
          </div>
          <h2 className="text-navy text-xl font-bold mb-2">تم استلام طلبك</h2>
          <p className="text-gray-600">سيتواصل معك فريق مكتب الهويمل قريباً</p>
          <button onClick={() => navigate('/')}
            className="mt-6 bg-navy text-white px-6 py-2.5 rounded-xl font-bold">
            العودة للرئيسية
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-navy text-white py-5">
        <div className="max-w-2xl mx-auto px-4 flex items-center justify-between">
          <h1 className="text-xl font-extrabold text-gold">تقديم طلب</h1>
          <button onClick={() => navigate('/')} className="text-gray-300 text-sm hover:text-gold">رجوع</button>
        </div>
      </header>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col gap-4">
          <Field label="الاسم الكامل *">
            <input value={form.full_name} onChange={(e) => update('full_name', e.target.value)} className="inp" placeholder="الاسم الكامل" />
          </Field>
          <Field label="رقم الهاتف *">
            <input value={form.phone} onChange={(e) => update('phone', e.target.value)} className="inp" placeholder="05xxxxxxxx" inputMode="tel" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="نوع العقار المطلوب">
              <select value={form.property_type} onChange={(e) => update('property_type', e.target.value)} className="inp">
                <option value="">اختر</option>
                {PROPERTY_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="عدد الغرف المطلوب">
              <select value={form.rooms} onChange={(e) => update('rooms', e.target.value)} className="inp">
                <option value="">اختر</option>
                {ROOM_OPTIONS.map((r) => <option key={r}>{r}</option>)}
              </select>
            </Field>
          </div>
          <Field label="نطاق السعر (ريال)">
            <div className="flex items-center gap-2">
              <input value={form.price_from} onChange={(e) => update('price_from', e.target.value)} className="inp" placeholder="من" inputMode="numeric" />
              <span className="text-gray-400">—</span>
              <input value={form.price_to} onChange={(e) => update('price_to', e.target.value)} className="inp" placeholder="إلى" inputMode="numeric" />
            </div>
          </Field>
          <Field label="الموقع المفضل">
            <input value={form.preferred_location} onChange={(e) => update('preferred_location', e.target.value)} className="inp" placeholder="الحي أو المنطقة" />
          </Field>
          <Field label="ملاحظات إضافية">
            <textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} className="inp h-24 resize-none" placeholder="اختياري" />
          </Field>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button onClick={submit} disabled={sending}
            className="bg-gold text-navy py-3 rounded-xl font-bold hover:bg-gold/90 disabled:opacity-50">
            {sending ? 'جارٍ الإرسال...' : 'إرسال الطلب'}
          </button>
        </div>
      </div>
      <style>{`.inp{width:100%;border:1px solid #e5e7eb;border-radius:0.6rem;padding:0.6rem 0.75rem;font-size:0.95rem}.inp:focus{outline:none;border-color:#C9A84C}`}</style>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm text-navy font-medium mb-1.5">{label}</label>
      {children}
    </div>
  )
}
