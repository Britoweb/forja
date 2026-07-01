# FORJA

Sistema pessoal de transformação comportamental — gamificação com
integridade, não pontos vazios. Ver `docs/SPEC.md` para a especificação
completa antes de escrever qualquer código.

## Ordem de leitura recomendada

1. `docs/SPEC.md` — visão geral, decisões de arquitetura, por que cada
   coisa é do jeito que é
2. `schema.sql` — schema completo do banco (rodar no SQL editor do Supabase)
3. `docs/DETECTION_RULES.md` — regras de detecção de inconsistência
4. `docs/BOOK_CATALOG.md` — seed de livros para o learning path
5. `docs/DESIGN_TOKENS.md` — paleta, tipografia e espaçamento (WCAG AA)
6. `docs/ACCESSIBILITY_CHECKLIST.md` — checklist por tipo de componente
7. `cursorrules.txt` — regras de engenharia (também em `.cursor/rules/`)

## Como usar este pacote no Cursor

1. Abra esta pasta como projeto no Cursor
2. Rode `npm install` (ver `package.json` para as dependências já
   pré-selecionadas)
3. Crie um projeto no [supabase.com](https://supabase.com), copie a URL e a
   `anon key` para um arquivo `.env` (baseado em `.env.example`)
4. No SQL Editor do Supabase, cole e rode `schema.sql` inteiro
5. No chat do Cursor, cole o conteúdo de `docs/SPEC.md` como contexto antes
   de pedir para gerar as primeiras telas — isso evita que a IA do editor
   invente uma arquitetura diferente da que foi validada aqui

## Ordem de implementação (Fases)

Ver seção 12 de `docs/SPEC.md`. Resumo:

1. **Fase 1** — Auth + schema + RLS + PWA shell + dashboard mínimo
2. **Fase 2** — Quests (versionamento, streaks, evolução automática)
3. **Fase 3** — Flashcards (SM-2) + notificações push
4. **Fase 4** — Detecção de inconsistências + relatório exportável
5. **Fase 5** — Biblioteca
6. **Fase 6** — Learning paths / livro do mês

Recomendação: use a Fase 1–2 por ~3 semanas antes de seguir adiante, para
não construir em cima de um hábito que ainda não se firmou.

## Stack

- React + Vite
- Supabase (Postgres + Auth + Row Level Security)
- Dexie.js (IndexedDB) para offline-first
- Service Worker + Web App Manifest para instalação como PWA
- Sem dependência de IA generativa nesta fase — todas as regras de
  detecção e evolução de quests são lógica determinística (ver
  `docs/DETECTION_RULES.md`)

## Segurança — não pule isto

- RLS está habilitado em `schema.sql` para toda tabela com `user_id`.
  Confirme que está ativo no painel do Supabase antes de colocar dados
  reais.
- Use sempre a `anon key` no frontend. Nunca a `service_role key`.
- Dados armazenados aqui incluem reflexões pessoais sensíveis — trate o
  `.env` como segredo (já está no `.gitignore`).
