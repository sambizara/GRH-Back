const jwt = require('jsonwebtoken');
const { User } = require("../models/user_model");

// Middleware pour vérifier le token JWT
module.exports = (roles = []) => {
    return async (req, res, next) => {
        console.log("🛡️  Middleware auth - Début");
        
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log("❌ Token manquant ou format invalide");
            return res.status(401).json({ message: 'Token manquant ou invalide' });
        }
        
        const token = authHeader.split(' ')[1];
        
        try {
            console.log("🔍 Vérification du token...");
            
            // Vérifier que JWT_SECRET est défini
            if (!process.env.JWT_SECRET) {
                console.error("❌ JWT_SECRET non défini");
                return res.status(500).json({ message: 'Erreur de configuration serveur' });
            }
            
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log("📋 Token décodé:", decoded);
            
            // Vérifier que decoded contient bien un id
            if (!decoded.id) {
                console.log("❌ ID manquant dans le token décodé");
                return res.status(401).json({ message: 'Token invalide - ID manquant' });
            }
            
            // Récupérer l'utilisateur depuis la base de données
            console.log("🔍 Recherche de l'utilisateur avec ID:", decoded.id);
            const user = await User.findById(decoded.id).select('-password');
            
            if (!user) {
                console.log("❌ Utilisateur non trouvé pour l'ID:", decoded.id);
                return res.status(401).json({ message: 'Utilisateur non trouvé' });
            }

            console.log("✅ Utilisateur trouvé:", {
                id: user._id.toString(),
                role: user.role,
                email: user.email
            });

            // ⭐⭐ CORRECTION : Assigner correctement req.user
            req.user = {
                id: user._id.toString(),
                role: user.role,
                email: user.email,
                nom: user.nom,
                prenom: user.prenom
            };

            console.log("✅ req.user défini:", req.user);

            // Vérifier les rôles autorisés
            if (roles.length > 0) {
                console.log("🔐 Vérification des rôles - Requis:", roles, "Utilisateur:", req.user.role);
                
                if (!roles.includes(req.user.role)) {
                    console.log("❌ Rôle insuffisant:", req.user.role, "Attendu:", roles);
                    return res.status(403).json({ 
                        message: `Accès refusé - Rôle ${req.user.role} insuffisant` 
                    });
                }
            }
            
            console.log("✅ Authentification réussie, passage au contrôleur...");
            next();
            
        } catch (error) {
            console.error("❌ Erreur d'authentification:", error);
            
            if (error.name === 'TokenExpiredError') {
                console.log("❌ Token expiré");
                return res.status(401).json({ message: 'Token expiré' });
            }
            if (error.name === 'JsonWebTokenError') {
                console.log("❌ Token JWT invalide:", error.message);
                return res.status(401).json({ message: 'Token invalide' });
            }
            if (error.name === 'NotBeforeError') {
                console.log("❌ Token pas encore valide");
                return res.status(401).json({ message: 'Token pas encore valide' });
            }
            
            console.error("❌ Erreur inattendue:", error.message);
            return res.status(500).json({ message: 'Erreur d\'authentification' });
        }
    };
};