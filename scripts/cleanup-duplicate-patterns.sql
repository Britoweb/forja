-- Remove padrões duplicados (mantém o mais antigo de cada código A/B/C por usuário).
-- Rode no SQL Editor se ainda vir duplicatas após atualizar o app.

delete from patterns p
using patterns keeper
where p.user_id = keeper.user_id
  and p.code = keeper.code
  and p.id <> keeper.id
  and keeper.id = (
    select id
    from patterns
    where user_id = p.user_id and code = p.code
    order by created_at asc
    limit 1
  );

-- Evita novas duplicatas (rode uma vez):
-- create unique index if not exists idx_patterns_user_code
--   on patterns(user_id, code);
