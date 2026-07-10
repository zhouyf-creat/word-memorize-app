import { Word, EBBINGHAUS_STAGES } from "../types";

export function createNewWord(
  wordText: string,
  translation = "",
  example = "",
  exampleTranslation = "",
  baseTime = new Date()
): Word {
  const id = Math.random().toString(36).substring(2, 11);
  const checks: Word["checks"] = {};

  EBBINGHAUS_STAGES.forEach((stage) => {
    const dueTime = new Date(baseTime.getTime() + stage.offsetHours * 60 * 60 * 1000);
    // stage0 is immediately due
    checks[stage.id] = {
      status: stage.offsetHours === 0 ? 'due' : 'pending',
      dueTime: dueTime.toISOString(),
    };
  });

  return {
    id,
    word: wordText.trim(),
    translation: translation.trim(),
    example: example.trim(),
    exampleTranslation: exampleTranslation.trim(),
    createdAt: baseTime.toISOString(),
    checks,
  };
}

/**
 * Checks and updates the due statuses of all words based on simulated or current time
 */
export function updateWordStatuses(words: Word[], currentTime: Date): Word[] {
  return words.map((word) => {
    const updatedChecks = { ...word.checks };
    let hasChanged = false;

    EBBINGHAUS_STAGES.forEach((stage) => {
      const check = updatedChecks[stage.id];
      if (!check) return;

      const dueTime = new Date(check.dueTime);
      const isPastDue = currentTime >= dueTime;

      if (check.status === 'pending' && isPastDue) {
        // We mark them as 'due' purely based on elapsed time:
        updatedChecks[stage.id] = {
          ...check,
          status: 'due',
        };
        hasChanged = true;
      }
    });

    return hasChanged ? { ...word, checks: updatedChecks } : word;
  });
}

// Initial words provided by the user
export const INITIAL_WORD_LIST = [
  "prince",
  "princess",
  "narrow",
  "toilet",
  "thunder",
  "pepper",
  "scissors",
  "flood",
  "nose",
  "matter",
  "ground",
  "kick",
  "trousers",
  "playground",
  "single",
  "progress",
  "circle",
  "mall",
  "perhaps",
  "nagative", // preserve spelling, translate with note
  "stamp",
  "science",
  "gold",
  "champion"
];
