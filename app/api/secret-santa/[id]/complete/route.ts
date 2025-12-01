import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/auth';
import { assignSecretSantas } from '@/lib/utils';
import { sendCompletionEmailsToAll } from '@/lib/email';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Verifica autenticazione admin
  const authError = requireAdmin(request);
  if (authError) return authError;

  try {
    const { id } = params;

    // Verifica che il Secret Santa esista e sia in stato PENDING
    const { data: secretSanta, error: fetchError } = await supabaseAdmin
      .from('secret_santas')
      .select('*, participants (*)')
      .eq('id', id)
      .single();

    if (fetchError || !secretSanta) {
      return NextResponse.json(
        { error: 'Secret Santa non trovato' },
        { status: 404 }
      );
    }

    if (secretSanta.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Secret Santa già completato' },
        { status: 400 }
      );
    }

    const participants = secretSanta.participants;
    
    if (participants.length < 2) {
      return NextResponse.json(
        { error: 'Servono almeno 2 partecipanti per completare' },
        { status: 400 }
      );
    }

    // Genera assegnazioni random
    const assignments = assignSecretSantas(participants);

    // Aggiorna database in una transazione
    const updates = Array.from(assignments.entries()).map(([giverId, receiverId]) => 
      supabaseAdmin
        .from('participants')
        .update({ assigned_to_id: receiverId })
        .eq('id', giverId)
    );

    await Promise.all(updates);

    // Aggiorna stato Secret Santa
    const { error: updateError } = await supabaseAdmin
      .from('secret_santas')
      .update({ status: 'COMPLETED' })
      .eq('id', id);

    if (updateError) throw updateError;

    // Invia email di completamento a tutti i partecipanti con email
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                    request.headers.get('origin') || 
                    'http://localhost:3000';
    
    const emailResults = await sendCompletionEmailsToAll(
      participants,
      secretSanta.name,
      baseUrl
    );

    console.log(`[Email] Risultati invio email completamento: ${emailResults.sent} inviate, ${emailResults.failed} fallite, ${emailResults.skipped} saltate`);

    return NextResponse.json({ 
      message: 'Secret Santa completato con successo',
      assignments: Object.fromEntries(assignments),
      emailResults
    });

  } catch (error) {
    console.error('Error completing Secret Santa:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
