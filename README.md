# 🎅 Secret Santa

Una web app per organizzare Secret Santa tra amici, colleghi o familiari. I partecipanti accedono con codici univoci e l'amministratore gestisce l'evento e le assegnazioni casuali.

## 🎄 Funzionalità

### Per i Partecipanti
- Accesso tramite codice univoco human-readable (es: `NataleUfficio-12345678`)
- Visualizzazione dello stato del Secret Santa (In attesa / Completato)
- Scoperta del destinatario segreto quando l'estrazione è completata

### Per l'Amministratore

- Creazione di nuovi Secret Santa con 2-20 partecipanti
- Gestione partecipanti: aggiungi, rimuovi, rigenera codici di accesso
- Completamento dell'estrazione con assegnazione casuale automatica

## 🛠️ Stack Tecnologico

- **Framework**: Next.js 14 con App Router
- **Linguaggio**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS

## 📦 Setup Iniziale

### 1. Clona il repository

```bash
git clone <repository-url>
cd secret-santa
```

### 2. Installa le dipendenze

```bash
npm install
```

### 3. Configura Supabase

1. Crea un nuovo progetto su [Supabase](https://supabase.com)
2. Esegui lo script SQL in `supabase/migrations/001_initial_schema.sql` nel SQL Editor di Supabase
3. Copia le credenziali del progetto (URL e anon key)

### 4. Configura le variabili d'ambiente

Crea un file `.env.local` nella root del progetto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_SECRET_PATH=my-secret-admin-url-12345
```

**IMPORTANTE**: 
- `ADMIN_SECRET_PATH` deve essere una stringa difficile da indovinare
- La dashboard admin sarà accessibile a `/admin/{ADMIN_SECRET_PATH}`
- **NON condividere mai il `SUPABASE_SERVICE_ROLE_KEY`**

### 5. Avvia il server di sviluppo

```bash
npm run dev
```

L'app sarà disponibile su [http://localhost:3000](http://localhost:3000)

## 🚀 Deployment

### Vercel (Consigliato)

1. **Push su GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git push -u origin main
   ```

2. **Deploy su Vercel**
   - Vai su [vercel.com](https://vercel.com)
   - Clicca "New Project"
   - Importa il repository GitHub
   - Aggiungi le environment variables:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `ADMIN_SECRET_PATH`
   - Clicca "Deploy"

3. **Verifica il deploy**
   - Admin: `https://your-app.vercel.app/admin/{ADMIN_SECRET_PATH}`
   - Participant: `https://your-app.vercel.app`

📖 **Guida dettagliata**: Vedi [VERCEL_DEPLOY.md](VERCEL_DEPLOY.md)

### Azure Static Web Apps

Via GitHub Actions:

1. Crea una Azure Static Web App dalla Azure Portal
2. Collega il repository GitHub
3. Configura le variabili d'ambiente nella sezione "Configuration"
4. Il deploy sarà automatico ad ogni push su `main`

**Build Configuration:**
- Build command: `npm run build`
- Output directory: `.next`
- App location: `/`

## 📖 Utilizzo

### Accesso Amministratore

1. Vai a `/admin/{ADMIN_SECRET_PATH}` (sostituisci con il tuo secret path)
2. Crea un nuovo Secret Santa con nome e lista partecipanti
3. Condividi i codici generati con i partecipanti
4. Quando tutti sono pronti, clicca "Completa Estrazione"

### Accesso Partecipante

1. Vai alla homepage [http://localhost:3000](http://localhost:3000)
2. Inserisci il codice ricevuto dall'amministratore
3. Se lo stato è "In attesa", torna più tardi
4. Se lo stato è "Completato", vedrai il nome del tuo destinatario segreto

## 🗂️ Struttura del Progetto

```
secret-santa/
├── app/
│   ├── admin/
│   │   └── [secret]/
│   │       ├── page.tsx          # Dashboard admin
│   │       └── [id]/
│   │           └── page.tsx      # Dettaglio Secret Santa
│   ├── participant/
│   │   └── page.tsx              # Vista partecipante
│   ├── api/
│   │   ├── secret-santa/         # CRUD Secret Santa
│   │   └── verify-code/          # Verifica codice partecipante
│   ├── layout.tsx
│   ├── page.tsx                  # Homepage con form codice
│   └── globals.css
├── lib/
│   ├── supabase.ts               # Client Supabase
│   ├── auth.ts                   # Middleware autenticazione admin
│   └── utils.ts                  # Utility functions
├── types/
│   └── database.ts               # TypeScript types
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
└── .github/
    └── copilot-instructions.md   # Istruzioni per AI agents
```

## 🔒 Sicurezza

- **Admin**: Protetto da URL segreto difficile da indovinare
- **Partecipanti**: Codici univoci human-readable da 8 cifre
- **Database**: Row Level Security (RLS) abilitato
- **API**: Operazioni admin richiedono autenticazione tramite header o path

## 🐛 Troubleshooting

### Errore "Unauthorized" nella dashboard admin

- Verifica che l'`ADMIN_SECRET_PATH` in `.env.local` sia corretto
- Assicurati di accedere all'URL esatto: `/admin/{ADMIN_SECRET_PATH}`

### Errore "Codice non valido" per i partecipanti

- Il codice potrebbe essere stato rigenerato dall'admin
- Chiedi all'admin un nuovo codice

### Errore "Esiste già un Secret Santa con questo nome"

- I nomi dei Secret Santa devono essere univoci globalmente
- Scegli un nome diverso o elimina il Secret Santa esistente con lo stesso nome

### Database connection errors

- Verifica che le credenziali Supabase siano corrette in `.env.local`
- Controlla che lo schema SQL sia stato eseguito correttamente
- Verifica che le tabelle `secret_santas` e `participants` esistano
- Assicurati che il constraint UNIQUE su `secret_santas.name` sia presente

## 📝 License

MIT

## 🎁 Buon Secret Santa!
