'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Controlla se c'è un codice salvato in localStorage
    const savedCode = localStorage.getItem('participant_code');
    if (savedCode) {
      // Auto-login con il codice salvato
      verifyCode(savedCode);
    }
  }, []);

  const verifyCode = async (codeToVerify: string) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeToVerify }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Codice non valido');
      }

      const data = await response.json();
      
      // Salva il codice in localStorage
      localStorage.setItem('participant_code', codeToVerify);
      localStorage.setItem('participant_data', JSON.stringify(data));

      // Redirect alla pagina partecipante
      router.push('/participant');
    } catch (err: any) {
      setError(err.message);
      // Rimuovi codice salvato se non valido
      localStorage.removeItem('participant_code');
      localStorage.removeItem('participant_data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) {
      verifyCode(code.trim());
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-christmas-red mb-2">
            🎅 Secret Santa
          </h1>
          <p className="text-gray-600">
            Inserisci il tuo codice per partecipare
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                Codice Partecipante
              </label>
              <input
                type="text"
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="NataleUfficio-12345678"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-christmas-red focus:border-transparent"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifica in corso...' : 'Accedi'}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Non hai un codice? Contatta l'amministratore del tuo gruppo.</p>
        </div>
      </div>
    </div>
  );
}
