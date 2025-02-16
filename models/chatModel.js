const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    message: {
        type: String,
        required: false
    },
    fileUrl: {
        type: String, // Store file path
        required: false
    },
    fileType: {
        type: String, // Store MIME type (e.g., "image/png", "application/pdf")
        required: false
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('ChatMessage', chatSchema);