import { EventRecord, FitScore, UserProfile } from '../types/index.js';

function normalizeStr(s: string): string {
  return s?.toLowerCase().trim() || '';
}

function skillOverlap(userSkills: string[], eventTags: string[]): number {
  if (!eventTags?.length) return 0.5;
  const userNorm = (userSkills || []).map(normalizeStr);
  const eventNorm = (eventTags || []).map(normalizeStr);
  let matches = 0;
  for (const tag of eventNorm) {
    if (userNorm.some(s => s.includes(tag) || tag.includes(s))) matches++;
  }
  return eventNorm.length > 0 ? matches / eventNorm.length : 0.5;
}

export function calculateFitScore(event: EventRecord, profile: UserProfile): FitScore {
  // --- Step 1: Hard Constraint Filter ---
  let isEligible = true;
  let ineligibilityReason: string | undefined;

  // Year check
  if (event.eligibility?.minYear && profile.year < event.eligibility.minYear) {
    isEligible = false;
    ineligibilityReason = `Requires Year ${event.eligibility.minYear}+, you are Year ${profile.year}`;
  }
  if (event.eligibility?.maxYear && profile.year > event.eligibility.maxYear) {
    isEligible = false;
    ineligibilityReason = `Open only to Year ${event.eligibility.maxYear} and below`;
  }

  // Branch check
  if (
    event.eligibility?.allowedBranches?.length &&
    !event.eligibility.allowedBranches.some(b =>
      normalizeStr(b).includes(normalizeStr(profile.branch)) ||
      normalizeStr(profile.branch).includes(normalizeStr(b))
    )
  ) {
    isEligible = false;
    ineligibilityReason = `Branch ${profile.branch} not in allowed branches: ${event.eligibility.allowedBranches.join(', ')}`;
  }

  // Mode check (hard: if user is strictly online and event is strictly offline)
  if (profile.preferredMode === 'online' && event.mode === 'offline') {
    isEligible = false;
    ineligibilityReason = `Event is offline only, you prefer online`;
  }

  if (!isEligible) {
    return {
      total: 0,
      breakdown: { eligibility: 0, skills: 0, mode: 0, timing: 0, preferences: 0 },
      explanation: ineligibilityReason || 'Not eligible',
      isEligible: false,
      ineligibilityReason,
    };
  }

  // --- Step 2: Weighted Relevance Scoring ---

  // Eligibility score (Baseline 100 unless restrictions present)
  let eligibilityScore = 100;
  if (event.eligibility?.isRestricted) {
    if (
      event.eligibility?.allowedColleges?.length &&
      !event.eligibility.allowedColleges.some(c =>
        normalizeStr(c).includes(normalizeStr(profile.college)) ||
        normalizeStr(profile.college).includes(normalizeStr(c))
      )
    ) {
      eligibilityScore = 40;
    }
  }

  // Skills score
  const isSkillDisabled = Boolean(profile.ignoreSkills);
  let skillsScore = 100;
  if (!isSkillDisabled) {
    const overlap = skillOverlap(profile.skills || [], event.tags || []);
    const interestOverlap = skillOverlap(profile.interests || [], event.tags || []);
    skillsScore = Math.round((overlap * 0.7 + interestOverlap * 0.3) * 100);
  }

  // Mode & Location score
  let modeLocationScore = 100;
  if (profile.preferredMode !== 'any') {
    if (profile.preferredMode === event.mode) modeLocationScore = 100;
    else if (event.mode === 'hybrid') modeLocationScore = 80;
    else modeLocationScore = 55;
  }
  // Location alignment bonus
  if (event.location && profile.city) {
    const normCity = normalizeStr(profile.city);
    const normLoc = normalizeStr(event.location);
    if (normLoc.includes(normCity) || normCity.includes(normLoc)) {
      modeLocationScore = Math.min(100, modeLocationScore + 10);
    } else if (event.mode === 'offline') {
      modeLocationScore = Math.max(40, modeLocationScore - 20);
    }
  }

  // Timing score: Closer deadline = higher urgency
  let timingScore = 70;
  if (event.deadline) {
    const daysUntilDeadline = (new Date(event.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    if (daysUntilDeadline < 0) timingScore = 0;
    else if (daysUntilDeadline <= 3) timingScore = 100;
    else if (daysUntilDeadline <= 7) timingScore = 90;
    else if (daysUntilDeadline <= 14) timingScore = 80;
    else if (daysUntilDeadline <= 30) timingScore = 70;
    else timingScore = 60;
  }

  // Preferences score
  let prefScore = 75;
  if (profile.teamSizePreference === 'solo' && event.teamSize?.max === 1) prefScore = 100;
  else if (profile.teamSizePreference === 'team' && event.teamSize?.max > 1) prefScore = 100;
  else if (profile.teamSizePreference === 'any') prefScore = 80;

  const breakdown = {
    eligibility: Math.round(eligibilityScore),
    skills: isSkillDisabled ? 100 : Math.min(100, Math.round(skillsScore)),
    mode: Math.round(modeLocationScore),
    timing: Math.round(timingScore),
    preferences: Math.round(prefScore),
  };

  // Weighted Total:
  // If skill matching is disabled: Skills weight is 0%
  // If skill matching is enabled: Skills weight is lowered to 10% (was 30%)
  let total = 0;
  if (isSkillDisabled) {
    total = Math.round(
      breakdown.eligibility * 0.45 +
      breakdown.mode * 0.30 +
      breakdown.timing * 0.15 +
      breakdown.preferences * 0.10
    );
  } else {
    total = Math.round(
      breakdown.eligibility * 0.40 +
      breakdown.skills * 0.10 +      // Lowered to 10%
      breakdown.mode * 0.25 +
      breakdown.timing * 0.15 +
      breakdown.preferences * 0.10
    );
  }

  // Build plain-language explanation
  let explanation = `${total}% match. `;
  if (isSkillDisabled) {
    explanation += `Skill filter disabled. Evaluated on eligibility, mode & timing. `;
  } else {
    const matchedSkills = (profile.skills || []).filter(s =>
      (event.tags || []).some(t => normalizeStr(t).includes(normalizeStr(s)) || normalizeStr(s).includes(normalizeStr(t)))
    );
    if (matchedSkills.length > 0) {
      explanation += `Skills matched: ${matchedSkills.join(', ')}. `;
    }
  }

  if (event.location && profile.city && normalizeStr(event.location).includes(normalizeStr(profile.city))) {
    explanation += `Location in ${event.location}. `;
  } else if (event.mode === 'online') {
    explanation += `Online event. `;
  }

  return {
    total,
    breakdown,
    explanation: explanation.trim(),
    isEligible: true,
  };
}
