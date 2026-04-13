import Anthropic from '@anthropic-ai/sdk'
import { supabaseAdmin } from '../../lib/supabase'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' })

  const { frase, token } = req.body
  if (!frase) return res.status(400).json({ erro: 'Frase obrigatória' })

  const db = supabaseAdmin()

  // Verificar usuário pelo token JWT
  const { data: { user }, error: authError } = await db.auth.getUser(token)
  if (authError || !user) return res.status(401).json({ erro: 'Não autenticado' })

  // Buscar perfil e plano
  const { data: profile } = await db
    .from('profiles')
    .select('plano, plano_ativo')
    .eq('id', user.id)
    .single()

  const plano = profile?.plano || 'free'
  const planoAtivo = profile?.plano_ativo || false

  // Verificar limite do plano free
  if (plano === 'free' || !planoAtivo) {
    const hoje = new Date().toISOString().slice(0, 10)
    const { data: uso } = await db
      .from('uso_diario')
      .select('quantidade')
      .eq('user_id', user.id)
      .eq('data', hoje)
      .single()

    const qtdUsada = uso?.quantidade || 0
    if (qtdUsada >= 1) {
      return res.status(403).json({
        erro: 'limite_atingido',
        mensagem: 'Você atingiu o limite diário do plano gratuito.',
        usado: qtdUsada,
        limite: 1
      })
    }
  }

  // Gerar figurinhas com IA
  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Você é um criador de figurinhas para Instagram Stories e WhatsApp no Brasil.
Para a frase: "${frase}"
Crie 5 variações criativas e diferentes com texto, emoji (1-2), tagline curta (máx 3 palavras).
Responda APENAS com JSON, sem markdown:
{"figurinhas":[{"texto":"...","emoji":"...","tagline":"..."},{"texto":"...","emoji":"...","tagline":"..."},{"texto":"...","emoji":"...","tagline":"..."},{"texto":"...","emoji":"...","tagline":"..."},{"texto":"...","emoji":"...","tagline":"..."}]}`
      }]
    })

    const raw = message.content[0].text.replace(/```json|```/g, '').trim()
    const resultado = JSON.parse(raw)

    // Registrar uso diário (plano free)
    if (plano === 'free' || !planoAtivo) {
      const hoje = new Date().toISOString().slice(0, 10)

      const { data: usoExiste } = await db
        .from('uso_diario')
        .select('id, quantidade')
        .eq('user_id', user.id)
        .eq('data', hoje)
        .single()

      if (usoExiste) {
        await db
          .from('uso_diario')
          .update({ quantidade: (usoExiste.quantidade || 0) + 1 })
          .eq('user_id', user.id)
          .eq('data', hoje)
      } else {
        await db
          .from('uso_diario')
          .insert({ user_id: user.id, data: hoje, quantidade: 1 })
      }
    }

    // Salvar no histórico
    await db.from('figurinhas').insert({
      user_id: user.id,
      frase,
      resultado
    })

    return res.status(200).json(resultado)

  } catch (e) {
    console.error(e)
    return res.status(500).json({ erro: 'Erro ao gerar figurinhas', detalhe: e.message })
  }
}
