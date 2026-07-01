# FORJA — Especificação Completa do Produto

> Este documento é o contexto mestre do projeto. Cole trechos dele no Cursor
> (Cmd+K / Chat) sempre que pedir para gerar ou revisar código, para que a IA
> do editor entenda o propósito de cada peça, não apenas a sintaxe.

## 1. O que é a FORJA

Sistema pessoal de transformação comportamental para um único usuário
(Rafael). Não é um app de produtividade genérico — é um instrumento de
integridade pessoal: rastreia padrões psicológicos reais, gamifica hábitos
com regras que recompensam consistência verdadeira (não pontos vazios), e
sinaliza inconsistências para autoanálise honesta.

Princípio central: **nada existe no sistema apenas para "estar lá"**. Toda
feature precisa servir a um dos três padrões, ou ao ciclo de hábito →
evidência → consolidação.

## 2. Os três padrões (fixos no conteúdo, mas armazenados como dados, não enum)

| Código | Nome | Descrição |
|---|---|---|
| A | Comportamento | Generalização de erro pontual em incompetência global; reatividade em conflitos; evitação de desafios |
| B | Auto-flagelação | Crítica interna severa ("fraco/menino"); assume culpa alheia; nega-se compaixão que daria a qualquer outra pessoa |
| C | Distorção cosmológica | Crença implícita de que sofre de forma excepcional/diferente dos outros; cria exceções mentais às regras que aplicaria a qualquer pessoa |

Padrão C é considerado a raiz de A e B — quebrar C tende a enfraquecer os outros dois.

## 3. Arquitetura de dados (ver schema.sql para DDL completo)

Decisões de design que **não podem ser simplificadas** sem reabrir esta discussão:

- **Padrões são uma tabela (`patterns`), não um enum fixo no código.** Precisa
  ser possível adicionar um 4º padrão no futuro sem redeploy de schema.
- **Quests versionam (`quest_versions`), nunca fazem UPDATE destrutivo.**
  Quando uma quest "evolui" (ex: academia 3x/semana → 4x/semana com
  progressão de carga), isso cria uma nova versão com `started_at`, e a
  versão anterior recebe `ended_at`. Isso preserva a linha do tempo da
  evolução do hábito.
- **XP é um ledger append-only (`xp_ledger`), nunca um contador que se
  sobrescreve.** O level é sempre `SUM(amount)` calculado, nunca armazenado
  como fonte de verdade. Isso permite auditoria: "de onde veio meu XP esta
  semana?"
- **Flashcards usam o algoritmo SM-2 (SuperMemo/Anki real)**, não um
  espaçamento fixo (1, 3, 7, 14, 30 dias). O intervalo se ajusta por card
  baseado em `ease_factor`, que sobe ou desce conforme a qualidade da sua
  resposta em cada revisão.
- **Reflexões podem referenciar múltiplos padrões**, não apenas um — situações
  reais são multi-causais. Ver `reflection_patterns` (tabela de junção).
- **Toda tabela com `user_id` tem Row Level Security (RLS) habilitado.**
  Não negociável, mesmo com um único usuário — é disciplina de segurança que
  evita desastre se o app crescer ou uma chave vazar.

## 4. Sistema de níveis

- **Level 1–100: "Base"** — formação de hábitos e consciência dos padrões.
  Curva de XP normal.
- **Level 100+: "Modo Filósofo"** — consolidação infinita. Curva de XP fica
  ~5% mais cara por nível (progressão mais lenta e significativa). Não há
  cap superior.
- Ao cruzar o Level 100 pela primeira vez, desbloqueia a **Biblioteca**
  (seção 8).

Fórmula sugerida de XP necessário por nível (ajustável):
```
xp_para_nivel(n) = 100 * n                          se n <= 100
xp_para_nivel(n) = 100 * 100 * (1.05 ^ (n - 100))    se n > 100
```

## 5. Quests — hábitos adaptativos

Cada quest pertence a um `tier` (1: formação, 2: consolidação, 3: maestria).

**Regra de evolução automática**: quando o usuário atinge
`streak_required_to_evolve` dias de conclusão consistente (definido por
quest, ex: 28 dias a ≥90% de taxa de conclusão) em um tier, o sistema:
1. Fecha a `quest_version` atual (`ended_at = now()`)
2. Cria uma nova `quest_version` com `tier + 1` e uma definição mais
   desafiadora (ex: "treinar 3x/semana" → "treinar 4x/semana com
   progressão registrada")
3. Notifica o usuário da evolução como um marco, não como uma tarefa nova

**Regra de regressão**: se o usuário quebra o streak de forma significativa
(≥2 dias perdidos em uma semana) em um tier 2 ou 3, a quest NÃO volta
automaticamente ao tier anterior — mas o sistema oferece a opção de
"recalibrar" se o usuário pedir.

Quests não são só de um tipo de comportamento — cobrem hábitos físicos
(academia, sono, caminhada), relacionais (tempo com filhos) e intelectuais
(leitura), além das quests diretamente ligadas aos 3 padrões.

## 6. Flashcards (SM-2)

- Gerados de 3 formas: manual, automaticamente a partir de reflexões
  (quando o sistema detecta uma frase de autocrítica, oferece criar card),
  ou a partir de frases marcadas na Biblioteca.
- Algoritmo SM-2 padrão: cada revisão tem qualidade de resposta 0–5;
  `ease_factor` e `interval_days` se recalculam pela fórmula clássica do
  SuperMemo 2.
- Notificações push disparam quando `next_review_at <= now()`.
- Cards vinculados a um `pattern_id` podem ser priorizados quando o sistema
  detecta, pela reflexão do dia, que aquele padrão foi acionado.

## 7. Detecção de inconsistências

Regras **estatísticas**, não thresholds ingênuos fixos (ver docs/DETECTION_RULES.md
para a lista completa com pseudo-código). Resumo dos princípios:

- Comparar contra a **linha de base histórica do próprio usuário**, não
  contra um número absoluto — "3 sucessos seguidos" só é suspeito se estiver
  muito acima da taxa de sucesso histórica real do usuário.
- Exigir **especificidade textual mínima** em evidências (comprimento,
  presença de nomes próprios/datas/números), não apenas "campo preenchido".
- Sinalizar **silêncio anômalo** de um padrão que era recorrente e some sem
  ser marcado como consolidado.
- Sinalizar **tempo de conclusão suspeito** (reflexão "profunda" concluída
  em segundos).
- Todo flag é **informativo, não bloqueante** — nunca impede o usuário de
  continuar, apenas registra para o relatório periódico.
- O usuário pode **explicar/resolver** um flag (`user_explanation`,
  `resolved`), e essa explicação entra no relatório também — o sistema não
  julga, apenas evidencia.

## 8. Biblioteca (desbloqueada no Level 100)

Conteúdo curado (não gerado por IA) organizado por tema, cruzando
Estoicismo, Budismo, Hinduísmo/Advaita, Cristianismo místico, Existencialismo
e Neurociência. Cada entrada tem atribuição de fonte. O usuário pode
transformar qualquer frase em flashcard ou vinculá-la a um padrão.

## 9. Learning paths (livro do mês)

Sugestão mensal de 1 livro principal + 1 palestra/vídeo complementar,
baseada em: qual padrão está mais ativo no mês, o nível atual do usuário
(entender → aplicar → aprofundar), e histórico de aceite/recusa. Motor de
sugestão é baseado em regras/tags, não em IA generativa nesta fase. Ver
docs/BOOK_CATALOG.md para o banco inicial curado.

## 10. PWA / Offline-first

- Service Worker cacheando app shell + assets.
- IndexedDB local (via Dexie.js) como fila de escrita quando offline.
- Sincronização com Supabase ao reconectar; resolução de conflito
  last-write-wins é aceitável (usuário único).
- `manifest.json` configurado para instalação como app no celular
  (Android/iOS via "Adicionar à tela de início").

## 11. Segurança

- RLS em toda tabela com `user_id`.
- Chave `anon` do Supabase no frontend; nunca a `service_role`.
- Autenticação via Supabase Auth (email/senha ou magic link).
- Considerar criptografia em nível de aplicação para o campo
  `reflections.content` se o conteúdo for muito sensível (decisão do
  usuário, não bloqueante para o MVP).

## 12. Ordem de implementação recomendada

1. **Fase 1** — Auth, schema completo, RLS, PWA shell, dashboard mínimo
2. **Fase 2** — Quests (CRUD, versionamento, streaks, evolução automática)
3. **Fase 3** — Flashcards (SM-2), notificações push
4. **Fase 4** — Detecção de inconsistências + relatório exportável
5. **Fase 5** — Biblioteca
6. **Fase 6** — Learning paths / livro do mês

Recomendação: rodar Fases 1–2 por 3 semanas de uso real antes de continuar,
para evitar over-engineering de um sistema que ainda não foi testado no
hábito diário.
