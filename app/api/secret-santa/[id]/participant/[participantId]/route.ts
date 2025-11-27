import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; participantId: string } }
) {
  // Verifica autenticazione admin
  const authError = requireAdmin(request);
  if (authError) return authError;

  try {
    const { id, participantId } = params;

    // Verifica che il Secret Santa sia in stato PENDING
    const { data: secretSanta, error: fetchError } = await supabaseAdmin
      .from('secret_santas')
      .select('status')
      .eq('id', id)
      .single();

    if (fetchError || !secretSanta) {
      return NextResponse.json(
        { error: 'Secret Santa non trovato' },
        { status: 404 }
      );
    }

    if (secretSanta.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Non è possibile rimuovere partecipanti da un Secret Santa completato' },
        { status: 400 }
      );
    }

    // Elimina il partecipante
    const { error: deleteError } = await supabaseAdmin
      .from('participants')
      .delete()
      .eq('id', participantId)
      .eq('secret_santa_id', id);

    if (deleteError) throw deleteError;

    return NextResponse.json({ 
      message: 'Partecipante rimosso con successo' 
    });

  } catch (error) {
    console.error('Error deleting participant:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
