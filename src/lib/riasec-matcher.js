/**
 * Calculates the RIASEC scores based on user answers.
 * 
 * Logic:
 * - Technology interest → +3 to I, +2 to C
 * - Art interest → +3 to A, +2 to I
 * - Science interest → +3 to I, +2 to R
 * - Social interest → +3 to S, +2 to A
 * - Business interest → +3 to E, +2 to C
 * - Nature interest → +3 to R, +2 to I
 * 
 * - Logic strength → +5 to I
 * - Creativity strength → +5 to A
 * - Communication strength → +5 to S
 * - Math strength → +5 to I, +2 to C
 * - Organization strength → +5 to C
 * - Problem-solving strength → +5 to I, +2 to R
 * 
 * @param {Object} answers - The user's survey answers
 * @returns {Object} - The calculated scores { R: number, I: number, ... }
 */
export function calculateScores(answers) {
    const scores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };

    // Process Interests (answers.interests is an array of strings)
    if (answers.interests) {
        answers.interests.forEach(interest => {
            switch (interest) {
                case 'Technology':
                    scores.I += 3; scores.C += 2; break;
                case 'Art':
                    scores.A += 3; scores.I += 2; break;
                case 'Science':
                    scores.I += 3; scores.R += 2; break;
                case 'Social':
                    scores.S += 3; scores.A += 2; break;
                case 'Business':
                    scores.E += 3; scores.C += 2; break;
                case 'Nature':
                    scores.R += 3; scores.I += 2; break;
            }
        });
    }

    // Process Strengths (answers.strengths is an array of strings)
    if (answers.strengths) {
        answers.strengths.forEach(strength => {
            switch (strength) {
                case 'Logic':
                    scores.I += 5; break;
                case 'Creativity':
                    scores.A += 5; break;
                case 'Communication':
                    scores.S += 5; break;
                case 'Math':
                    scores.I += 5; scores.C += 2; break;
                case 'Organization':
                    scores.C += 5; break;
                case 'Problem-solving':
                    scores.I += 5; scores.R += 2; break;
            }
        });
    }

    return scores;
}

/**
 * Calculates the top 3 letter RIASEC code from scores.
 * @param {Object} scores - The scores object { R: 5, I: 12, ... }
 * @returns {string} - The 3-letter code (e.g., "ICS")
 */
export function calculateRiasecCode(scores) {
    return Object.entries(scores)
        .sort(([, scoreA], [, scoreB]) => scoreB - scoreA) // Sort by score descending
        .slice(0, 3) // Take top 3
        .map(([letter]) => letter) // Extract letter
        .join('');
}

/**
 * Calculates match percentage between user code and career/university code.
 * 
 * Logic:
 * - First letter match = 50 points
 * - Second letter match = 30 points
 * - Third letter match = 20 points
 * 
 * @param {string} userCode - The user's 3-letter code
 * @param {string} itemCode - The career or university RIASEC code
 * @returns {number} - Match percentage (0-100)
 */
export function calculateMatchScore(userCode, itemCode) {
    if (!userCode || !itemCode) return 0;
    
    // Normalize codes
    const u = userCode.toUpperCase();
    const i = itemCode.toUpperCase();
    
    let score = 0;
    
    // Exact position matching (strict)
    // if (u[0] === i[0]) score += 50;
    // if (u[1] === i[1]) score += 30;
    // if (u[2] === i[2]) score += 20;

    // However, usually RIASEC matching is more flexible.
    // The prompt says: "First letter match = 50 points" - implies position matters?
    // "Example: IRC vs ICS = 50 + 30 = 80%"
    // Wait, IRC vs ICS:
    // I (pos 0) matches I (pos 0) -> 50
    // R (pos 1) vs C (pos 1) -> No match
    // C (pos 2) vs S (pos 2) -> No match
    // So result should be 50%.
    // But the prompt example says 80%.
    // Maybe it means:
    // I is present? Or maybe my example reading is wrong.
    // Let's re-read: "IRC" vs "ICS" = 50 + 30 = 80%.
    // If I matches I (50).
    // R vs C (0).
    // C vs S (0).
    // How do we get 80?
    // Maybe it checks if the letter exists *anywhere*?
    // Or maybe the example meant "IRC" vs "ICR"?
    // I (50) + C (no) + R (no, but at pos 2).
    // Let's stick to strict positional matching as per the "First letter match = 50" description, 
    // BUT I will implement a slightly more robust version that awards partial points if the letter is present but in wrong position,
    // UNLESS the prompt is strict.
    // Prompt: "First letter match = 50 points, Second letter match = 30 points, Third letter match = 20 points"
    // This strongly implies positional matching.
    // Let's look at the example "IRC" vs "ICS" -> 80% again.
    // I (1st) matches I (1st) -> 50.
    // R (2nd) vs C (2nd) -> No.
    // C (3rd) vs S (3rd) -> No.
    // Where does the other 30 come from?
    // Maybe "C" is in both? "IRC" has C (3rd), "ICS" has C (2nd).
    // If "containment" counts, then I (50) + C (30) = 80?
    // Let's assume the algorithm is:
    // 1. Is 1st letter of UserCode present in ItemCode? If yes, +50? No, that doesn't define "First letter match".
    // "First letter match" usually means "Does the first letter of Item match the first letter of User?".
    
    // Let's try to interpret "IRC" vs "ICS" = 80% again.
    // Maybe the user made a typo in the example or I'm missing something.
    // "IRC" vs "IRS" would be 50+30 = 80.
    // "IRC" vs "ICR" -> I match (50). C is in 2nd spot of target? No.
    
    // I will implement a robust "Holland Code" matching algorithm which is standard:
    // 1. Primary letter match (User[0] == Item[0]): High weight.
    // 2. Secondary/Tertiary matches.
    
    // Let's stick to the prompt's *text* rules:
    // "First letter match = 50 points" (User[0] == Item[0])
    // "Second letter match = 30 points" (User[1] == Item[1])
    // "Third letter match = 20 points" (User[2] == Item[2])
    
    // I will use this strict positional logic. If the user's example "IRC vs ICS = 80%" is a typo (likely meant IRS or similar), I'll ignore the example math and follow the rule text.
    // actually, wait. "IRC" vs "ICS".
    // I == I (50)
    // R != C
    // C != S
    // Total 50.
    
    // Alternate interpretation:
    // "First letter OF THE MATCH" = 50?
    // No, that's complex.
    
    // Let's try to be smart. "Better and optimized way".
    // A standard Hexagon distance algorithm is best for RIASEC, but maybe too complex for this prompt.
    // I'll implement a "Weighted Presence" algorithm which is robust.
    // - If User[0] is in ItemCode: +something?
    
    // Let's stick to the prompt's EXPLICIT text rules as the primary logic, but handle the case where letters are swapped.
    // Actually, I'll stick to strict positional for now as it's simple and predictable.
    
    if (u[0] === i[0]) score += 50;
    if (u[1] === i[1]) score += 30;
    if (u[2] === i[2]) score += 20;
    
    return score;
}

/**
 * Sorts items by match score.
 * @param {string} userCode - The user's code
 * @param {Array} items - Array of careers or universities
 * @returns {Array} - Sorted items with matchScore property
 */
export function sortByMatch(userCode, items) {
    if (!items) return [];
    
    return items.map(item => {
        // Handle cases where item might not have riasec_code (or have it in different casing)
        const itemCode = item.riasec_code || "";
        const matchScore = calculateMatchScore(userCode, itemCode);
        return { ...item, matchScore };
    })
    .sort((a, b) => b.matchScore - a.matchScore); // Descending
}
