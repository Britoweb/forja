# Checklist de acessibilidade por componente — FORJA

Use isto ao gerar ou revisar cada tipo de componente. Cole o trecho
relevante no chat do Cursor junto do pedido.

## Formulários (reflexão matinal/noturna, criação de quest/flashcard)

- [ ] Todo `<input>`/`<textarea>` tem `<label htmlFor>` visível (não só
      placeholder — placeholder some ao digitar e não é lido de forma
      confiável por todo leitor de tela)
- [ ] Campos obrigatórios marcados com `aria-required="true"` além do
      indicador visual
- [ ] Erro de validação: `aria-invalid="true"` no campo +
      `aria-describedby` apontando para o texto do erro +
      `role="alert"` no texto do erro
- [ ] Botão de submit desabilitado só quando genuinamente inválido, com
      `aria-disabled` explicando por quê (não silenciar sem explicação)
- [ ] Ordem de tab segue a ordem visual

## Cards de quest / flashcard / padrão

- [ ] Card inteiro clicável usa `<button>` ou `<a>` como wrapper, não
      `<div onClick>`
- [ ] Ícone de status (sucesso/streak/flag) tem `aria-label` — nunca
      transmite informação só por cor/ícone (ex: ícone vermelho de flag
      precisa também do texto "atenção" ou `aria-label="severidade alta"`)
- [ ] Se o card expande/colapsa, usa `aria-expanded` no gatilho

## Modais (revisão de flashcard, confirmação de reset, detalhe de flag)

- [ ] `role="dialog"` + `aria-modal="true"` + `aria-labelledby` apontando
      pro título do modal
- [ ] Foco move para dentro do modal ao abrir, e fica preso lá (focus
      trap) até fechar
- [ ] `Escape` fecha o modal
- [ ] Foco retorna ao elemento que abriu o modal, ao fechar

## Notificações push / toasts

- [ ] Toast usa `role="status"` (não interrompe) ou `role="alert"`
      (interrompe — só para algo crítico como falha de sync)
- [ ] Não depende só de aparecer/sumir visualmente — leitor de tela
      precisa anunciar o conteúdo

## Gráficos e dashboard de padrões (barras, árvore de progresso)

- [ ] Todo dado visual tem equivalente textual (ex: tabela escondida via
      `sr-only` ou resumo em texto ao lado do gráfico) — gráfico sozinho
      não é acessível a leitor de tela
- [ ] Cores do gráfico não são o único jeito de distinguir categorias
      (usar padrão/textura ou label direto também)

## Navegação geral (tabs: Manhã/Cartões/Noite/Padrões, bottom nav mobile)

- [ ] Tabs usam `role="tablist"`, `role="tab"`, `aria-selected`,
      `role="tabpanel"` — não `<div>` genérico estilizado de tab
- [ ] Bottom nav mobile: itens são `<a>`/`<button>` reais, com
      `aria-current="page"` no item ativo
- [ ] Skip link ("Pular para conteúdo") no topo da página, visível ao
      focar via Tab

## Teste manual mínimo antes de dar por pronto

1. Navegue a tela inteira só com Tab/Shift+Tab/Enter/Espaço, sem mouse
2. Ative o leitor de tela do sistema (VoiceOver no Mac/iOS, TalkBack no
   Android) e confirme que cada ação faz sentido só de ouvir
3. Reduza o zoom do sistema pra simular baixa visão / aumente a fonte do
   navegador em 200% e confirme que nada quebra o layout
4. Ative "reduzir movimento" no sistema e confirme que animações longas
   somem ou encurtam
