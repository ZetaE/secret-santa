import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Ottieni Secret Santa con partecipanti e assegnazioni
    const { data: secretSanta, error } = await supabaseAdmin
      .from('secret_santas')
      .select(`
        *,
        participants (*)
      `)
      .eq('id', id)
      .single();

    if (error || !secretSanta) {
      return NextResponse.json(
        { error: 'Secret Santa non trovato' },
        { status: 404 }
      );
    }

    // Se è completato, popola le assegnazioni
    if (secretSanta.status === 'COMPLETED' && secretSanta.participants) {
      const participantsMap = new Map(
        secretSanta.participants.map((p: any) => [p.id, p])
      );

      secretSanta.participants = secretSanta.participants.map((p: any) => ({
        ...p,
        assigned_to: p.assigned_to_id ? participantsMap.get(p.assigned_to_id) : null,
      }));
    }

    return NextResponse.json(secretSanta);
  } catch (error) {
    console.error('Error fetching Secret Santa:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Verifica autenticazione admin
  const authError = requireAdmin(request);
  if (authError) return authError;

  try {
    const { id } = params;

    // Verifica che il Secret Santa esista
    const { data: secretSanta, error: fetchError } = await supabaseAdmin
      .from('secret_santas')
      .select('id, name')
      .eq('id', id)
      .single();

    if (fetchError || !secretSanta) {
      return NextResponse.json(
        { error: 'Secret Santa non trovato' },
        { status: 404 }
      );
    }

    // Elimina il Secret Santa (i partecipanti vengono eliminati automaticamente per CASCADE)
    const { error: deleteError } = await supabaseAdmin
      .from('secret_santas')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    return NextResponse.json({ 
      message: 'Secret Santa eliminato con successo',
      name: secretSanta.name
    });

  } catch (error) {
    console.error('Error deleting Secret Santa:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
