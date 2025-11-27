/**
 * Genera un codice human-readable per un partecipante
 * Formato: {nome_secret_santa}-{8_cifre_random}
 */
export function generateParticipantCode(secretSantaName: string): string {
  const randomNumber = Math.floor(10000000 + Math.random() * 90000000);
  // Rimuovi spazi e caratteri speciali dal nome
  const cleanName = secretSantaName.replace(/[^a-zA-Z0-9]/g, '');
  return `${cleanName}-${randomNumber}`;
}

/**
 * Shuffle array usando algoritmo Fisher-Yates
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Assegna destinatari in modo circolare evitando auto-assegnazioni
 */
export function assignSecretSantas<T extends { id: string }>(
  participants: T[]
): Map<string, string> {
  const shuffled = shuffleArray(participants);
  const assignments = new Map<string, string>();
  
  for (let i = 0; i < shuffled.length; i++) {
    const giver = shuffled[i];
    const receiver = shuffled[(i + 1) % shuffled.length];
    assignments.set(giver.id, receiver.id);
  }
  
  return assignments;
}

/**
 * Valida il numero di partecipanti (min 2, max 20)
 */
export function validateParticipantCount(count: number): boolean {
  return count >= 2 && count <= 20;
}

/**
 * Valida che i nomi dei partecipanti siano univoci
 */
export function validateUniqueNames(names: string[]): boolean {
  const uniqueNames = new Set(names.map(n => n.toLowerCase().trim()));
  return uniqueNames.size === names.length;
}
