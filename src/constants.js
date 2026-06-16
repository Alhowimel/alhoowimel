export const PROPERTY_TYPES = ['غرفة', 'شقة', 'دور', 'منزل', 'فيلا']

export const ROOM_OPTIONS = ['1', '2', '3', '4', '5+']

export const CONDITIONS = [
  { value: 'new', label: 'جديد' },
  { value: 'renovated', label: 'مجدد' },
  { value: 'used', label: 'مستخدم' },
]

export const STATUSES = [
  { value: 'available', label: 'متاح', color: '#1F9D55', bg: '#E6F6ED' },
  { value: 'rented', label: 'مؤجر', color: '#C0392B', bg: '#FBEAEA' },
  { value: 'pending', label: 'معلق', color: '#D68910', bg: '#FCF3E3' },
]

export const FEATURES = [
  'مطبخ راكب', 'سطح', 'مدخل سيارة', 'مدخل مستقل', 'مدخل مشترك',
  'مكيفات سبليت', 'ملحق', 'مجلس', 'مقلط',
  'خدمات مشمولة (ماء وكهرباء)', 'غرفة ماستر',
]

export function statusInfo(status) {
  return STATUSES.find((s) => s.value === status) || STATUSES[0]
}

export function conditionLabel(c) {
  return CONDITIONS.find((x) => x.value === c)?.label || c
}

export function formatPrice(price, period) {
  const n = Number(price).toLocaleString('en-US')
  return `${n} ريال ${period === 'monthly' ? 'شهري' : 'سنوي'}`
}

export function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleString('ar-SA', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}
