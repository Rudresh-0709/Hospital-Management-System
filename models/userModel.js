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
        default: "https://us.123rf.com/450wm/yupiramos/yupiramos1603/yupiramos160311572/53591196-person-avatar-design-vector-illustration-graphic.jpg?ver=6" 
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