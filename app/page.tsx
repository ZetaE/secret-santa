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

        <div className="mt-8 text-center">
          <a
            href="https://github.com/ZetaE/secret-santa"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors inline-flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
            GitHub
          </a>
        </div>
      </div>
    </div>
  );
}
