import * as crypto from 'crypto';

/**
 * Génère un secret aléatoire sécurisé pour les webhooks
 * @returns Le secret généré
 */
export function generateWebhookSecret(): string {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash un secret avec SHA-256
 * @param secret Le secret à hasher
 * @returns Le hash du secret
 */
export function hashWebhookSecret(secret: string): string {
    return crypto.createHash('sha256').update(secret).digest('hex');
}

/**
 * Vérifie qu'un secret correspond au hash stocké
 * @param secret Le secret à vérifier
 * @param hash Le hash stocké en base
 * @returns true si le secret correspond
 */
export function verifyWebhookSecret(secret: string, hash: string): boolean {
    const secretHash = hashWebhookSecret(secret);
    return crypto.timingSafeEqual(Buffer.from(secretHash), Buffer.from(hash));
}

/**
 * Génère une signature HMAC pour vérifier l'intégrité des webhooks
 * @param payload Le payload du webhook (string JSON)
 * @param secret Le secret
 * @returns La signature HMAC
 */
export function generateWebhookSignature(payload: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Vérifie une signature HMAC de webhook
 * @param payload Le payload du webhook
 * @param signature La signature reçue
 * @param secret Le secret
 * @returns true si la signature est valide
 */
export function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = generateWebhookSignature(payload, secret);
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}
