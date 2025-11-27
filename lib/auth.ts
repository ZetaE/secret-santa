import { NextRequest } from 'next/server';

/**
 * Verifica se la richiesta proviene dall'admin autenticato
 * Controlla il path segreto nell'URL o nell'header
 */
export function isAdminAuthenticated(request: NextRequest): boolean {
  const adminSecretPath = process.env.ADMIN_SECRET_PATH;
  
  if (!adminSecretPath) {
    console.error('ADMIN_SECRET_PATH not configured');
    return false;
  }

  // Controlla header personalizzato per le API
  const authHeader = request.headers.get('x-admin-secret');
  if (authHeader === adminSecretPath) {
    return true;
  }

  // Controlla il path dell'URL
  const url = new URL(request.url);
  if (url.pathname.includes(`/admin/${adminSecretPath}`)) {
    return true;
  }

  return false;
}

/**
 * Middleware helper per proteggere le route admin
 */
export function requireAdmin(request: NextRequest): Response | null {
  if (!isAdminAuthenticated(request)) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
  return null;
}
