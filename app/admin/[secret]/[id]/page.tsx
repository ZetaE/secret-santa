'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface Participant {
  id: string;
  name: string;
  access_code: string;
  has_accessed: boolean;
  assigned_to?: { name: string };
}

interface SecretSantaDetail {
  id: string;
  name: string;
  status: 'PENDING' | 'COMPLETED';
  created_at: string;
  participants: Participant[];
}

export default function AdminDetailPage() {
  const [secretSanta, setSecretSanta] = useState<SecretSantaDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newParticipantName, setNewParticipantName] = useState('');
  const [error, setError] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const adminSecret = params.secret as string;
  const id = params.id as string;

  useEffect(() => {
    loadSecretSanta();
  }, [id]);

  const loadSecretSanta = async () => {
    try {
      const response = await fetch(`/api/secret-santa/${id}`, {
        headers: {
          'x-admin-secret': adminSecret,
        },
        cache: 'no-store', // Disabilita cache per avere sempre dati freschi
      });

      if (!response.ok) throw new Error('Not found');

      const data = await response.json();
      setSecretSanta(data);
    } catch (err) {
      console.error('Error loading Secret Santa:', err);
      router.push(`/admin/${adminSecret}`);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!confirm('Sei sicuro di voler completare questo Secret Santa? L\'operazione è irreversibile.')) {
      return;
    }

    try {
      const response = await fetch(`/api/secret-santa/${id}/complete`, {
        method: 'POST',
        headers: {
          'x-admin-secret': adminSecret,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      alert('Secret Santa completato! Le assegnazioni sono state generate.');
      loadSecretSanta();
    } catch (err: any) {
      alert(`Errore: ${err.message}`);
    }
  };

  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch(`/api/secret-santa/${id}/participant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': adminSecret,
        },
        body: JSON.stringify({ name: newParticipantName.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      setNewParticipantName('');
      setShowAddForm(false);
      loadSecretSanta();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRemoveParticipant = async (participantId: string) => {
    if (!confirm('Sei sicuro di voler rimuovere questo partecipante?')) {
      return;
    }

    try {
      const response = await fetch(
        `/api/secret-santa/${id}/participant/${participantId}`,
        {
          method: 'DELETE',
          headers: {
            'x-admin-secret': adminSecret,
          },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      loadSecretSanta();
    } catch (err: any) {
      alert(`Errore: ${err.message}`);
    }
  };

  const handleRegenerateCode = async (participantId: string) => {
    try {
      const response = await fetch(
        `/api/secret-santa/${id}/participant/${participantId}/regenerate-code`,
        {
          method: 'POST',
          headers: {
            'x-admin-secret': adminSecret,
          },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      const result = await response.json();
      
      // Ricarica i dati prima di mostrare l'alert
      await loadSecretSanta();
      
      alert(`Codice rigenerato con successo!\nNuovo codice: ${result.participant.access_code}`);
    } catch (err: any) {
      alert(`Errore: ${err.message}`);
    }
  };

  const handleRegenerateAllCodes = async () => {
    if (!confirm('Sei sicuro di voler rigenerare TUTTI i codici?')) {
      return;
    }

    try {
      const response = await fetch(`/api/secret-santa/${id}/regenerate-codes`, {
        method: 'POST',
        headers: {
          'x-admin-secret': adminSecret,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      loadSecretSanta();
      alert('Tutti i codici sono stati rigenerati!');
    } catch (err: any) {
      alert(`Errore: ${err.message}`);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleDeleteSecretSanta = async () => {
    if (!confirm(`Sei sicuro di voler eliminare definitivamente "${secretSanta?.name}"?\n\nQuesta operazione eliminerà:\n- Il Secret Santa\n- Tutti i partecipanti\n- Tutte le assegnazioni\n\nL'operazione è IRREVERSIBILE.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/secret-santa/${id}`, {
        method: 'DELETE',
        headers: {
          'x-admin-secret': adminSecret,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      alert('Secret Santa eliminato con successo');
      router.push(`/admin/${adminSecret}`);
    } catch (err: any) {
      alert(`Errore: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">🎁</div>
          <p className="text-gray-600">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (!secretSanta) {
    return null;
  }

  const isPending = secretSanta.status === 'PENDING';

  return (
    <div className="min-h-screen p-4 py-8">
      <div className="max-w-6xl mx-auto">
        <Link
          href={`/admin/${adminSecret}`}
          className="text-christmas-green hover:underline mb-4 inline-block"
        >
          ← Torna alla dashboard
        </Link>

        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-gray-900">
              {secretSanta.name}
            </h1>
            <p className="text-gray-600 mt-2">
              {secretSanta.participants.length} partecipanti •{' '}
              <span
                className={`badge ${isPending ? 'badge-pending' : 'badge-completed'}`}
              >
                {isPending ? '⏳ In attesa' : '✅ Completato'}
              </span>
            </p>
          </div>

          <button
            onClick={handleDeleteSecretSanta}
            className="text-red-600 hover:text-red-800 text-sm underline"
            title="Elimina Secret Santa"
          >
            🗑️ Elimina
          </button>
        </div>

        <div className="flex items-center justify-between mb-8">
          {isPending && (
            <div className="space-x-2">
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="btn btn-secondary"
              >
                + Aggiungi Partecipante
              </button>
              <button
                onClick={handleComplete}
                className="btn btn-primary"
                disabled={secretSanta.participants.length < 2}
              >
                🎲 Completa Estrazione
              </button>
            </div>
          )}
        </div>

        {showAddForm && isPending && (
          <div className="card mb-6">
            <h3 className="text-lg font-semibold mb-4">Aggiungi Partecipante</h3>
            <form onSubmit={handleAddParticipant} className="space-y-4">
              <input
                type="text"
                value={newParticipantName}
                onChange={(e) => setNewParticipantName(e.target.value)}
                placeholder="Nome partecipante"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-christmas-red focus:border-transparent"
              />
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <div className="flex gap-2">
                <button type="submit" className="btn btn-primary">
                  Aggiungi
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setError('');
                  }}
                  className="btn btn-outline"
                >
                  Annulla
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Partecipanti</h2>
            {isPending && secretSanta.participants.length > 0 && (
              <button
                onClick={handleRegenerateAllCodes}
                className="text-sm text-christmas-green hover:underline"
              >
                🔄 Rigenera tutti i codici
              </button>
            )}
          </div>

          <div className="space-y-3">
            {secretSanta.participants.map((participant) => (
              <div
                key={participant.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{participant.name}</h3>
                      {participant.has_accessed && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          ✓ Ha effettuato l'accesso
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <code className="bg-gray-100 px-3 py-1 rounded text-sm font-mono">
                        {participant.access_code}
                      </code>
                      <button
                        onClick={() => copyCode(participant.access_code)}
                        className="text-sm text-christmas-green hover:underline"
                      >
                        {copiedCode === participant.access_code ? '✓ Copiato!' : '📋 Copia'}
                      </button>
                    </div>
                    {!isPending && participant.assigned_to && (
                      <p className="mt-2 text-sm text-gray-600">
                        → Deve fare il regalo a:{' '}
                        <span className="font-semibold">{participant.assigned_to.name}</span>
                      </p>
                    )}
                  </div>

                  {isPending && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRegenerateCode(participant.id)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                        title="Rigenera codice"
                      >
                        🔄
                      </button>
                      <button
                        onClick={() => handleRemoveParticipant(participant.id)}
                        className="text-sm text-red-600 hover:text-red-800"
                        title="Rimuovi partecipante"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
