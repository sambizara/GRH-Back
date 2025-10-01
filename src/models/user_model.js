const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    nom: {
        type: String,
        required: true },
    prenom: {
        type: String,
        required: false },
    email: {
        type: String,
        required: true,
        unique: true },
    motDePasse: {
        type: String,
        required: true },
    sexe: {
        type: String,
        enum: ['Homme', 'Femme'],
    },
    role: {
        type: String,
        enum: ['ADMIN_RH', 'SALARIE', 'STAGIAIRE'],
        default: 'SALARIE' },
    service: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service' },
    encadreur: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);