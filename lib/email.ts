import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';

// Initialize MailerSend client only if API key is configured
const mailersend = process.env.MAILERSEND_API_KEY 
  ? new MailerSend({ apiKey: process.env.MAILERSEND_API_KEY })
  : null;

// Email sender configuration - lazy initialization to avoid errors when not configured
function getDefaultSender(): Sender {
  return new Sender(
    process.env.MAILERSEND_FROM_EMAIL || 'noreply@secretsanta.app',
    process.env.MAILERSEND_FROM_NAME || 'Secret Santa'
  );
}

interface WelcomeEmailParams {
  participantName: string;
  participantEmail: string;
  secretSantaName: string;
  accessCode: string;
  baseUrl: string;
}

/**
 * Escapes HTML special characters to prevent XSS in email templates
 */
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Genera l'URL di accesso diretto per un partecipante
 */
export function generateDirectAccessUrl(baseUrl: string, accessCode: string): string {
  return `${baseUrl}?code=${encodeURIComponent(accessCode)}`;
}

/**
 * Genera il contenuto HTML dell'email di benvenuto
 */
function generateWelcomeEmailHtml(params: WelcomeEmailParams): string {
  const directLink = generateDirectAccessUrl(params.baseUrl, params.accessCode);
  const safeParticipantName = escapeHtml(params.participantName);
  const safeSecretSantaName = escapeHtml(params.secretSantaName);
  const safeAccessCode = escapeHtml(params.accessCode);
  
  return `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #c41e3a 0%, #1a472a 100%); padding: 40px 20px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 32px;">🎅 Secret Santa</h1>
      <p style="color: #ffffff; margin: 10px 0 0; opacity: 0.9;">${safeSecretSantaName}</p>
    </div>
    
    <!-- Content -->
    <div style="padding: 40px 30px;">
      <h2 style="color: #333333; margin-top: 0;">Ciao ${safeParticipantName}! 👋</h2>
      
      <p style="color: #555555; line-height: 1.6; font-size: 16px;">
        Sei stato invitato a partecipare al Secret Santa <strong>${safeSecretSantaName}</strong>!
      </p>
      
      <p style="color: #555555; line-height: 1.6; font-size: 16px;">
        Quando l'amministratore avrà completato l'estrazione, potrai scoprire a chi dovrai fare il regalo.
      </p>
      
      <!-- Access Code Box -->
      <div style="background-color: #f8f9fa; border: 2px dashed #c41e3a; border-radius: 8px; padding: 20px; margin: 30px 0; text-align: center;">
        <p style="color: #666666; margin: 0 0 10px; font-size: 14px;">Il tuo codice di accesso:</p>
        <p style="font-family: monospace; font-size: 24px; color: #c41e3a; margin: 0; font-weight: bold; letter-spacing: 1px;">
          ${safeAccessCode}
        </p>
      </div>
      
      <!-- CTA Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${directLink}" 
           style="display: inline-block; background-color: #c41e3a; color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-size: 16px; font-weight: bold;">
          Accedi a Secret Santa 🎁
        </a>
      </div>
      
      <p style="color: #888888; font-size: 14px; line-height: 1.6;">
        Se il pulsante non funziona, copia e incolla questo link nel tuo browser:<br>
        <a href="${directLink}" style="color: #c41e3a; word-break: break-all;">${escapeHtml(directLink)}</a>
      </p>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #eeeeee;">
      <p style="color: #999999; font-size: 12px; margin: 0;">
        🎄 Buon Secret Santa! 🎄<br>
        <span style="font-size: 11px;">Questa email è stata inviata automaticamente.</span>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Genera il contenuto testuale dell'email di benvenuto
 */
function generateWelcomeEmailText(params: WelcomeEmailParams): string {
  const directLink = generateDirectAccessUrl(params.baseUrl, params.accessCode);
  
  return `
🎅 Secret Santa - ${params.secretSantaName}

Ciao ${params.participantName}!

Sei stato invitato a partecipare al Secret Santa "${params.secretSantaName}"!

Quando l'amministratore avrà completato l'estrazione, potrai scoprire a chi dovrai fare il regalo.

Il tuo codice di accesso: ${params.accessCode}

Accedi direttamente cliccando qui: ${directLink}

🎄 Buon Secret Santa! 🎄
  `.trim();
}

/**
 * Invia un'email di benvenuto a un partecipante
 * Ritorna true se l'invio è andato a buon fine, false altrimenti
 */
export async function sendWelcomeEmail(params: WelcomeEmailParams): Promise<boolean> {
  // Se MailerSend non è configurato, log e ritorna false
  if (!mailersend) {
    console.log(`[Email] MailerSend non configurato. Email non inviata a ${params.participantEmail}`);
    return false;
  }

  try {
    const recipients = [new Recipient(params.participantEmail, params.participantName)];

    const emailParams = new EmailParams()
      .setFrom(getDefaultSender())
      .setTo(recipients)
      .setSubject(`🎅 Sei stato invitato al Secret Santa "${params.secretSantaName}"!`)
      .setHtml(generateWelcomeEmailHtml(params))
      .setText(generateWelcomeEmailText(params));

    await mailersend.email.send(emailParams);
    console.log(`[Email] Email di benvenuto inviata con successo a ${params.participantEmail}`);
    return true;
  } catch (error) {
    console.error(`[Email] Errore nell'invio dell'email a ${params.participantEmail}:`, error);
    return false;
  }
}

/**
 * Invia email di benvenuto a tutti i partecipanti con email configurata
 */
export async function sendWelcomeEmailsToAll(
  participants: Array<{
    name: string;
    email?: string | null;
    access_code: string;
  }>,
  secretSantaName: string,
  baseUrl: string
): Promise<{ sent: number; failed: number; skipped: number }> {
  const results = { sent: 0, failed: 0, skipped: 0 };

  for (const participant of participants) {
    if (!participant.email) {
      results.skipped++;
      continue;
    }

    const success = await sendWelcomeEmail({
      participantName: participant.name,
      participantEmail: participant.email,
      secretSantaName,
      accessCode: participant.access_code,
      baseUrl,
    });

    if (success) {
      results.sent++;
    } else {
      results.failed++;
    }
  }

  return results;
}

/**
 * Verifica se il servizio email è configurato
 */
export function isEmailServiceConfigured(): boolean {
  return !!process.env.MAILERSEND_API_KEY;
}

interface CompletionEmailParams {
  participantName: string;
  participantEmail: string;
  secretSantaName: string;
  accessCode: string;
  baseUrl: string;
}

/**
 * Genera il contenuto HTML dell'email di completamento estrazione
 */
function generateCompletionEmailHtml(params: CompletionEmailParams): string {
  const directLink = generateDirectAccessUrl(params.baseUrl, params.accessCode);
  const safeParticipantName = escapeHtml(params.participantName);
  const safeSecretSantaName = escapeHtml(params.secretSantaName);
  const safeAccessCode = escapeHtml(params.accessCode);
  
  return `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #0f5132 0%, #c41e3a 100%); padding: 40px 20px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 32px;">🎁 Estrazione Completata!</h1>
      <p style="color: #ffffff; margin: 10px 0 0; opacity: 0.9;">${safeSecretSantaName}</p>
    </div>
    
    <!-- Content -->
    <div style="padding: 40px 30px;">
      <h2 style="color: #333333; margin-top: 0;">Ciao ${safeParticipantName}! 🎉</h2>
      
      <p style="color: #555555; line-height: 1.6; font-size: 16px;">
        L'estrazione per il Secret Santa <strong>${safeSecretSantaName}</strong> è stata completata!
      </p>
      
      <p style="color: #555555; line-height: 1.6; font-size: 16px;">
        Puoi ora scoprire a chi dovrai fare il regalo. Clicca sul pulsante qui sotto per accedere!
      </p>
      
      <!-- Access Code Box -->
      <div style="background-color: #f0fdf4; border: 2px solid #0f5132; border-radius: 8px; padding: 20px; margin: 30px 0; text-align: center;">
        <p style="color: #666666; margin: 0 0 10px; font-size: 14px;">Il tuo codice di accesso:</p>
        <p style="font-family: monospace; font-size: 24px; color: #0f5132; margin: 0; font-weight: bold; letter-spacing: 1px;">
          ${safeAccessCode}
        </p>
      </div>
      
      <!-- CTA Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${directLink}" 
           style="display: inline-block; background-color: #0f5132; color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-size: 16px; font-weight: bold;">
          Scopri il tuo destinatario! 🎁
        </a>
      </div>
      
      <div style="background-color: #fff7ed; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="color: #92400e; margin: 0; font-size: 14px;">
          <strong>🤫 Ricorda:</strong> è un segreto! Non rivelare a nessuno chi è il tuo destinatario.
        </p>
      </div>
      
      <p style="color: #888888; font-size: 14px; line-height: 1.6;">
        Se il pulsante non funziona, copia e incolla questo link nel tuo browser:<br>
        <a href="${directLink}" style="color: #0f5132; word-break: break-all;">${escapeHtml(directLink)}</a>
      </p>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #eeeeee;">
      <p style="color: #999999; font-size: 12px; margin: 0;">
        🎄 Buon Secret Santa! 🎄<br>
        <span style="font-size: 11px;">Questa email è stata inviata automaticamente.</span>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Genera il contenuto testuale dell'email di completamento
 */
function generateCompletionEmailText(params: CompletionEmailParams): string {
  const directLink = generateDirectAccessUrl(params.baseUrl, params.accessCode);
  
  return `
🎁 Secret Santa - Estrazione Completata!

Ciao ${params.participantName}!

L'estrazione per il Secret Santa "${params.secretSantaName}" è stata completata!

Puoi ora scoprire a chi dovrai fare il regalo.

Il tuo codice di accesso: ${params.accessCode}

Accedi direttamente cliccando qui: ${directLink}

🤫 Ricorda: è un segreto! Non rivelare a nessuno chi è il tuo destinatario.

🎄 Buon Secret Santa! 🎄
  `.trim();
}

/**
 * Invia un'email di completamento estrazione a un partecipante
 */
export async function sendCompletionEmail(params: CompletionEmailParams): Promise<boolean> {
  if (!mailersend) {
    console.log(`[Email] MailerSend non configurato. Email di completamento non inviata a ${params.participantEmail}`);
    return false;
  }

  try {
    const recipients = [new Recipient(params.participantEmail, params.participantName)];

    const emailParams = new EmailParams()
      .setFrom(getDefaultSender())
      .setTo(recipients)
      .setSubject(`🎁 Estrazione completata - Secret Santa "${params.secretSantaName}"!`)
      .setHtml(generateCompletionEmailHtml(params))
      .setText(generateCompletionEmailText(params));

    await mailersend.email.send(emailParams);
    console.log(`[Email] Email di completamento inviata con successo a ${params.participantEmail}`);
    return true;
  } catch (error) {
    console.error(`[Email] Errore nell'invio dell'email di completamento a ${params.participantEmail}:`, error);
    return false;
  }
}

/**
 * Invia email di completamento a tutti i partecipanti con email configurata
 */
export async function sendCompletionEmailsToAll(
  participants: Array<{
    name: string;
    email?: string | null;
    access_code: string;
  }>,
  secretSantaName: string,
  baseUrl: string
): Promise<{ sent: number; failed: number; skipped: number }> {
  const results = { sent: 0, failed: 0, skipped: 0 };

  for (const participant of participants) {
    if (!participant.email) {
      results.skipped++;
      continue;
    }

    const success = await sendCompletionEmail({
      participantName: participant.name,
      participantEmail: participant.email,
      secretSantaName,
      accessCode: participant.access_code,
      baseUrl,
    });

    if (success) {
      results.sent++;
    } else {
      results.failed++;
    }
  }

  return results;
}
