import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Codice richiesto' },
        { status: 400 }
      );
    }

    // Cerca il partecipante con questo codice
    const { data: participant, error } = await supabaseAdmin
      .from('participants')
      .select(`
        *,
        secret_santas (*)
      `)
      .eq('access_code', code.trim())
      .single();

    if (error || !participant) {
      return NextResponse.json(
        { error: 'Codice non valido' },
        { status: 404 }
      );
    }

    // Aggiorna has_accessed se è la prima volta
    if (!participant.has_accessed) {
      await supabaseAdmin
        .from('participants')
        .update({ has_accessed: true })
        .eq('id', participant.id);
    }

    // Se completato, includi l'assegnazione
    let assignedTo = null;
    if (participant.secret_santas.status === 'COMPLETED' && participant.assigned_to_id) {
      const { data: assignedParticipant } = await supabaseAdmin
        .from('participants')
        .select('name')
        .eq('id', participant.assigned_to_id)
        .single();
      
      assignedTo = assignedParticipant;
    }

    return NextResponse.json({
      participant: {
        id: participant.id,
        name: participant.name,
        secret_santa: participant.secret_santas,
      },
      assigned_to: assignedTo,
    });

  } catch (error) {
    console.error('Error verifying code:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
