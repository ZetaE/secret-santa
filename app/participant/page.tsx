'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface ParticipantData {
  participant: {
    id: string;
    name: string;
    secret_santa: {
      id: string;
      name: string;
      status: 'PENDING' | 'COMPLETED';
    };
  };
  assigned_to: {
    name: string;
  } | null;
}

export default function ParticipantPage() {
  const [data, setData] = useState<ParticipantData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      const savedCode = localStorage.getItem('participant_code');
      
      if (!savedCode) {
        router.push('/');
        return;
      }

      try {
        // Ricarica i dati dal server per avere lo stato aggiornato
        const response = await fetch('/api/verify-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: savedCode }),
        });

        if (!response.ok) {
          throw new Error('Codice non valido');
        }

        const freshData = await response.json();
        setData(freshData);
        localStorage.setItem('participant_data', JSON.stringify(freshData));
      } catch (err) {
        console.error('Error loading participant data:', err);
        localStorage.removeItem('participant_code');
        localStorage.removeItem('participant_data');
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('participant_code');
    localStorage.removeItem('participant_data');
    router.push('/');
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

  if (!data) {
    return null;
  }

  const { participant, assigned_to } = data;
  const isPending = participant.secret_santa.status === 'PENDING';

  return (
    <div className="min-h-screen p-4 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-christmas-red mb-2">
            🎅 Secret Santa
          </h1>
          <h2 className="text-2xl font-semibold text-gray-800">
            {participant.secret_santa.name}
          </h2>
        </div>

        <div className="card mb-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Benvenuto</p>
            <p className="text-3xl font-bold text-gray-900">{participant.name}</p>
          </div>
        </div>

        {isPending ? (
          <div className="card bg-yellow-50 border-yellow-200">
            <div className="text-center">
              <p className="text-4xl mb-4">⏳</p>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Estrazione non ancora effettuata
              </h3>
              <p className="text-gray-600">
                L'amministratore deve ancora completare l'assegnazione dei partecipanti.
                Torna più tardi per scoprire a chi dovrai fare il regalo!
              </p>
            </div>
          </div>
        ) : (
          <div className="card bg-green-50 border-green-200">
            <div className="text-center">
              <p className="text-4xl mb-4">🎁</p>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Il tuo destinatario è...
              </h3>
              <div className="bg-white rounded-lg p-6 mt-4 border-2 border-christmas-gold">
                <p className="text-3xl font-bold text-christmas-red">
                  {assigned_to?.name || 'Caricamento...'}
                </p>
              </div>
              <p className="text-gray-600 mt-4">
                Ricorda: è un segreto! 🤫
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={handleLogout}
            className="text-sm text-gray-600 hover:text-gray-900 underline"
          >
            Esci
          </button>
        </div>
      </div>
    </div>
  );
}
