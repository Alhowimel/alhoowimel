import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function login() {
    setError('')
    setLoading(true)
    const { data } = await supabase
      .from('admins')
      .select('*')
      .eq('username', username.trim())
      .eq('password', password)
      .maybeSingle()
    setLoading(false)
    if (!data) { setError('اسم المستخدم أو كلمة المرور غير صحيحة'); return }
    sessionStorage.setItem('admin', JSON.stringify({ username: data.username, full_name: data.full_name, role: data.role }))
    navigate('/admin/dashboard')
  }

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-gold text-2xl font-extrabold">مكتب الهويمل</h1>
          <p className="text-gray-500 text-sm mt-1">لوحة التحكم</p>
        </div>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-navy font-medium mb-1.5">اسم المستخدم</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5"
              onKeyDown={(e) => e.key === 'Enter' && login()} />
          </div>
          <div>
            <label className="block text-sm text-navy font-medium mb-1.5">كلمة المرور</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5"
              onKeyDown={(e) => e.key === 'Enter' && login()} />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button onClick={login} disabled={loading}
            className="bg-navy text-white py-3 rounded-xl font-bold hover:bg-navy/90 disabled:opacity-50">
            {loading ? 'جارٍ الدخول...' : 'دخول'}
          </button>
          <button onClick={() => navigate('/')} className="text-gray-400 text-sm hover:text-navy">
            العودة للموقع
          </button>
        </div>
      </div>
    </div>
  )
}
