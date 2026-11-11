"use strict";
/**
 * Samyak Multiplayer Service — ELO Range Expanding Matchmaker
 * Pairs candidates by academic rating, subject filter, and queue duration.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchmaker = exports.Matchmaker = void 0;
class Matchmaker {
    queue = new Map();
    /**
     * Enqueues an authenticated candidate.
     */
    enqueue(sessionId, player, subjectFilter = 'mixed') {
        // Evict any existing queue presence for this user
        for (const [sId, item] of this.queue.entries()) {
            if (item.player.userId === player.userId) {
                this.queue.delete(sId);
            }
        }
        this.queue.set(sessionId, {
            sessionId,
            player,
            subjectFilter: subjectFilter.toLowerCase(),
            mode: player.gameMode,
            joinedAt: Date.now(),
        });
    }
    /**
     * Dequeues a player when canceled or disconnected.
     */
    dequeue(sessionId) {
        return this.queue.delete(sessionId);
    }
    /**
     * Iterates through queue and pairs compatible candidates.
     * Expands ELO acceptance windows progressively:
     * - < 5s: ±75 ELO
     * - 5-10s: ±150 ELO
     * - 10-15s: ±300 ELO
     * - > 15s: Spawns a balanced AI opponent
     */
    processQueue(nowMs = Date.now()) {
        const matches = [];
        const candidates = Array.from(this.queue.values());
        const matchedSessionIds = new Set();
        for (let i = 0; i < candidates.length; i++) {
            const p1 = candidates[i];
            if (matchedSessionIds.has(p1.sessionId))
                continue;
            const waitTimeSec = (nowMs - p1.joinedAt) / 1000;
            let eloRange = 75;
            if (waitTimeSec > 10) {
                eloRange = 300;
            }
            else if (waitTimeSec > 5) {
                eloRange = 150;
            }
            let bestOpponent = null;
            let minEloDiff = Infinity;
            // Look for human opponent in queue
            for (let j = i + 1; j < candidates.length; j++) {
                const p2 = candidates[j];
                if (matchedSessionIds.has(p2.sessionId))
                    continue;
                if (p1.player.userId === p2.player.userId)
                    continue; // Same user
                if (p1.mode !== p2.mode)
                    continue;
                // Subject filter match: either identical or one/both are 'mixed'
                const subjectMatch = p1.subjectFilter === 'mixed' ||
                    p2.subjectFilter === 'mixed' ||
                    p1.subjectFilter === p2.subjectFilter;
                if (!subjectMatch)
                    continue;
                const eloDiff = Math.abs(p1.player.rating - p2.player.rating);
                if (eloDiff <= eloRange && eloDiff < minEloDiff) {
                    minEloDiff = eloDiff;
                    bestOpponent = p2;
                }
            }
            if (bestOpponent) {
                matchedSessionIds.add(p1.sessionId);
                matchedSessionIds.add(bestOpponent.sessionId);
                const chosenSubject = p1.subjectFilter !== 'mixed' ? p1.subjectFilter : bestOpponent.subjectFilter;
                matches.push({
                    player1: p1,
                    player2: bestOpponent,
                    isBotMatch: false,
                    roomId: `room_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                    subject: chosenSubject,
                });
            }
            else if (waitTimeSec > 15) {
                // Fallback: spawn realistic academic bot
                matchedSessionIds.add(p1.sessionId);
                const botRating = Math.max(900, p1.player.rating + Math.floor((Math.random() * 80) - 40));
                const botPlayer = {
                    sessionId: `bot_sess_${Math.random().toString(36).substring(2, 7)}`,
                    player: {
                        userId: `bot_${Math.random().toString(36).substring(2, 8)}`,
                        email: 'bot@samyakcee.com',
                        fullName: 'Aarav Sharma (AI Scholar)',
                        rating: botRating,
                        gameMode: p1.mode,
                        nonce: `bot_nonce_${Date.now()}`,
                        issuedAt: Math.floor(nowMs / 1000),
                        expiresAt: Math.floor(nowMs / 1000) + 3600,
                    },
                    subjectFilter: p1.subjectFilter,
                    mode: p1.mode,
                    joinedAt: nowMs,
                };
                matches.push({
                    player1: p1,
                    player2: botPlayer,
                    isBotMatch: true,
                    roomId: `room_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                    subject: p1.subjectFilter,
                });
            }
        }
        // Remove matched players from queue
        for (const sessionId of matchedSessionIds) {
            this.queue.delete(sessionId);
        }
        return matches;
    }
    getQueueSize() {
        return this.queue.size;
    }
    clear() {
        this.queue.clear();
    }
}
exports.Matchmaker = Matchmaker;
exports.matchmaker = new Matchmaker();
