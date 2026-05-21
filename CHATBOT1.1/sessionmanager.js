// sessionManager.js
const sessions = new Map();

const STATES = {
    IDLE: 'IDLE',
    BROWSING: 'BROWSING',
    CART_REVIEW: 'CART_REVIEW',
    CHECKOUT: 'CHECKOUT'
};

function getSession(phoneNumber) {
    if (!sessions.has(phoneNumber)) {
        sessions.set(phoneNumber, {
            state: STATES.IDLE,
            cart: [],
            lastInteraction: Date.now()
        });
    }
    return sessions.get(phoneNumber);
}

function updateSession(phoneNumber, updates) {
    const currentSession = getSession(phoneNumber);
    sessions.set(phoneNumber, { ...currentSession, ...updates, lastInteraction: Date.now() });
}

function clearSession(phoneNumber) {
    sessions.delete(phoneNumber);
}

module.exports = { getSession, updateSession, clearSession, STATES };