const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
    },
    role: {
        type: String,
        enum: ['doctor', 'patient'],
        required: true
    },
    is_online: {
        type: Boolean,
        default: false
    },
    profilePicture: { 
        type: String,
        default:""
    },
    userId: { 
        type: String, 
        unique: true, 
        default: () => Math.floor(100000 + Math.random() * 900000).toString() 
    },
    allowedUsers: [{ 
        type: String
    }]
},
    {
        timestamps: true
    }
);

module.exports = mongoose.model('User', userSchema);