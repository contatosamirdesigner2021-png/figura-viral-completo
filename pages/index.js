import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Head from 'next/head'

const STYLES = [
  { nome: 'Bold Feminino', bg: 'linear-gradient(135deg,#FF4081,#E040FB)', textColor: '#fff', fontStyle: { fontSize: 18, fontWeight: 900, fontFamily: 'Georgia,serif', textShadow: '1px 1px 3px rgba(0,0,0,0.3)' }, border: 'none' },
  { nome: 'Minimalista', bg: '#fff', textColor: '#2D0A4E', fontStyle: { fontSize: 15, fontWeight: 700, letterSpacing: -0.5 }, border: '3px solid #E040FB' },
  { nome: 'Neon Roxo', bg: 'linear-gradient(135deg,#1a0030,#2D0A4E)', textColor: '#E040FB', fontStyle: { fontSize: 15, fontWeight: 800, fontFamily: 'monospace', letterSpacing: 1, textShadow: '0 0 8px #E040FB' }, border: '2px solid #E040FB' },
  { nome: 'Aquarela Rosa', bg: 'linear-gradient(160deg,#FBEAF0,#F4C0D1,#ED93B1)', textColor: '#72243E', fontStyle: { fontSize: 15, fontWeight: 700, fontFamily: 'Georgia,serif', fontStyle: 'italic' }, border: 'none' },
  { nome: 'Colorful Pop', bg: 'linear-gradient(135deg,#7B2D8B,#C2185B,#FF4081)', textColor: '#fff', fontStyle: { fontSize: 15, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase' }, border: '3px solid #fff' },
]

export default function Home() {
  const [user, setUser] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [frase, setFrase] = useState('')
  const [figurinhas, setFigurinhas] = useState([])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [toast, setToast] = useState('')
  const [modal, setModal] = useState('') // 'login' | 'cadastro' | 'planos'
  const [authEmail, setAuthEmail] = useState('')
  const [authSenha, setAuthSenha] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user)
        carregarPerfil(session.access_token)
      }
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user)
        carregarPerfil(session.access_token)
      } else {
        setUser(null)
        setPerfil(null)
      }
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  async function carregarPerfil(token) {
    try {
      const res = await fetch('/api/perfil', { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      setPerfil(data)
    } catch (e) {}
  }

  async function cadastrar() {
    setAuthLoading(true)
    const { error } = await supabase.auth.signUp({ email: authEmail, password: authSenha })
    setAuthLoading(false)
    if (error) return showToast('Erro: ' + error.message)
    showToast('Cadastro feito! Verifique seu email.')
    setModal('')
  }

  async function login() {
    setAuthLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authSenha })
    setAuthLoading(false)
    if (error) return showToast('Email ou senha incorretos')
    showToast('Bem-vinda! 🎉')
    setModal('')
  }

  async function logout() {
    await supabase.auth.signOut()
    showToast('Até logo!')
  }

  async function gerarFigurinhas() {
    if (!frase.trim()) return showToast('Digite uma frase primeiro!')
    if (!user) return setModal('login')

    setLoading(true)
    setErro('')
    setFigurinhas([])

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/gerar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frase, token: session.access_token })
      })
      const data = await res.json()

      if (res.status === 403 && data.erro === 'limite_atingido') {
        setErro('limite')
        return
      }
      if (!res.ok) throw new Error(data.erro || 'Erro desconhecido')

      setFigurinhas(data.figurinhas || [])
      carregarPerfil(session.access_token)
    } catch (e) {
      showToast('Erro: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const planoLabel = perfil?.planoAtivo
    ? perfil.plano === 'agencia' ? 'Plano Agência ★' : 'Plano Pro ✦'
    : 'Plano Gratuito'

  return (
    <>
      <Head>
        <title>Figura Viral — Crie figurinhas com IA</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={s.wrap}>
        {/* NAV */}
        <nav style={s.nav}>
          <div style={s.logo}>
            <div style={s.logoIcon}>✦</div>
            Figura <span style={{ color: '#E040FB' }}>Viral</span>
          </div>
          <div style={s.navRight}>
            {user ? (
              <>
                <span style={s.planBadge}>{planoLabel}</span>
                {(!perfil?.planoAtivo) && (
                  <button style={s.btnNav} onClick={() => setModal('planos')}>⚡ Upgrade</button>
                )}
                <button style={{ ...s.btnNav, ...s.btnOutline }} onClick={logout}>Sair</button>
              </>
            ) : (
              <>
                <button style={{ ...s.btnNav, ...s.btnOutline }} onClick={() => setModal('login')}>Entrar</button>
                <button style={s.btnNav} onClick={() => setModal('cadastro')}>Cadastrar grátis</button>
              </>
            )}
          </div>
        </nav>

        {/* HERO */}
        <div style={s.hero}>
          <div style={s.badge}>✦ Powered by Inteligência Artificial</div>
          <h1 style={s.h1}>Crie figurinhas virais<br /><span style={s.h1Span}>em segundos com IA</span></h1>
          <p style={s.heroP}>Digite qualquer frase e receba 5 figurinhas únicas prontas para seus Stories.</p>

          {/* QUOTA BAR */}
          {user && perfil && (
            <div style={s.quotaBar}>
              <span style={{ fontSize: 20 }}>{perfil.planoAtivo ? '⚡' : perfil.usoHoje >= 1 ? '🔒' : '🎯'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>
                  {perfil.planoAtivo
                    ? perfil.plano === 'agencia' ? 'Plano Agência — ilimitado · até 10 usuários' : 'Plano Pro — figurinhas ilimitadas'
                    : 'Plano Gratuito — 1 figurinha por dia'}
                </div>
                <div style={s.quotaTrack}>
                  <div style={{
                    ...s.quotaFill,
                    width: perfil.planoAtivo ? '100%' : `${Math.min(perfil.usoHoje * 100, 100)}%`,
                    background: perfil.planoAtivo ? 'linear-gradient(90deg,#E040FB,#FF4081)' : perfil.usoHoje >= 1 ? '#FF4081' : 'linear-gradient(90deg,#E040FB,#FF4081)'
                  }} />
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 3 }}>
                  {perfil.planoAtivo ? 'Sem limites' : `${perfil.usoHoje} de 1 usada hoje`}
                </div>
              </div>
              {!perfil.planoAtivo && (
                <span style={s.upgradeLink} onClick={() => setModal('planos')}>Upgrade →</span>
              )}
            </div>
          )}

          {/* SEARCH */}
          <div style={s.searchBox}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
            <input
              style={s.searchInput}
              value={frase}
              onChange={e => setFrase(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && gerarFigurinhas()}
              placeholder="Ex: hora do café, bom dia linda, pilates é vida..."
              maxLength={80}
            />
            <button style={{ ...s.btnGerar, opacity: loading ? 0.6 : 1 }} onClick={gerarFigurinhas} disabled={loading}>
              {loading ? '⏳ Gerando...' : '✦ Gerar Figurinhas'}
            </button>
          </div>

          {/* CHIPS */}
          <div style={s.chips}>
            {['Hora do café', 'Bom dia linda', 'Pilates é vida', 'Sexta feira', 'Home office'].map(c => (
              <div key={c} style={s.chip} onClick={() => { setFrase(c); setTimeout(gerarFigurinhas, 100) }}>
                {c}
              </div>
            ))}
          </div>
        </div>

        {/* STATS */}
        <div style={s.stats}>
          {[['50K+', 'Usuárias ativas'], ['2M+', 'Figurinhas geradas'], ['4.9★', 'Avaliação média']].map(([n, l]) => (
            <div key={l} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#E040FB' }}>{n}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>

        {/* RESULTS */}
        {loading && (
          <div style={s.loading}>
            <div style={s.loader} />
            A IA está criando suas figurinhas...
          </div>
        )}

        {erro === 'limite' && (
          <div style={s.bloqueio}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Limite diário atingido</h3>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: 20, lineHeight: 1.6 }}>
              No plano gratuito você pode gerar <strong>1 figurinha por dia</strong>.<br />
              Assine o <strong>Plano Pro por R$14,90/mês</strong> e crie figurinhas ilimitadas!
            </p>
            <button style={s.btnBloqueio} onClick={() => setModal('planos')}>⚡ Ver planos</button>
            <p style={{ marginTop: 12, fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Cota reseta à meia-noite</p>
          </div>
        )}

        {figurinhas.length > 0 && (
          <div style={{ maxWidth: 860, margin: '24px auto', padding: '0 20px' }}>
            <div style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 16 }}>
              5 figurinhas criadas para "<strong>{frase}</strong>"
            </div>
            <div style={s.grid}>
              {figurinhas.map((fig, i) => {
                const st = STYLES[i]
                return (
                  <div key={i} style={s.card}>
                    <div style={{ ...s.preview, background: st.bg, border: st.border }}>
                      <div style={{ fontSize: 26 }}>{fig.emoji}</div>
                      <div style={{ ...st.fontStyle, color: st.textColor }}>{fig.texto}</div>
                      {fig.tagline && <div style={{ fontSize: 10, color: st.textColor, opacity: 0.7 }}>{fig.tagline}</div>}
                    </div>
                    <div style={s.cardLabel}>{st.nome}</div>
                    <div style={s.cardActions}>
                      <button style={s.btnDl} onClick={() => showToast('Baixando PNG...')}>⬇ Baixar</button>
                      <button style={s.btnCopy} onClick={() => {
                        navigator.clipboard.writeText(`${fig.texto} ${fig.emoji}`)
                        showToast('Copiado!')
                      }}>⎘ Copiar</button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* SOCIALS */}
        <div style={s.socials}>
          <a href="https://www.instagram.com/samirproducoes/" target="_blank" rel="noopener" style={s.socialLink}>
            <div style={{ ...s.socialIcon, background: 'linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8">
                <rect x="2" y="2" width="20" height="20" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1" fill="#fff" stroke="none" />
              </svg>
            </div>
            <span style={s.socialLbl}>@samirproducoes</span>
          </a>
          <a href="https://wa.me/message/ZRX7VZHOML7HD1" target="_blank" rel="noopener" style={s.socialLink}>
            <div style={{ ...s.socialIcon, background: '#25D366' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
            </div>
            <span style={s.socialLbl}>WhatsApp</span>
          </a>
        </div>

        <div style={s.footer}>© 2026 Figura Viral · Todos os direitos reservados</div>
      </div>

      {/* MODAL LOGIN / CADASTRO */}
      {(modal === 'login' || modal === 'cadastro') && (
        <div style={s.modalBg} onClick={e => e.target === e.currentTarget && setModal('')}>
          <div style={s.modal}>
            <button style={s.modalClose} onClick={() => setModal('')}>✕</button>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>✦</div>
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>{modal === 'login' ? 'Entrar na sua conta' : 'Criar conta grátis'}</h2>
            </div>
            <input style={s.authInput} type="email" placeholder="Seu email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} />
            <input style={s.authInput} type="password" placeholder="Senha" value={authSenha} onChange={e => setAuthSenha(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (modal === 'login' ? login() : cadastrar())} />
            <button style={{ ...s.btnNav, width: '100%', padding: '13px', fontSize: 15, borderRadius: 12, marginTop: 8 }}
              onClick={modal === 'login' ? login : cadastrar} disabled={authLoading}>
              {authLoading ? 'Aguarde...' : modal === 'login' ? 'Entrar' : 'Criar conta grátis'}
            </button>
            <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
              {modal === 'login'
                ? <span>Não tem conta? <span style={{ color: '#E040FB', cursor: 'pointer' }} onClick={() => setModal('cadastro')}>Cadastre-se</span></span>
                : <span>Já tem conta? <span style={{ color: '#E040FB', cursor: 'pointer' }} onClick={() => setModal('login')}>Entrar</span></span>
              }
            </p>
          </div>
        </div>
      )}

      {/* MODAL PLANOS */}
      {modal === 'planos' && (
        <div style={s.modalBg} onClick={e => e.target === e.currentTarget && setModal('')}>
          <div style={{ ...s.modal, maxWidth: 700 }}>
            <button style={s.modalClose} onClick={() => setModal('')}>✕</button>
            <h2 style={{ fontSize: 20, fontWeight: 700, textAlign: 'center', marginBottom: 6 }}>Escolha seu plano</h2>
            <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 24 }}>Cancele quando quiser · Cobrança mensal automática via Kiwify</p>
            <div style={s.plansGrid}>
              {[
                { nome: 'Gratuito', preco: 'R$0', desc: 'Para experimentar', features: ['1 figurinha por dia', '3 estilos', 'Download PNG'], btn: 'Plano atual', style: 'outline', link: null },
                { nome: 'Pro ✦', preco: 'R$14,90', desc: '/mês · ilimitado', features: ['Figurinhas ilimitadas', '5 estilos por geração', 'PNG fundo transparente', 'Histórico completo', 'Stories otimizado'], btn: 'Assinar agora', style: 'pink', link: 'https://pay.kiwify.com.br/Fuk6SV7', popular: true },
                { nome: 'Agência ★', preco: 'R$79,90', desc: '/mês · equipes', features: ['Até 10 usuários', 'Tudo do Pro', 'API integração', 'Marca personalizada', 'Suporte prioritário'], btn: 'Assinar agora', style: 'gold', link: 'https://pay.kiwify.com.br/9eDfiLJ' },
              ].map(p => (
                <div key={p.nome} style={{ ...s.planCard, ...(p.popular ? s.planPopular : {}) }}>
                  {p.popular && <div style={s.planBadge}>✦ Mais popular</div>}
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>{p.nome}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 2 }}>{p.preco}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 14 }}>{p.desc}</div>
                  <ul style={{ listStyle: 'none', marginBottom: 18 }}>
                    {p.features.map(f => (
                      <li key={f} style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', padding: '3px 0', display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: p.style === 'gold' ? 'gold' : '#E040FB', flexShrink: 0, display: 'inline-block' }} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  {p.link
                    ? <a href={p.link} target="_blank" rel="noopener" style={{ ...s.btnAssinar, background: p.style === 'gold' ? 'gold' : 'linear-gradient(135deg,#E040FB,#FF4081)', color: p.style === 'gold' ? '#2D0A4E' : '#fff', textDecoration: 'none', display: 'block', textAlign: 'center' }}>
                      {p.btn}
                    </a>
                    : <button style={{ ...s.btnAssinar, background: 'transparent', border: '1px solid rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.7)' }}>{p.btn}</button>
                  }
                </div>
              ))}
            </div>
            <div style={s.kiwifyInfo}>
              <strong style={{ color: '#4ade80' }}>🔒 Pagamento 100% seguro via Kiwify</strong> · Aceita PIX, cartão e boleto · Acesso liberado automaticamente após confirmação do pagamento
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div style={s.toast}>{toast}</div>
      )}

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  )
}

const s = {
  wrap: { background: 'linear-gradient(135deg,#2D0A4E 0%,#4A1060 40%,#7B2D8B 70%,#C2185B 100%)', minHeight: '100vh', color: '#fff' },
  nav: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', borderBottom: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.2)', flexWrap: 'wrap', gap: 10 },
  logo: { display: 'flex', alignItems: 'center', gap: 10, fontSize: 20, fontWeight: 700 },
  logoIcon: { width: 36, height: 36, background: 'linear-gradient(135deg,#E040FB,#FF4081)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 },
  navRight: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  planBadge: { fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: 'rgba(224,64,251,0.25)', border: '1px solid rgba(224,64,251,0.4)', color: '#F3A0FF' },
  btnNav: { background: 'linear-gradient(135deg,#E040FB,#FF4081)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  btnOutline: { background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', color: 'rgba(255,255,255,0.8)' },
  hero: { textAlign: 'center', padding: '40px 24px 24px' },
  badge: { display: 'inline-block', background: 'rgba(224,64,251,0.25)', border: '1px solid rgba(224,64,251,0.5)', color: '#F3A0FF', fontSize: 12, padding: '4px 14px', borderRadius: 20, marginBottom: 14 },
  h1: { fontSize: 'clamp(24px,5vw,38px)', fontWeight: 800, lineHeight: 1.15, marginBottom: 10 },
  h1Span: { background: 'linear-gradient(90deg,#E040FB,#FF4081)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  heroP: { fontSize: 15, color: 'rgba(255,255,255,0.7)', maxWidth: 500, margin: '0 auto 24px', lineHeight: 1.6 },
  quotaBar: { maxWidth: 500, margin: '0 auto 20px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 },
  quotaTrack: { height: 6, background: 'rgba(255,255,255,0.15)', borderRadius: 10, overflow: 'hidden' },
  quotaFill: { height: '100%', borderRadius: 10, transition: 'width 0.4s' },
  upgradeLink: { fontSize: 11, fontWeight: 700, color: '#E040FB', cursor: 'pointer', textDecoration: 'underline', whiteSpace: 'nowrap' },
  searchBox: { maxWidth: 620, margin: '0 auto', background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(224,64,251,0.5)', borderRadius: 50, display: 'flex', alignItems: 'center', padding: '6px 6px 6px 18px', gap: 8 },
  searchInput: { flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 14 },
  btnGerar: { background: 'linear-gradient(135deg,#E040FB,#FF4081)', color: '#fff', border: 'none', padding: '11px 20px', borderRadius: 40, fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' },
  chips: { maxWidth: 620, margin: '12px auto 0', display: 'flex', flexWrap: 'wrap', gap: 7, justifyContent: 'center' },
  chip: { background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.8)', fontSize: 11, padding: '4px 11px', borderRadius: 20, cursor: 'pointer' },
  stats: { display: 'flex', justifyContent: 'center', gap: 28, padding: '20px 24px', maxWidth: 540, margin: '0 auto' },
  loading: { textAlign: 'center', padding: 36, color: 'rgba(255,255,255,0.65)', fontSize: 14 },
  loader: { width: 36, height: 36, border: '3px solid rgba(224,64,251,0.3)', borderTopColor: '#E040FB', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 14px' },
  bloqueio: { maxWidth: 500, margin: '24px auto', background: 'rgba(224,64,251,0.1)', border: '1.5px solid rgba(224,64,251,0.4)', borderRadius: 16, padding: '28px 24px', textAlign: 'center' },
  btnBloqueio: { background: 'linear-gradient(135deg,#E040FB,#FF4081)', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: 30, fontSize: 14, fontWeight: 700, cursor: 'pointer' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(155px,1fr))', gap: 14 },
  card: { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 14, overflow: 'hidden' },
  preview: { width: '100%', aspectRatio: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14, textAlign: 'center', flexDirection: 'column', gap: 5 },
  cardLabel: { fontSize: 10, color: 'rgba(255,255,255,0.5)', padding: '6px 10px', borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' },
  cardActions: { display: 'flex', gap: 5, padding: '7px 8px' },
  btnDl: { flex: 1, background: 'rgba(224,64,251,0.2)', border: '1px solid rgba(224,64,251,0.4)', color: '#F3A0FF', fontSize: 10, padding: '5px 4px', borderRadius: 7, cursor: 'pointer', fontWeight: 600 },
  btnCopy: { flex: 1, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.75)', fontSize: 10, padding: '5px 4px', borderRadius: 7, cursor: 'pointer', fontWeight: 600 },
  socials: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, padding: 24, borderTop: '1px solid rgba(255,255,255,0.1)' },
  socialLink: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, textDecoration: 'none' },
  socialIcon: { width: 48, height: 48, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  socialLbl: { fontSize: 10, color: 'rgba(255,255,255,0.55)', fontWeight: 500 },
  footer: { textAlign: 'center', padding: '14px 24px 22px', fontSize: 11, color: 'rgba(255,255,255,0.35)' },
  modalBg: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modal: { background: 'linear-gradient(135deg,#2D0A4E,#4A1060)', border: '1px solid rgba(224,64,251,0.4)', borderRadius: 20, padding: '28px 24px', width: '100%', maxWidth: 440, maxHeight: '90vh', overflowY: 'auto', position: 'relative' },
  modalClose: { position: 'absolute', top: 14, right: 16, background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: 28, height: 28, borderRadius: '50%', cursor: 'pointer', fontSize: 14 },
  authInput: { width: '100%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, padding: '12px 16px', color: '#fff', fontSize: 14, marginBottom: 10, outline: 'none' },
  plansGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14 },
  planCard: { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 14, padding: '20px 16px', textAlign: 'center', position: 'relative' },
  planPopular: { borderColor: '#E040FB', background: 'rgba(224,64,251,0.12)' },
  planBadge: { position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg,#E040FB,#FF4081)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 12px', borderRadius: 20, whiteSpace: 'nowrap' },
  btnAssinar: { width: '100%', border: 'none', padding: 10, borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer' },
  kiwifyInfo: { marginTop: 20, background: 'rgba(0,180,100,0.1)', border: '1px solid rgba(0,180,100,0.3)', borderRadius: 12, padding: '12px 16px', fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 },
  toast: { position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#E040FB', color: '#fff', fontSize: 13, fontWeight: 600, padding: '9px 22px', borderRadius: 30, zIndex: 999 },
}
