const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['INFO', 'ALERT', 'REMINDER', 'SUCCESS', 'WARNING'],
        required: true
    },
    category: {
        type: String,
        enum: ['CONGE', 'STAGE', 'ATTESTATION', 'RAPPORT', 'UTILISATEUR', 'CONTRAT', 'AUTRE'],
        default: 'AUTRE'
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    relatedEntity: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'entityModel'
    },
    entityModel: {
        type: String,
        enum: ['Conge', 'Stage', 'Attestation', 'Rapport', 'User', 'Contrat']
    },
    dateEnvoi: {
        type: Date,
        default: Date.now
    },
    statut: {
        type: String,
        enum: ['Non lu', 'Lu'],
        default: 'Non lu'
    },
    priority: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH'],
        default: 'MEDIUM'
    }
}, { 
    timestamps: true 
});

notificationSchema.index({ user: 1, statut: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
