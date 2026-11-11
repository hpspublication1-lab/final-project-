"use strict";
/**
 * Samyak Multiplayer Service — Question Registry & Secret Answer Store
 * Authoritative keeper of quiz questions. Answer keys NEVER leave the server.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultQuestionRegistry = exports.QuestionRegistry = void 0;
// Canonical pre-cached medical entrance questions for sub-millisecond room generation
const SEED_QUESTIONS = [
    {
        id: 'cee-bio-001',
        text: 'Which cell organelle is responsible for ATP synthesis via oxidative phosphorylation?',
        options: [
            { id: 'a', text: 'Ribosome' },
            { id: 'b', text: 'Mitochondria' },
            { id: 'c', text: 'Golgi Apparatus' },
            { id: 'd', text: 'Peroxisome' },
        ],
        correctOptionId: 'b',
        subject: 'Biology',
        difficulty: 'easy',
        explanation: 'Mitochondria generate most of the chemical energy needed to power the biochemical reactions through ATP.',
    },
    {
        id: 'cee-chem-002',
        text: 'What is the oxidation number of Chromium in Potassium Dichromate (K2Cr2O7)?',
        options: [
            { id: 'a', text: '+3' },
            { id: 'b', text: '+5' },
            { id: 'c', text: '+6' },
            { id: 'd', text: '+7' },
        ],
        correctOptionId: 'c',
        subject: 'Chemistry',
        difficulty: 'medium',
        explanation: '2(+1) + 2x + 7(-2) = 0 => 2 + 2x - 14 = 0 => 2x = 12 => x = +6.',
    },
    {
        id: 'cee-phy-003',
        text: 'What is the dimensional formula of Planck\'s Constant (h)?',
        options: [
            { id: 'a', text: '[M L^2 T^-1]' },
            { id: 'b', text: '[M L^1 T^-2]' },
            { id: 'c', text: '[M L^2 T^-2]' },
            { id: 'd', text: '[M^0 L^0 T^-1]' },
        ],
        correctOptionId: 'a',
        subject: 'Physics',
        difficulty: 'medium',
        explanation: 'E = h*nu => h = E/nu = [M L^2 T^-2] / [T^-1] = [M L^2 T^-1].',
    },
    {
        id: 'cee-mat-004',
        text: 'Complete the logical number series: 3, 7, 15, 31, 63, ?',
        options: [
            { id: 'a', text: '95' },
            { id: 'b', text: '127' },
            { id: 'c', text: '128' },
            { id: 'd', text: '144' },
        ],
        correctOptionId: 'b',
        subject: 'Mental Agility',
        difficulty: 'easy',
        explanation: 'The pattern is 2*N + 1: 3*2+1=7, 7*2+1=15, 15*2+1=31, 31*2+1=63, 63*2+1=127.',
    },
    {
        id: 'cee-bio-005',
        text: 'Which blood group antigen is completely absent in universal donor RBCs (O negative)?',
        options: [
            { id: 'a', text: 'Antigen A only' },
            { id: 'b', text: 'Antigen B only' },
            { id: 'c', text: 'Both Antigen A, B, and Rh Factor' },
            { id: 'd', text: 'H Antigen' },
        ],
        correctOptionId: 'c',
        subject: 'Biology',
        difficulty: 'medium',
        explanation: 'O negative red cells lack A, B, and Rh (D) surface antigens, making them safely transfusable.',
    },
    {
        id: 'cee-phy-006',
        text: 'Escape velocity from the surface of Earth (radius 6400 km) is approximately:',
        options: [
            { id: 'a', text: '7.9 km/s' },
            { id: 'b', text: '9.8 km/s' },
            { id: 'c', text: '11.2 km/s' },
            { id: 'd', text: '16.7 km/s' },
        ],
        correctOptionId: 'c',
        subject: 'Physics',
        difficulty: 'easy',
        explanation: 'v_e = sqrt(2 * g * R) = sqrt(2 * 9.8 * 6.4e6) = 11.2 km/s.',
    },
    {
        id: 'cee-chem-007',
        text: 'Which gas is evolved when concentrated Nitric acid reacts with Copper metal?',
        options: [
            { id: 'a', text: 'Nitrogen monoxide (NO)' },
            { id: 'b', text: 'Nitrogen dioxide (NO2)' },
            { id: 'c', text: 'Dinitrogen oxide (N2O)' },
            { id: 'd', text: 'Hydrogen gas (H2)' },
        ],
        correctOptionId: 'b',
        subject: 'Chemistry',
        difficulty: 'hard',
        explanation: 'Cu + 4HNO3(conc) -> Cu(NO3)2 + 2NO2 + 2H2O. Dense brown fumes of NO2 are evolved.',
    },
    {
        id: 'cee-bio-008',
        text: 'The functional filtration and osmoregulatory unit of the human kidney is:',
        options: [
            { id: 'a', text: 'Neuron' },
            { id: 'b', text: 'Nephron' },
            { id: 'c', text: 'Alveolus' },
            { id: 'd', text: 'Glomerulus' },
        ],
        correctOptionId: 'b',
        subject: 'Biology',
        difficulty: 'easy',
        explanation: 'The nephron is the microscopic structural and functional unit of the kidney.',
    },
    {
        id: 'cee-mat-009',
        text: 'If a clock shows 3:15, what is the angle between the hour hand and the minute hand?',
        options: [
            { id: 'a', text: '0 degrees' },
            { id: 'b', text: '7.5 degrees' },
            { id: 'c', text: '15 degrees' },
            { id: 'd', text: '22.5 degrees' },
        ],
        correctOptionId: 'b',
        subject: 'Mental Agility',
        difficulty: 'medium',
        explanation: 'Angle = |(30 * H) - (11/2 * M)| = |(30 * 3) - (11/2 * 15)| = |90 - 82.5| = 7.5 degrees.',
    },
    {
        id: 'cee-phy-010',
        text: 'A wire of resistance R is stretched uniformly to double its original length. Its new resistance is:',
        options: [
            { id: 'a', text: 'R / 2' },
            { id: 'b', text: '2 * R' },
            { id: 'c', text: '4 * R' },
            { id: 'd', text: 'R' },
        ],
        correctOptionId: 'c',
        subject: 'Physics',
        difficulty: 'medium',
        explanation: 'Volume is constant. Length doubles => cross-sectional area halves => R\' = rho * (2L) / (A/2) = 4R.',
    },
];
class QuestionRegistry {
    questions = new Map();
    constructor(initialQuestions = SEED_QUESTIONS) {
        for (const q of initialQuestions) {
            this.questions.set(q.id, q);
        }
    }
    /**
     * Retrieves randomized questions for a match room.
     * Returns:
     * - publicQuestions: sent to clients (WITHOUT correctOptionId)
     * - answerKeyMap: retained in server room memory ONLY
     */
    getQuestionsForMatch(count = 5, subjectFilter) {
        let pool = Array.from(this.questions.values());
        if (subjectFilter && subjectFilter !== 'mixed') {
            const filtered = pool.filter((q) => q.subject.toLowerCase() === subjectFilter.toLowerCase());
            if (filtered.length >= count) {
                pool = filtered;
            }
        }
        // Shuffle pool deterministically
        const shuffled = [...pool].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, Math.min(count, pool.length));
        const publicQuestions = [];
        const answerKeyMap = new Map();
        for (const q of selected) {
            publicQuestions.push({
                id: q.id,
                text: q.text,
                options: q.options,
                subject: q.subject,
                difficulty: q.difficulty,
            });
            answerKeyMap.set(q.id, q.correctOptionId);
        }
        return { publicQuestions, answerKeyMap };
    }
    /**
     * Verifies if an option choice is correct.
     */
    verifyAnswer(questionId, optionId) {
        const q = this.questions.get(questionId);
        if (!q)
            return false;
        return q.correctOptionId.toLowerCase() === optionId.toLowerCase().trim();
    }
}
exports.QuestionRegistry = QuestionRegistry;
exports.defaultQuestionRegistry = new QuestionRegistry();
