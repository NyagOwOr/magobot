// Utility functions for managing conversation history
const MAX_HISTORY_LENGTH = 10;

function loadHistory(userId) {
    return chatHistory.get(userId) || [];
}

function updateHistory(history, newMessage) {
    history.push(newMessage);
    if (history.length > MAX_HISTORY_LENGTH) {
        history.shift(); // Keep history within the maximum limit
    }
}

module.exports = { loadHistory, updateHistory };
