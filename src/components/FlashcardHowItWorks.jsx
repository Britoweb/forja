export default function FlashcardHowItWorks() {
  return (
    <section className="card flashcard-how-it-works" aria-label="Como quests e cards funcionam">
      <h2 className="flashcard-how-title">Quests ≠ Cards</h2>
      <ul className="flashcard-how-list" role="list">
        <li>
          <strong>Quests</strong> — hábitos do dia. Você marca <em>Concluir</em> ou <em>Não fiz hoje</em>.
          Não precisa de card.
        </li>
        <li>
          <strong>Cards</strong> — revisão estilo Anki, opcional. Fixam o princípio depois que a quest
          já existe.
        </li>
        <li>
          <strong>Revisar</strong> — use o bloco abaixo: pergunta → mostrar resposta → De novo / Difícil /
          Bom / Fácil.
        </li>
      </ul>
    </section>
  );
}
