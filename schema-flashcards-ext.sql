-- Extensão de flashcards: baralhos (Anki) + vínculo com quests
-- Rode no SQL Editor do Supabase se você já criou o schema antes desta atualização.

alter table flashcards
  add column if not exists deck text not null default 'study',
  add column if not exists quest_id uuid references quests(id) on delete set null,
  add column if not exists preset_id text;

create index if not exists idx_flashcards_deck on flashcards(user_id, deck);
create index if not exists idx_flashcards_quest on flashcards(quest_id) where quest_id is not null;

-- Impede mais de um card por quest (mesmo com cliques repetidos)
create unique index if not exists idx_flashcards_unique_quest
  on flashcards(user_id, quest_id)
  where quest_id is not null;

-- Amplia valores aceitos em source (quest_generated usado pelo app)
comment on column flashcards.deck is 'quests | stoicism | patterns | study | library';
comment on column flashcards.quest_id is 'Quest que originou o card, se houver';
comment on column flashcards.preset_id is 'ID do preset de quest, se houver';
