/** Today's question texts and rules for the screen (pure functions, tested). */
import type { AnswerProblem, CannotAnswer, Choice, Counts, QuestionResult, TodayQuestion } from './api';

const neighbours = (n: number) => `${n} neighbour${n === 1 ? '' : 's'}`;
const label = (c: Choice) => `${c.emoji} ${c.text}`;

/** Whole percentages per choice (0 when nobody answered). */
export function percents(counts: Counts): number[] {
  return counts.choices.map((n) => (counts.total > 0 ? Math.round((n / counts.total) * 100) : 0));
}

/** "Mahogany so far (5 neighbours)" above the bars. */
export function soFarTitle(community: string, counts: Counts): string {
  return counts.total === 0 ? `Nobody in ${community} has answered yet` : `${community} so far (${neighbours(counts.total)})`;
}

/**
 * The newspaper line for yesterday's result (requirement.md v1.49 §11): "Yesterday 3 of 5
 * neighbours went with 🧅 Layers" — counts only; a tie names the tied choices.
 */
export function yesterdayLine(r: QuestionResult): string {
  const { total, choices } = r.counts;
  const top = Math.max(...choices);
  const tied = r.question.choices.filter((_, i) => choices[i] === top);
  if (total === 1) return `Yesterday 1 neighbour answered: ${label(tied[0]!)}`;
  if (tied.length > 1) {
    const names = tied.map(label);
    return `Yesterday ${neighbours(total)} answered: a tie between ${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
  }
  if (top === total) return `Yesterday all ${total} neighbours went with ${label(tied[0]!)}`;
  return `Yesterday ${top} of ${neighbours(total)} went with ${label(tied[0]!)}`;
}

/** Why the choices are read-only, or null (answered shows the bars without a note). */
export function cannotAnswerText(reason: CannotAnswer | null): string | null {
  switch (reason) {
    case 'not_signed_in':
    case 'not_resident':
      return 'Residents answer today\'s question. Check in to your community to join in!';
    case 'other_community':
      return 'You can answer in your own community.';
    default:
      return null;
  }
}

export const ANSWER_PROBLEM_TEXT: Record<AnswerProblem, string> = {
  not_resident: 'Check in to your community to answer today\'s question.',
  choice: 'That answer could not be saved. Please try again.',
  answered: 'You already answered today. See you tomorrow!',
};

/** Whether the card pops up on opening the game: a question I can still answer, not closed today. */
export function shouldPopUp(today: TodayQuestion | null, closedDay: string | null): boolean {
  return !!today && today.can_answer && closedDay !== today.calgary_day;
}

/** The state right after tapping a choice (the server's counts follow). */
export function answeredLocally(today: TodayQuestion, choice: number): TodayQuestion {
  return { ...today, can_answer: false, reason: 'answered', answered: choice };
}
