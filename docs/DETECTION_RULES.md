# Regras de Detecção de Inconsistências

Todas as regras são calculadas em batch (job diário/semanal), não em tempo
real bloqueante. Elas escrevem em `inconsistency_flags` e aparecem no
relatório periódico.

## Princípio geral

Nenhuma regra usa threshold absoluto fixo sem contexto do histórico do
próprio usuário. Toda regra exige um mínimo de dados históricos (baseline)
antes de começar a disparar, para evitar falsos positivos nas primeiras
semanas de uso.

---

## Regra 1 — Taxa de sucesso anômala (SUCCESS_ANOMALY)

```
baseline = média histórica de taxa de sucesso do usuário (últimas N=60 completions)
desvio = desvio padrão da mesma amostra
janela_atual = taxa de sucesso dos últimos 7 dias

SE count(completions históricas) >= 20:
  SE janela_atual > baseline + (2 * desvio):
    criar flag SUCCESS_ANOMALY, severity=medium
```

## Regra 2 — Evidência insuficiente (WEAK_EVIDENCE)

```
Para cada completion com evidence != null:
  word_count = contar palavras do texto
  tem_especificidade = regex encontra (número OU data OU nome próprio capitalizado)

  SE word_count < 15 E NAO tem_especificidade:
    criar flag WEAK_EVIDENCE, severity=low
```

## Regra 3 — Inconsistência quest × reflexão (QUEST_REFLECTION_MISMATCH)

```
Para cada dia:
  completions_sucesso = quests marcadas como sucesso naquele dia
  reflexao_noturna = reflection do tipo evening daquele dia

  SE reflexao_noturna menciona o mesmo pattern_id de uma completions_sucesso
     E texto da reflexão contém marcadores negativos
     (ex: "não consegui", "falhei", "reagi mal", "de novo")
     relacionados ao mesmo padrão:
    criar flag QUEST_REFLECTION_MISMATCH, severity=high
```

## Regra 4 — Alegação sem suporte (CLAIM_WITHOUT_SUPPORT)

```
Para reflexões/completions que citam impacto em terceiros
(ex: menciona nome de filho, cliente, familiar):
  buscar outras entries dos últimos 14 dias que mencionem a mesma pessoa

  SE nenhuma outra entry corrobora ou dá contexto adicional
     E a entry é a única fonte da alegação de impacto:
    criar flag CLAIM_WITHOUT_SUPPORT, severity=low
    (não significa que é mentira — só que não há triangulação de dados)
```

## Regra 5 — Padrão some sem explicação (PATTERN_SILENCE)

```
Para cada pattern ativo:
  frequencia_historica = média de menções/semana do padrão nas últimas 8 semanas
  frequencia_recente = menções/semana nas últimas 2 semanas

  SE frequencia_historica >= 1 por semana
     E frequencia_recente == 0
     E pattern.status != 'consolidated':
    criar flag PATTERN_SILENCE, severity=medium
    pergunta sugerida ao usuário: "Você parou de ter esse padrão,
    ou parou de registrar?"
```

## Regra 6 — Tempo de conclusão suspeito (SUSPICIOUS_COMPLETION_TIME)

```
Para quests do tipo "reflexão profunda" (tier que exige >= 10min estimado):
  tempo_gasto = completed_at - opened_at (timestamp de abertura da tela)

  SE tempo_gasto < 90 segundos:
    criar flag SUSPICIOUS_COMPLETION_TIME, severity=low
```

## Regra 7 — Mudança abrupta de métrica de padrão (ABRUPT_PATTERN_SHIFT)

```
Para cada pattern:
  percentual_quebrado_semana_anterior
  percentual_quebrado_semana_atual

  SE |diferença| > 25 pontos percentuais em uma única semana:
    criar flag ABRUPT_PATTERN_SHIFT, severity=medium
    (pode ser positivo real — sistema não julga, só sinaliza para contexto)
```

## Regra 8 — Streak "fantasma" (GHOST_STREAK)

```
SE streak_atual > 0
   E não houve nenhuma completion nas últimas 48h
   E o streak não foi congelado manualmente (streak_freeze):
    criar flag GHOST_STREAK, severity=low
    (indica possível bug de contagem ou grace period mal configurado)
```

## Regra 9 — Sequência de recusas em learning path (LEARNING_AVOIDANCE)

```
SE últimas 3 sugestões de livro foram recusadas em sequência:
    criar flag LEARNING_AVOIDANCE, severity=low
    pergunta sugerida: "Quer mudar o foco temático das sugestões?"
```

## Regra 10 — XP fora da curva (XP_SPIKE)

```
xp_medio_diario = média histórica de XP ganho por dia
xp_hoje = soma de xp_ledger de hoje

SE xp_hoje > xp_medio_diario * 3
   E count(dias históricos) >= 14:
    criar flag XP_SPIKE, severity=low
```

---

## Formato de saída (relatório)

Cada flag gerado é serializado assim para o relatório exportável:

```json
{
  "rule": "QUEST_REFLECTION_MISMATCH",
  "severity": "high",
  "date_range": "2025-01-10 to 2025-01-10",
  "pattern": "Comportamento",
  "description": "Quest 'conversa sem reatividade' marcada como sucesso, mas reflexão noturna do mesmo dia menciona 'fui reativo de novo'.",
  "related_entries": ["quest_completion:uuid", "reflection:uuid"],
  "resolved": false,
  "user_explanation": null
}
```

Esse relatório em JSON é o que deve ser colado na conversa com Claude para
análise periódica — não é para o sistema "julgar" automaticamente, é para
alimentar a conversa humana de revisão.
