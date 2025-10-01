const jwt = require('jsonwebtoken');

// Middleware pour vérifier le token JWT
module.exports = (roles = []) => {
    return (req, res, next) => {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Token manquant ou invalide' });
        }
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;

            if (roles.length && !roles.includes(req.user.role)) {
                return res.status(403).json({ message: 'Accès refusé' });
            }

            next();
        } catch (error) {
            return res.status(401).json({ message: 'Token invalide' });
        }
    };
};