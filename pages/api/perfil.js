import { supabaseAdmin } from '../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ erro: 'Token necessário' })

  const db = supabaseAdmin()
  const { data: { user }, error } = await db.auth.getUser(token)
  if (error || !user) return res.status(401).json({ erro: 'Não autenticado' })

  const { data: profile } = await db
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Uso de hoje
  const hoje = new Date().toISOString().slice(0, 10)
  const { data: uso } = await db
    .from('uso_diario')
    .select('quantidade')
    .eq('user_id', user.id)
    .eq('data', hoje)
    .single()

  return res.status(200).json({
    plano: profile?.plano || 'free',
    planoAtivo: profile?.plano_ativo || false,
    email: user.email,
    usoHoje: uso?.quantidade || 0,
    limiteHoje: (profile?.plano === 'free' || !profile?.plano_ativo) ? 1 : 999999
  })
}
