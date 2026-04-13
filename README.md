# 🎉 Figura Viral — Guia Completo de Deploy

## O que está incluso
- ✅ Frontend completo (Next.js)
- ✅ Login e cadastro (Supabase Auth)
- ✅ Limite de 1 figurinha/dia (plano free)
- ✅ Plano Pro ilimitado
- ✅ Plano Agência (10 usuários)
- ✅ Webhook Kiwify (libera acesso automático)
- ✅ Geração de figurinhas com IA (Claude)
- ✅ Links sociais (Instagram + WhatsApp)

---

## PASSO 1 — Configurar o banco de dados (Supabase)

1. Acesse https://supabase.com → seu projeto
2. Clique em **SQL Editor** no menu esquerdo
3. Copie todo o conteúdo do arquivo `supabase-schema.sql`
4. Cole no editor e clique em **Run**
5. Pronto! Tabelas criadas ✅

---

## PASSO 2 — Pegar sua chave da API Anthropic (Claude)

1. Acesse https://console.anthropic.com
2. Clique em **API Keys** → **Create Key**
3. Copie a chave (começa com `sk-ant-...`)
4. Guarde para o próximo passo

---

## PASSO 3 — Configurar webhook na Kiwify

1. Acesse sua conta Kiwify
2. Vá em **Configurações** → **Webhooks**
3. Adicione a URL: `https://SEU-DOMINIO.vercel.app/api/webhook-kiwify`
4. Selecione os eventos:
   - `order_approved`
   - `subscription_active`
   - `subscription_canceled`
   - `subscription_expired`
5. Salve e copie o **token/secret** gerado

---

## PASSO 4 — Deploy no Vercel (GRATUITO)

1. Acesse https://vercel.com → crie conta com GitHub
2. Faça upload do projeto ou conecte ao GitHub
3. Na configuração do projeto, adicione as **variáveis de ambiente**:

```
NEXT_PUBLIC_SUPABASE_URL=https://xibroqchhgcgtcfjfwvt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_N-ksiPEoRN6hlSLvHOdf1g_FtcAmEUr
SUPABASE_SERVICE_ROLE_KEY=sb_secret_JN0foUAhvr-lDHbG04wjCA_5lefgKK3
ANTHROPIC_API_KEY=sk-ant-SUA_CHAVE_AQUI
KIWIFY_WEBHOOK_SECRET=SEU_SECRET_KIWIFY
NEXT_PUBLIC_KIWIFY_PRO_URL=https://pay.kiwify.com.br/Fuk6SV7
NEXT_PUBLIC_KIWIFY_AGENCIA_URL=https://pay.kiwify.com.br/9eDfiLJ
```

4. Clique em **Deploy** 🚀
5. Copie a URL gerada (ex: `figura-viral.vercel.app`)
6. Volte na Kiwify e atualize o webhook com essa URL

---

## PASSO 5 — Testar tudo

1. Acesse seu site no Vercel
2. Crie uma conta de teste
3. Tente gerar uma figurinha (deve funcionar — 1/dia free)
4. Tente gerar outra (deve bloquear e mostrar tela de upgrade)
5. Clique em "Assinar" → vai para Kiwify → conclua o pagamento
6. Volte ao site → acesso deve estar liberado automaticamente

---

## Estrutura de arquivos

```
figuraviral/
├── pages/
│   ├── index.js          ← Página principal
│   ├── _app.js
│   └── api/
│       ├── gerar.js       ← Gera figurinhas (controla limite)
│       ├── perfil.js      ← Retorna plano do usuário
│       └── webhook-kiwify.js ← Recebe pagamentos Kiwify
├── lib/
│   └── supabase.js        ← Conexão com banco de dados
├── supabase-schema.sql    ← SQL para criar as tabelas
├── .env.local             ← Variáveis de ambiente
├── next.config.js
└── package.json
```

---

## Suporte
Instagram: @samirproducoes
WhatsApp: https://wa.me/message/ZRX7VZHOML7HD1
