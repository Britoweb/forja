-- =========================================================
-- FORJA — Seed de padrões ao criar usuário (opcional)
-- =========================================================
-- Rode DEPOIS de schema.sql se preferir seed no banco
-- em vez de seed no client (src/lib/patterns.js).
-- =========================================================

create or replace function public.handle_new_user_patterns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.patterns (user_id, code, name, description, target_behavior)
  values
    (
      new.id,
      'A',
      'Comportamento',
      'Generalização de erro pontual em incompetência global; reatividade em conflitos; evitação de desafios.',
      'Responder a falhas com especificidade, não com veredito global sobre quem sou.'
    ),
    (
      new.id,
      'B',
      'Auto-flagelação',
      'Crítica interna severa; assume culpa alheia; nega-se compaixão que daria a qualquer outra pessoa.',
      'Tratar a si mesmo com o mesmo rigor compassivo que aplicaria a um amigo.'
    ),
    (
      new.id,
      'C',
      'Distorção cosmológica',
      'Crença implícita de que sofre de forma excepcional; cria exceções mentais às regras universais.',
      'Aplicar a si mesmo as mesmas leis que aplicaria a qualquer ser humano.'
    );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_patterns on auth.users;

create trigger on_auth_user_created_patterns
  after insert on auth.users
  for each row
  execute function public.handle_new_user_patterns();
