# Vercel Deployment Guide

## 🚀 Deploy su Vercel

### Opzione 1: Deploy via Dashboard (Consigliato)

1. **Vai su [vercel.com](https://vercel.com)** e fai login con GitHub

2. **Clicca "Add New Project"**

3. **Importa il repository GitHub**
   - Se non hai ancora pushato su GitHub:
     ```bash
     git init
     git add .
     git commit -m "Initial commit"
     git branch -M main
     git remote add origin https://github.com/tuousername/secret-santa.git
     git push -u origin main
     ```

4. **Configura il Progetto**
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: `./`
   - Build Command: lascia vuoto (auto-detect)
   - Output Directory: lascia vuoto (auto-detect)
   - Install Command: lascia vuoto (auto-detect)

5. **Aggiungi Environment Variables** (IMPORTANTE!)
   
   Clicca su "Environment Variables" e aggiungi:
   
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ADMIN_SECRET_PATH=your-secret-admin-path-12345
   ```
   
   **Importante**: 
   - Seleziona **tutti gli ambienti** (Production, Preview, Development)
   - Non commitare mai `.env.local` in git!

6. **Deploy!**
   - Clicca "Deploy"
   - Il deploy richiederà 1-2 minuti

7. **Testa l'applicazione**
   - Admin: `https://your-app.vercel.app/admin/{ADMIN_SECRET_PATH}`
   - Participant: `https://your-app.vercel.app`

---

### Opzione 2: Deploy via CLI

1. **Installa Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Aggiungi environment variables**
   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
   vercel env add SUPABASE_SERVICE_ROLE_KEY
   vercel env add ADMIN_SECRET_PATH
   ```

5. **Deploy in production**
   ```bash
   vercel --prod
   ```

---

## 📋 Checklist Pre-Deploy

- [ ] Supabase database configurato e tabelle create
- [ ] `.env.local` file creato localmente (NON commitare!)
- [ ] `.gitignore` include `.env*.local`
- [ ] Testato localmente con `npm run dev`
- [ ] Environment variables aggiunte su Vercel
- [ ] Repository GitHub/GitLab/Bitbucket configurato (se deploy via dashboard)

---

## 🔄 Deploy Automatici

Vercel esegue deploy automatici ad ogni push:
- **Push su `main`** → Deploy in Production
- **Pull Request** → Deploy Preview (URL temporaneo per testing)

---

## ⚙️ Configurazioni Avanzate (Opzionale)

### Custom Domain

1. Vai su Project Settings → Domains
2. Aggiungi il tuo dominio custom
3. Configura i DNS secondo le istruzioni

### Redirects & Rewrites

Crea un file `vercel.json` per configurazioni avanzate:

```json
{
  "redirects": [
    {
      "source": "/admin",
      "destination": "/",
      "permanent": false
    }
  ]
}
```

### Edge Functions & Middleware

Già configurato con Next.js App Router! Le API routes sono automaticamente edge functions.

---

## 🐛 Troubleshooting

### Errore: "Missing environment variables"
- Verifica che le env vars siano state aggiunte in Vercel Dashboard
- Ri-deploya dopo aver aggiunto le variabili

### Errore: "Module not found" durante build
```bash
# Pulisci cache e reinstalla
rm -rf .next node_modules
npm install
vercel --prod
```

### Database connection errors
- Verifica le credenziali Supabase
- Controlla che lo schema SQL sia stato eseguito
- Verifica che Supabase non abbia restrizioni IP (dovrebbe permettere tutte le connessioni)

### Admin dashboard non accessibile
- Verifica che `ADMIN_SECRET_PATH` sia configurato in Vercel
- L'URL deve essere: `https://your-app.vercel.app/admin/{ADMIN_SECRET_PATH}`

---

## 📊 Monitoraggio

Vercel Dashboard offre:
- **Analytics**: Visite, performance, geo-distribuzione
- **Logs**: Console logs e errori runtime
- **Speed Insights**: Core Web Vitals
- **Deployment History**: Rollback a versioni precedenti

---

## 🎯 Prossimi Step Dopo il Deploy

1. **Testa l'app in produzione**
   - Crea un Secret Santa di test
   - Verifica che i codici funzionino
   - Testa l'estrazione

2. **Monitora gli errori**
   - Controlla i logs in Vercel Dashboard
   - Setup notifiche per errori critici

3. **Ottimizzazioni** (opzionale)
   - Aggiungi custom domain
   - Setup Google Analytics
   - Implementa caching strategies

---

## 🔒 Sicurezza in Produzione

✅ Environment variables non esposte nel client
✅ Service role key protetta (solo server-side)
✅ Admin URL segreto configurabile
✅ HTTPS automatico su Vercel
✅ Row Level Security su Supabase

---

## 💰 Costi

**Vercel Free Tier include:**
- 100 GB bandwidth/mese
- Automatic HTTPS
- Deploy illimitati
- Preview deployments
- Edge Functions

Più che sufficiente per un'app Secret Santa! 🎁
