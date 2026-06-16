import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { PROPERTY_TYPES, STATUSES } from '../constants'
import PropertyCard from '../components/PropertyCard'

export default function PublicSite() {
  const navigate = useNavigate()
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [type, setType] = useState('الكل')
  const [rooms, setRooms] = useState('الكل')
  const [maxPrice, setMaxPrice] = useState(100000)
  const [status, setStatus] = useState('الكل')
  const [sort, setSort] = useState('newest')

  useEffect(() => {
    loadProperties()
    const channel = supabase
      .channel('public-properties')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'properties' }, loadProperties)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  async function loadProperties() {
    const { data } = await supabase.from('properties').select('*').order('created_at', { ascending: false })
    setProperties(data || [])
    setLoading(false)
  }

  const filtered = useMemo(() => {
    let list = [...properties]
    if (type !== 'الكل') list = list.filter((p) => p.property_type === type)
    if (rooms !== 'الكل') {
      if (rooms === '5+') list = list.filter((p) => p.rooms >= 5)
      else list = list.filter((p) => p.rooms === Number(rooms))
    }
    list = list.filter((p) => Number(p.price) <= maxPrice)
    if (status !== 'الكل') list = list.filter((p) => p.status === status)
    if (sort === 'cheapest') list.sort((a, b) => a.price - b.price)
    else if (sort === 'expensive') list.sort((a, b) => b.price - a.price)
    else list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    return list
  }, [properties, type, rooms, maxPrice, status, sort])

  function handleRequest(property) {
    navigate('/request', { state: { propertyType: property?.property_type } })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-navy text-white">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-gold">مكتب الهويمل للعقارات</h1>
              <p className="text-gray-200 mt-2 text-sm md:text-base">
                نغطي جميع مناطق المملكة ونعرض هنا عروضنا في الرياض
              </p>
              <p className="text-gray-400 mt-1 text-xs md:text-sm">
                نستقبل عروضكم (بيع وشراء وتأجير وإدارة أملاك) - مقرنا الرياض - حي الحزم
              </p>
            </div>
            <button onClick={() => navigate('/admin')}
              className="text-gray-400 text-xs hover:text-gold transition-colors whitespace-nowrap">
              دخول لوحة التحكم
            </button>
          </div>
          <button onClick={() => handleRequest()}
            className="mt-5 bg-gold text-navy px-6 py-2.5 rounded-xl font-bold hover:bg-gold/90 transition-colors">
            تقديم طلب
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-5">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 grid grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">نوع العقار</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm">
              <option>الكل</option>
              {PROPERTY_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">عدد الغرف</label>
            <select value={rooms} onChange={(e) => setRooms(e.target.value)} className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm">
              <option>الكل</option>
              {['1','2','3','4','5+'].map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">الحالة</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm">
              <option value="الكل">الكل</option>
              {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">ترتيب</label>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm">
              <option value="newest">الأحدث</option>
              <option value="cheapest">الأرخص</option>
              <option value="expensive">الأغلى</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">أقصى سعر: {Number(maxPrice).toLocaleString('en-US')}</label>
            <input type="range" min="0" max="100000" step="1000" value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))} className="w-full accent-gold mt-2" />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-10">
        {loading ? (
          <p className="text-center text-gray-400 py-10">جارٍ التحميل...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-400 py-10">لا توجد عقارات مطابقة</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((p) => <PropertyCard key={p.id} property={p} onRequest={handleRequest} />)}
          </div>
        )}
      </div>
    </div>
  )
}
