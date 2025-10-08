// services/notification_service.js
const Contrat = require("../models/contrat_model");
const User = require("../models/user_model");

class NotificationService {
  // 🔹 Vérifier les contrats arrivant à expiration
  static async checkExpiringContracts() {
    try {
      const today = new Date();
      const in30Days = new Date();
      in30Days.setDate(today.getDate() + 30);
      
      const in15Days = new Date();
      in15Days.setDate(today.getDate() + 15);
      
      const in7Days = new Date();
      in7Days.setDate(today.getDate() + 7);

      // Contrats expirant dans 30, 15 et 7 jours
      const contratsExpiring = await Contrat.find({
        statut: "Actif",
        dateFin: { 
          $gte: today,
          $lte: in30Days
        }
      }).populate("user", "nom prenom email")
        .populate("service", "nomService");

      const notifications = {
        dans7Jours: [],
        dans15Jours: [],
        dans30Jours: []
      };

      contratsExpiring.forEach(contrat => {
        const joursRestants = Math.ceil((new Date(contrat.dateFin) - today) / (1000 * 60 * 60 * 24));
        
        const notification = {
          contratId: contrat._id,
          user: `${contrat.user.nom} ${contrat.user.prenom}`,
          userEmail: contrat.user.email,
          typeContrat: contrat.typeContrat,
          dateFin: contrat.dateFin,
          joursRestants,
          service: contrat.service.nomService
        };

        if (joursRestants <= 7) {
          notifications.dans7Jours.push(notification);
        } else if (joursRestants <= 15) {
          notifications.dans15Jours.push(notification);
        } else if (joursRestants <= 30) {
          notifications.dans30Jours.push(notification);
        }
      });

      return notifications;

    } catch (error) {
      console.error("❌ Erreur vérification contrats expirants:", error);
      throw error;
    }
  }

  // 🔹 Obtenir les statistiques d'expiration
  static async getExpirationStats() {
    try {
      const today = new Date();
      
      const stats = {
        expiresDans7Jours: 0,
        expiresDans15Jours: 0,
        expiresDans30Jours: 0,
        totalExpirant: 0
      };

      const notifications = await this.checkExpiringContracts();
      
      stats.expiresDans7Jours = notifications.dans7Jours.length;
      stats.expiresDans15Jours = notifications.dans15Jours.length;
      stats.expiresDans30Jours = notifications.dans30Jours.length;
      stats.totalExpirant = stats.expiresDans7Jours + stats.expiresDans15Jours + stats.expiresDans30Jours;

      return stats;

    } catch (error) {
      console.error("❌ Erreur statistiques expiration:", error);
      throw error;
    }
  }

  // 🔹 Marquer une notification comme lue
  static async markAsRead(contratId) {
    // Implémentation pour marquer les notifications comme lues
    // Peut utiliser une collection séparée pour suivre les notifications
    console.log(`📌 Notification marquée comme lue pour contrat: ${contratId}`);
  }
}

module.exports = NotificationService;