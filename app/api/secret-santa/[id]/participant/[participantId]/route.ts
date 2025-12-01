import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/auth';
import { sendWelcomeEmail } from '@/lib/email';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; participantId: string } }
) {
  // Verifica autenticazione admin
  const authError = requireAdmin(request);
  if (authError) return authError;

  try {
    const { id, participantId } = params;
    const body = await request.json();
    const { email } = body;

    // Valida email se fornita
    if (email && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return NextResponse.json(
          { error: 'Email non valida' },
          { status: 400 }
        );
      }
    }

    // Verifica che il partecipante appartenga al Secret Santa
    const { data: participantData, error: fetchError } = await supabaseAdmin
      .from('participants')
      .select('id, secret_santa_id, name, email, access_code, secret_santas!inner(name, status)')
      .eq('id', participantId)
      .eq('secret_santa_id', id)
      .single();

    if (fetchError || !participantData) {
      return NextResponse.json(
        { error: 'Partecipante non trovato' },
        { status: 404 }
      );
    }

    // @ts-ignore - Supabase typing issue with nested relations
    const secretSantaData = Array.isArray(participantData.secret_santas) 
      ? participantData.secret_santas[0] 
      : participantData.secret_santas;

    // Verifica che il Secret Santa sia in stato PENDING
    if (secretSantaData.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Non è possibile modificare l\'email dopo il completamento dell\'estrazione' },
        { status: 400 }
      );
    }

    const oldEmail = participantData.email;
    const newEmail = email?.trim() || null;

    // Aggiorna l'email del partecipante
    const { data: updatedParticipant, error: updateError } = await supabaseAdmin
      .from('participants')
      .update({ email: newEmail })
      .eq('id', participantId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Se è stata aggiunta una nuova email (non era presente prima), invia email di benvenuto
    if (!oldEmail && newEmail) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                      request.headers.get('origin') || 
                      'http://localhost:3000';
      
      const emailSent = await sendWelcomeEmail({
        participantName: participantData.name,
        participantEmail: newEmail,
        secretSantaName: secretSantaData.name,
        accessCode: participantData.access_code,
        baseUrl,
      });

      console.log(`[Email] Email di benvenuto ${emailSent ? 'inviata' : 'non inviata'} a ${newEmail}`);
    }

    return NextResponse.json({ 
      message: 'Email aggiornata con successo',
      participant: updatedParticipant
    });

  } catch (error) {
    console.error('Error updating participant:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

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
