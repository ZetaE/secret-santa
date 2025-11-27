import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/auth';
import { generateParticipantCode } from '@/lib/utils';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Verifica autenticazione admin
  const authError = requireAdmin(request);
  if (authError) return authError;

  try {
    const { id } = params;

    // Ottieni Secret Santa con partecipanti
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

    // Rigenera tutti i codici
    const updates = secretSanta.participants.map((participant: any) => 
      supabaseAdmin
        .from('participants')
        .update({ 
          access_code: generateParticipantCode(secretSanta.name),
          has_accessed: false 
        })
        .eq('id', participant.id)
        .select()
        .single()
    );

    const results = await Promise.all(updates);

    // Controlla se ci sono stati errori
    const errors = results.filter(r => r.error);
    if (errors.length > 0) {
      throw new Error('Errore durante la rigenerazione dei codici');
    }

    const updatedParticipants = results.map(r => r.data);

    return NextResponse.json({
      message: 'Codici rigenerati con successo',
      participants: updatedParticipants,
    });

  } catch (error) {
    console.error('Error regenerating codes:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
