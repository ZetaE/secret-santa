import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/auth';
import { generateParticipantCode } from '@/lib/utils';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; participantId: string } }
) {
  // Verifica autenticazione admin
  const authError = requireAdmin(request);
  if (authError) return authError;

  try {
    const { id, participantId } = params;

    // Verifica che il partecipante esista e appartenga al Secret Santa
    const { data: participant, error: fetchError } = await supabaseAdmin
      .from('participants')
      .select('*, secret_santas(*)')
      .eq('id', participantId)
      .eq('secret_santa_id', id)
      .single();

    if (fetchError || !participant) {
      return NextResponse.json(
        { error: 'Partecipante non trovato' },
        { status: 404 }
      );
    }

    // Rigenera il codice
    const newCode = generateParticipantCode(participant.secret_santas.name);

    const { data: updatedParticipant, error: updateError } = await supabaseAdmin
      .from('participants')
      .update({ 
        access_code: newCode,
        has_accessed: false 
      })
      .eq('id', participantId)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({
      message: 'Codice rigenerato con successo',
      participant: updatedParticipant,
    });

  } catch (error) {
    console.error('Error regenerating participant code:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
