# MEO Energia - Repositorios e Ambientes

## GitHub

### Repositorio Principal (DEV + PROD)
- **URL:** https://github.com/ricardomasterdev/meoenergia
- **Owner:** ricardomasterdev
- **Colaborador:** andreoliveira-sudo (Vercel deploy)
- **Branch principal:** main

---

## Supabase

### DEV (desenvolvimento)
- **Projeto:** meoenergia-dev
- **Ref:** uadpzkkjowfarlvlonkx
- **URL:** https://uadpzkkjowfarlvlonkx.supabase.co
- **Dashboard:** https://supabase.com/dashboard/project/uadpzkkjowfarlvlonkx
- **Login dashboard:** jorgeoliveira@meoenergia.com.br

### PROD (producao)
- **Ref:** ztadakijxdleljqjslfh
- **URL:** https://ztadakijxdleljqjslfh.supabase.co
- **Dashboard:** https://supabase.com/dashboard/project/ztadakijxdleljqjslfh

---

## Vercel

### DEV
- **URL:** https://dev1.cdxsistemas.com.br/meo
- **Servidor:** Windows Server (E:\Projeto_meoenergia\sistema)
- **Roda via:** npm run dev (Turbopack)
- **basePath:** /meo

### PROD
- **URL:** https://appmeo.com.br (Vercel)
- **Deploy via:** Vercel conectado ao GitHub (andreoliveira-sudo)
- **basePath:** nenhum (root)

---

## Variaveis de Ambiente (PROD - Vercel)

Configurar no Vercel (Settings > Environment Variables):



> **IMPORTANTE:** As chaves do Supabase PROD sao diferentes das DEV.
> Nunca use chaves DEV em PROD ou vice-versa.

---

## Fluxo de Deploy

1. Desenvolver e testar em DEV (dev1.cdxsistemas.com.br/meo)
2. Commitar e push para main no GitHub
3. Vercel detecta o push e faz deploy automatico em PROD
4. Verificar em https://appmeo.com.br

---

## Banco de Dados - Alinhamento

Ao criar novas tabelas/colunas em DEV, lembrar de replicar em PROD:
- Usar o script C:\temp\compare-schemas.js para comparar schemas
- Executar ALTERs necessarios no SQL Editor do Supabase PROD
- Sempre rodar NOTIFY pgrst, reload schema apos alteracoes
