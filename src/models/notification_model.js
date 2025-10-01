const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['INFO', 'ALERT', 'REMINDER'],
        required: true
    },
    message: {
        type: String,
        required: true
    },
    dateEnvoi: {
        type: Date,
        default: Date.now
    },
    statut: {
        type: String,
        enum: ['Non lu', 'Lu'],
        default: 'Non lu'
    }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);