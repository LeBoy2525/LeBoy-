


// lib/notifications.ts

// Pour l'instant, on simule les notifications
// Plus tard, on pourra intégrer un service d'email (SendGrid, Resend, etc.)

export async function sendNotificationToPrestataire(
    prestataireEmail: string,
    missionRef: string,
    missionTitre: string
  ) {
    // TODO: Implémenter l'envoi d'email réel
    console.log(`📧 Notification envoyée à ${prestataireEmail}: Nouvelle mission ${missionRef}`);
    
    // Pour l'instant, on retourne juste un succès simulé
    return { success: true };
  }
  
  export async function sendNotificationToClient(
    clientEmail: string,
    missionRef: string,
    updateType: string
  ) {
    // TODO: Implémenter l'envoi d'email réel
    console.log(`📧 Notification envoyée à ${clientEmail}: Mise à jour sur ${missionRef}`);
    
    return { success: true };
  }