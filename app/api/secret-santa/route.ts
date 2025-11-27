import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/auth';
import { 
  generateParticipantCode, 
  validateParticipantCount, 
  validateUniqueNames 
} from '@/lib/utils';

export async function POST(request: NextRequest) {
  // Verifica autenticazione admin
  const authError = requireAdmin(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { name, participants } = body;

    // Validazioni
    if (!name || !participants || !Array.isArray(participants)) {
      return NextResponse.json(
        { error: 'Nome e lista partecipanti richiesti' },
        { status: 400 }
      );
    }

    const participantNames = participants.map((p: { name: string }) => p.name);

    if (!validateParticipantCount(participantNames.length)) {
      return NextResponse.json(
        { error: 'Numero partecipanti deve essere tra 2 e 20' },
        { status: 400 }
      );
    }

    if (!validateUniqueNames(participantNames)) {
      return NextResponse.json(
        { error: 'I nomi dei partecipanti devono essere univoci' },
        { status: 400 }
      );
    }

    // Crea Secret Santa
    const { data: secretSanta, error: secretSantaError } = await supabaseAdmin
      .from('secret_santas')
      .insert({ name, status: 'PENDING' })
      .select()
      .single();

    if (secretSantaError) {
      // Controlla se è un errore di duplicazione
      if (secretSantaError.code === '23505') {
        return NextResponse.json(
          { error: 'Esiste già un Secret Santa con questo nome' },
          { status: 409 }
        );
      }
      throw secretSantaError;
    }

    if (!secretSanta) {
      throw new Error('Failed to create Secret Santa');
    }

    // Crea partecipanti con codici
    const participantsToInsert = participantNames.map((pName: string) => ({
      secret_santa_id: secretSanta.id,
      name: pName,
      access_code: generateParticipantCode(name),
      has_accessed: false,
    }));

    const { data: createdParticipants, error: participantsError } = await supabaseAdmin
      .from('participants')
      .insert(participantsToInsert)
      .select();

    if (participantsError) {
      // Rollback: elimina il Secret Santa se fallisce la creazione dei partecipanti
      await supabaseAdmin.from('secret_santas').delete().eq('id', secretSanta.id);
      throw participantsError;
    }

    return NextResponse.json({
      ...secretSanta,
      participants: createdParticipants,
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating Secret Santa:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Verifica autenticazione admin
  const authError = requireAdmin(request);
  if (authError) return authError;

  try {
    const { data: secretSantas, error } = await supabaseAdmin
      .from('secret_santas')
      .select(`
        *,
        participants (*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(secretSantas);
  } catch (error) {
    console.error('Error fetching Secret Santas:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
