// lib/email/rateLimit.ts
// Rate limiter pour Resend (anti 429)
// File FIFO en mémoire avec délai minimum entre envois

type EmailTask = {
  fn: () => Promise<void>;
  resolve: () => void;
  reject: (error: any) => void;
  retryCount: number;
};

class EmailRateLimiter {
  private queue: EmailTask[] = [];
  private processing = false;
  private lastSentAt = 0;
  private readonly minDelayMs = 600; // 600ms minimum entre chaque email (2 req/s max)
  private readonly maxRetries = 1; // 1 retry en cas de 429
  private readonly backoffMs = 1500; // Attendre 1.5s avant retry après 429

  /**
   * Ajoute un email à la file d'attente
   */
  async enqueueEmailSend(fn: () => Promise<void>): Promise<void> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        fn,
        resolve,
        reject,
        retryCount: 0,
      });
      
      console.log(`[email] queued (${this.queue.length} en attente)`);
      
      // Démarrer le traitement si pas déjà en cours
      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  /**
   * Traite la file d'attente séquentiellement
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (!task) break;

      try {
        // Attendre le délai minimum depuis le dernier envoi
        const now = Date.now();
        const timeSinceLastSend = now - this.lastSentAt;
        if (timeSinceLastSend < this.minDelayMs) {
          const waitTime = this.minDelayMs - timeSinceLastSend;
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }

        // Tenter l'envoi
        await task.fn();
        
        this.lastSentAt = Date.now();
        console.log(`[email] sent successfully`);
        task.resolve();
        
      } catch (error: any) {
        // Si erreur 429 et qu'on peut retryer
        if (error?.statusCode === 429 && task.retryCount < this.maxRetries) {
          task.retryCount++;
          console.log(`[email] 429 throttled, retry ${task.retryCount}/${this.maxRetries} après ${this.backoffMs}ms`);
          
          // Backoff avant retry
          await new Promise(resolve => setTimeout(resolve, this.backoffMs));
          
          // Remettre la tâche en queue pour retry
          this.queue.unshift(task);
          
        } else {
          // Erreur finale ou trop de retries
          console.error(`[email] failed final (${task.retryCount} retries):`, error?.message || error);
          task.reject(error);
        }
      }
    }

    this.processing = false;
  }

  /**
   * Vide la file d'attente (utile pour les tests)
   */
  clear(): void {
    this.queue = [];
    this.processing = false;
  }

  /**
   * Retourne le nombre d'emails en attente
   */
  getQueueLength(): number {
    return this.queue.length;
  }
}

// Instance singleton
const emailRateLimiter = new EmailRateLimiter();

/**
 * Enfile un envoi d'email avec rate limiting automatique
 */
export async function enqueueEmailSend(fn: () => Promise<void>): Promise<void> {
  return emailRateLimiter.enqueueEmailSend(fn);
}

/**
 * Utilitaires pour monitoring (optionnel)
 */
export function getEmailQueueStatus() {
  return {
    queueLength: emailRateLimiter.getQueueLength(),
  };
}

