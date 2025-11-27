'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface SecretSanta {
  id: string;
  name: string;
  status: 'PENDING' | 'COMPLETED';
  created_at: string;
  participants: Array<{ id: string; name: string }>;
}

export default function AdminDashboard() {
  const [secretSantas, setSecretSantas] = useState<SecretSanta[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [participants, setParticipants] = useState(['', '']);
  const [error, setError] = useState('');
  const router = useRouter();
  const params = useParams();
  const adminSecret = params.secret as string;

  useEffect(() => {
    loadSecretSantas();
  }, []);

  const loadSecretSantas = async () => {
    try {
      const response = await fetch('/api/secret-santa', {
        headers: {
          'x-admin-secret': adminSecret,
        },
      });

      if (!response.ok) throw new Error('Unauthorized');

      const data = await response.json();
      setSecretSantas(data);
    } catch (err) {
      console.error('Error loading Secret Santas:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validParticipants = participants
      .map(p => p.trim())
      .filter(p => p.length > 0);

    if (!newName.trim()) {
      setError('Il nome del Secret Santa è obbligatorio');
      return;
    }

    if (validParticipants.length < 2) {
      setError('Servono almeno 2 partecipanti');
      return;
    }

    if (validParticipants.length > 20) {
      setError('Massimo 20 partecipanti');
      return;
    }

    try {
      const response = await fetch('/api/secret-santa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': adminSecret,
        },
        body: JSON.stringify({
          name: newName.trim(),
          participants: validParticipants.map(name => ({ name })),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      const newSecretSanta = await response.json();
      
      // Reset form e ricarica lista
      setNewName('');
      setParticipants(['', '']);
      setShowCreateForm(false);
      loadSecretSantas();

      // Redirect al dettaglio
      router.push(`/admin/${adminSecret}/${newSecretSanta.id}`);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const addParticipantField = () => {
    if (participants.length < 20) {
      setParticipants([...participants, '']);
    }
  };

  const removeParticipantField = (index: number) => {
    if (participants.length > 2) {
      setParticipants(participants.filter((_, i) => i !== index));
    }
  };

  const updateParticipant = (index: number, value: string) => {
    const updated = [...participants];
    updated[index] = value;
    setParticipants(updated);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">🎅</div>
          <p className="text-gray-600">Caricamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-christmas-red">
              🎅 Admin Dashboard
            </h1>
            <p className="text-gray-600 mt-2">Gestisci i tuoi Secret Santa</p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="btn btn-primary"
          >
            {showCreateForm ? 'Annulla' : '+ Nuovo Secret Santa'}
          </button>
        </div>

        {showCreateForm && (
          <div className="card mb-8">
            <h2 className="text-2xl font-bold mb-4">Crea Nuovo Secret Santa</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome del Secret Santa
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Natale Ufficio 2025"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-christmas-red focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Partecipanti (min 2, max 20)
                </label>
                <div className="space-y-2">
                  {participants.map((participant, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={participant}
                        onChange={(e) => updateParticipant(index, e.target.value)}
                        placeholder={`Partecipante ${index + 1}`}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-christmas-red focus:border-transparent"
                      />
                      {participants.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeParticipantField(index)}
                          className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {participants.length < 20 && (
                  <button
                    type="button"
                    onClick={addParticipantField}
                    className="mt-2 text-sm text-christmas-green hover:underline"
                  >
                    + Aggiungi partecipante
                  </button>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <button type="submit" className="btn btn-primary w-full">
                Crea Secret Santa
              </button>
            </form>
          </div>
        )}

        <div className="space-y-4">
          {secretSantas.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-6xl mb-4">🎁</p>
              <p className="text-xl text-gray-600">
                Nessun Secret Santa creato ancora.
              </p>
              <p className="text-gray-500 mt-2">
                Clicca su "Nuovo Secret Santa" per iniziare!
              </p>
            </div>
          ) : (
            secretSantas.map((ss) => (
              <Link
                key={ss.id}
                href={`/admin/${adminSecret}/${ss.id}`}
                className="card block hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {ss.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {ss.participants.length} partecipanti
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`badge ${
                        ss.status === 'PENDING' ? 'badge-pending' : 'badge-completed'
                      }`}
                    >
                      {ss.status === 'PENDING' ? '⏳ In attesa' : '✅ Completato'}
                    </span>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(ss.created_at).toLocaleDateString('it-IT')}
                    </p>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
