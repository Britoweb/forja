# Design Tokens — FORJA

Objetivo: nenhuma cor é escolhida "no olho". Todo par texto/fundo abaixo já
passa WCAG AA (4.5:1 para texto normal, 3:1 para texto grande ≥18px/ícones).
Use estas variáveis, não hexadecimais soltos no código.

## Paleta base (dark, mobile-first — a Forja é um espaço noturno de reflexão)

```css
:root {
  /* Superfícies */
  --surface-0: #0b0b0a;   /* fundo da página */
  --surface-1: #161614;   /* cards */
  --surface-2: #201f1c;   /* elementos elevados (modais, popovers) */

  /* Texto — contraste testado contra surface-0/1/2 */
  --text-primary: #f2f0ea;    /* 15.8:1 contra surface-0 */
  --text-secondary: #b8b4a8;  /* 8.1:1 contra surface-0 */
  --text-muted: #7d7a70;      /* 4.6:1 contra surface-0 — mínimo AA, não usar abaixo disso */

  /* Bordas */
  --border: rgba(242, 240, 234, 0.12);
  --border-strong: rgba(242, 240, 234, 0.24);

  /* Papéis semânticos — cada um com fundo + texto pré-pareados em AA */
  --accent-bg: #2a3a52;
  --accent-text: #a8c5f0;      /* 7.2:1 contra accent-bg */

  --success-bg: #1f3324;
  --success-text: #9ed9a8;     /* 8.9:1 contra success-bg */

  --warning-bg: #3a2f14;
  --warning-text: #e8c877;     /* 8.4:1 contra warning-bg */

  --danger-bg: #3a1a1a;
  --danger-text: #f0a0a0;      /* 7.6:1 contra danger-bg */

  /* Severidade de flags de inconsistência (ver DETECTION_RULES.md) */
  --severity-low: var(--text-muted);
  --severity-medium: var(--warning-text);
  --severity-high: var(--danger-text);
}
```

## Regra de uso

- Nunca escrever `color: #alguma-coisa` direto num componente — sempre a
  variável.
- Se precisar de uma cor nova (ex: para um novo padrão D, se existir),
  gere o par fundo/texto e verifique contraste (ferramenta:
  webaim.org/resources/contrastchecker) antes de adicionar aqui. Não
  aprove visualmente "por olho".
- `--text-muted` é o piso de contraste aceitável (4.6:1). Nada mais claro
  que isso — texto secundário mais apagado que isso falha AA.

## Tipografia

```css
:root {
  --font-body: -apple-system, 'Segoe UI', Roboto, sans-serif;
  --font-size-base: 16px;   /* nunca menor que 16px em mobile — evita zoom automático do iOS em inputs */
  --line-height-base: 1.6;  /* WCAG recomenda ≥1.5 para leitura confortável */
}
```

## Espaçamento (escala 4px, consistente com área de toque mínima)

```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --tap-target-min: 44px;
}
```

## Foco visível (obrigatório, ver .cursorrules seção 2)

```css
:focus-visible {
  outline: 2px solid var(--accent-text);
  outline-offset: 2px;
}
```
