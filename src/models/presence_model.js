const mongoose = require('mongoose');

const presenceSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true  
    },
    date: {
        type: Date,
        required: true
    },
    heureArrivee: {
        type: Date,
        required: true
    },
    heureDepart: {
        type: Date
    },
    statut: {
        type: String,
        enum: ['Présent', 'Absent', 'En Retard'],
        required: true }
}, {timestamps: true});

module.exports = mongoose.model("Presence", presenceSchema);