import { supabaseAdmin } from '../../lib/supabase'
import crypto from 'crypto'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const db = supabaseAdmin()
  const payload = req.body

  // Log do webhook
  await db.from('webhooks_kiwify').insert({
    evento: payload.event || 'desconhecido',
    payload
  })

  const email = payload?.Customer?.email || payload?.customer?.email
  const evento = payload?.event || payload?.type

  if (!email) return res.status(200).json({ ok: true })

  // Identificar plano pelo produto
  const productId = payload?.Product?.id || payload?.product_id || ''
  const orderValue = payload?.Order?.amount || payload?.amount || 0

  let plano = 'pro'
  if (orderValue >= 7990 || productId.includes('agencia')) {
    plano = 'agencia'
  }

  // Processar evento
  if (
    evento === 'order_approved' ||
    evento === 'subscription_active' ||
    evento === 'order.approved'
  ) {
    // Ativar plano do usuário
    const { error } = await db
      .from('profiles')
      .update({
        plano,
        plano_ativo: true,
        kiwify_subscriber_id: payload?.subscription_id || payload?.order_id || null,
        assinatura_inicio: new Date().toISOString(),
        assinatura_fim: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString(),
        atualizado_em: new Date().toISOString()
      })
      .eq('email', email)

    if (error) {
      // Usuário pode não ter conta ainda - criar registro pendente
      console.log('Perfil não encontrado para:', email)
    }

    console.log(`✅ Plano ${plano} ativado para ${email}`)
  }

  if (
    evento === 'subscription_canceled' ||
    evento === 'subscription_expired' ||
    evento === 'order.refunded'
  ) {
    // Cancelar plano
    await db
      .from('profiles')
      .update({
        plano: 'free',
        plano_ativo: false,
        atualizado_em: new Date().toISOString()
      })
      .eq('email', email)

    console.log(`❌ Plano cancelado para ${email}`)
  }

  return res.status(200).json({ ok: true })
}
