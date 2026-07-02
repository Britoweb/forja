-- Remove todos os flashcards gerados por quests (inclui duplicatas do bug de multi-clique).
-- Mantém: starters A/B/C, estudo livre e cards manuais.
-- Rode no SQL Editor do Supabase (reviews são removidos em cascade).

-- Pré-visualizar:
-- select id, front, deck, source, quest_id, preset_id
-- from flashcards
-- where quest_id is not null
--    or source = 'quest_generated'
--    or preset_id is not null
--    or front ilike 'Pratico:%';

delete from flashcards
where quest_id is not null
   or source = 'quest_generated'
   or preset_id is not null
   or front ilike 'Pratico:%';
