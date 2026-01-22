/**
 * Word Pools
 * Curated word sets for verbal short-term memory assessment.
 * 
 * Design principles:
 * - Avoid semantically related clusters
 * - Avoid emotionally loaded words
 * - Keep word length balanced (4-7 characters)
 * - Mixed semantic categories
 */

import type { WordPool } from '../types/memoryTypes';

export const WORD_POOLS: WordPool[] = [
    {
        id: 'pool-easy-1',
        name: 'High-Frequency Concrete Nouns',
        difficulty: 'easy',
        difficultyIndex: 3,
        words: [
            'chair', 'apple', 'river', 'table', 'bread',
            'house', 'stone', 'cloud', 'grass', 'wheel',
            'spoon', 'clock', 'shirt', 'plant', 'beach'
        ]
    },
    {
        id: 'pool-medium-1',
        name: 'Medium-Frequency Nouns',
        difficulty: 'medium',
        difficultyIndex: 5,
        words: [
            'lantern', 'anchor', 'basket', 'pillow', 'tunnel',
            'marble', 'velvet', 'harbor', 'meadow', 'candle',
            'cabinet', 'feather', 'fountain', 'crystal', 'bridge'
        ]
    },
    {
        id: 'pool-hard-1',
        name: 'Mixed Semantic Categories',
        difficulty: 'hard',
        difficultyIndex: 7,
        words: [
            'prism', 'latch', 'crest', 'bluff', 'grove',
            'plank', 'wedge', 'ridge', 'ledge', 'notch',
            'hinge', 'clasp', 'brace', 'shaft', 'spool'
        ]
    }
];

/**
 * Selects a random set of words for the assessment.
 * Ensures no semantic clustering by selecting from all pools.
 */
export function selectRandomWords(count: number = 10): { words: string[], poolId: string } {
    // Combine all words from all pools
    const allWords = WORD_POOLS.flatMap(pool => pool.words);

    // Shuffle using Fisher-Yates
    const shuffled = [...allWords];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return {
        words: shuffled.slice(0, count),
        poolId: 'mixed'
    };
}

/**
 * Selects words from a specific difficulty pool.
 */
export function selectWordsFromPool(
    difficulty: 'easy' | 'medium' | 'hard',
    count: number = 10
): { words: string[], poolId: string } {
    const pool = WORD_POOLS.find(p => p.difficulty === difficulty);
    if (!pool) {
        return selectRandomWords(count);
    }

    const shuffled = [...pool.words];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return {
        words: shuffled.slice(0, count),
        poolId: pool.id
    };
}
