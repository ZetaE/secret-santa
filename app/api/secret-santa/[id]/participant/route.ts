import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/auth';
import { generateParticipantCode, validateUniqueNames } from '@/lib/utils';
import { sendWelcomeEmail } from '@/lib/email';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Verifica autenticazione admin
  const authError = requireAdmin(request);
  if (authError) return authError;

  try {
    const { id } = params;
    const body = await request.json();
    const { name, email } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'Nome partecipante richiesto' },
        { status: 400 }
      );
    }

    // Verifica che il Secret Santa esista e sia PENDING
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

    if (secretSanta.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Non è possibile aggiungere partecipanti a un Secret Santa completato' },
        { status: 400 }
      );
    }

    // Verifica limite massimo (20 partecipanti)
    if (secretSanta.participants.length >= 20) {
      return NextResponse.json(
        { error: 'Raggiunto il limite massimo di 20 partecipanti' },
        { status: 400 }
      );
    }

    // Verifica unicità del nome
    const existingNames = secretSanta.participants.map((p: { name: string }) => p.name);
    if (!validateUniqueNames([...existingNames, name])) {
      return NextResponse.json(
        { error: 'Esiste già un partecipante con questo nome' },
        { status: 400 }
      );
    }

    // Aggiungi partecipante
    const { data: newParticipant, error: insertError } = await supabaseAdmin
      .from('participants')
      .insert({
        secret_santa_id: id,
        name: name.trim(),
        email: email?.trim() || null,
        access_code: generateParticipantCode(secretSanta.name),
        has_accessed: false,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Invia email di benvenuto se l'email è fornita
    let emailSent = false;
    if (newParticipant && email?.trim()) {
      const host = request.headers.get('host') || 'localhost:3000';
      const protocol = request.headers.get('x-forwarded-proto') || 'http';
      const baseUrl = `${protocol}://${host}`;
      
      emailSent = await sendWelcomeEmail({
        participantName: newParticipant.name,
        participantEmail: email.trim(),
        secretSantaName: secretSanta.name,
        accessCode: newParticipant.access_code,
        baseUrl,
      });
    }

    return NextResponse.json({ 
      ...newParticipant, 
      emailSent 
    }, { status: 201 });

  } catch (error) {
    console.error('Error adding participant:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
