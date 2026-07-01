import { sm2 } from '../sm2.js';
import { getSupabase } from '../supabaseClient.js';

/**
 * @param {string} userId
 */
export async function fetchFlashcards(userId) {
  const { data, error } = await getSupabase()
    .from('flashcards')
    .select('*')
    .eq('user_id', userId)
    .order('next_review_at', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/**
 * @param {string} userId
 */
export async function fetchDueFlashcards(userId) {
  const now = new Date().toISOString();
  const { data, error } = await getSupabase()
    .from('flashcards')
    .select('*')
    .eq('user_id', userId)
    .lte('next_review_at', now)
    .order('next_review_at', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/**
 * @param {string} userId
 */
export async function fetchDueFlashcardCount(userId) {
  const now = new Date().toISOString();
  const { count, error } = await getSupabase()
    .from('flashcards')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .lte('next_review_at', now);

  if (error) throw error;
  return count ?? 0;
}

/**
 * @param {string} userId
 * @param {object} input
 */
async function findExistingFlashcard(userId, input) {
  if (input.questId) {
    const { data, error } = await getSupabase()
      .from('flashcards')
      .select('*')
      .eq('user_id', userId)
      .eq('quest_id', input.questId)
      .maybeSingle();

    if (error) throw error;
    if (data) return data;
  }

  if (input.presetId) {
    const { data, error } = await getSupabase()
      .from('flashcards')
      .select('*')
      .eq('user_id', userId)
      .eq('preset_id', input.presetId)
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (data) return data;
  }

  const normFront = input.front?.trim();
  if (normFront) {
    const { data, error } = await getSupabase()
      .from('flashcards')
      .select('*')
      .eq('user_id', userId)
      .ilike('front', normFront)
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (data) return data;
  }

  return null;
}

/**
 * @param {string} userId
 * @param {object} input
 * @returns {Promise<{ card: object, duplicate: boolean }>}
 */
export async function createFlashcard(userId, input) {
  const existing = await findExistingFlashcard(userId, input);
  if (existing) {
    return { card: existing, duplicate: true };
  }

  const payload = {
    user_id: userId,
    pattern_id: input.patternId || null,
    front: input.front,
    back: input.back,
    source: input.source ?? 'manual',
    deck: input.deck ?? 'study',
    quest_id: input.questId ?? null,
    preset_id: input.presetId ?? null
  };

  const { data, error } = await getSupabase().from('flashcards').insert(payload).select().single();

  if (error) {
    if (error.code === '23505') {
      const again = await findExistingFlashcard(userId, input);
      if (again) return { card: again, duplicate: true };
    }
    throw error;
  }
  return { card: data, duplicate: false };
}

/**
 * @param {string} userId
 * @param {object} card
 * @param {number} quality 0–5
 */
export async function reviewFlashcard(userId, card, quality) {
  const sm2Result = sm2(
    {
      easeFactor: Number(card.ease_factor),
      intervalDays: card.interval_days,
      repetitions: card.repetitions
    },
    quality
  );

  const { data: review, error: reviewError } = await getSupabase()
    .from('flashcard_reviews')
    .insert({
      flashcard_id: card.id,
      user_id: userId,
      quality
    })
    .select()
    .single();

  if (reviewError) throw reviewError;

  const { data: updated, error: updateError } = await getSupabase()
    .from('flashcards')
    .update({
      ease_factor: sm2Result.easeFactor,
      interval_days: sm2Result.intervalDays,
      repetitions: sm2Result.repetitions,
      next_review_at: sm2Result.nextReviewAt
    })
    .eq('id', card.id)
    .select()
    .single();

  if (updateError) throw updateError;

  return { review, card: updated, sm2Result };
}

/**
 * @param {string} flashcardId
 */
export async function deleteFlashcard(flashcardId) {
  const { error } = await getSupabase().from('flashcards').delete().eq('id', flashcardId);
  if (error) throw error;
}
