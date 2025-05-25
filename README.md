# Deploy su Firebase con Gemini API Key

Questa guida descrive i passaggi per effettuare il deployment di questa applicazione Next.js su Firebase, includendo la configurazione di una chiave API Gemini tramite Google Cloud Secret Manager.

## Prerequisiti

- Un account Google Cloud con fatturazione abilitata.
- Node.js e npm (o yarn) installati localmente.

## 1. Creazione e Configurazione del Progetto Firebase

1.  **Crea un progetto Firebase:**
    *   Vai alla [console Firebase](https://console.firebase.google.com/).
    *   Fai clic su "Aggiungi progetto" e segui le istruzioni per creare un nuovo progetto.
    *   Una volta creato, collega il tuo progetto Firebase a un progetto Google Cloud esistente o creane uno nuovo.

2.  **Installa la Firebase CLI:**
    *   Se non l'hai già fatto, installa la Firebase CLI globalmente:
        ```bash
        npm install -g firebase-tools
        ```
    *   Accedi a Firebase con il tuo account Google:
        ```bash
        firebase login
        ```

3.  **Inizializza Firebase nel tuo progetto:**
    *   Naviga nella directory principale del tuo progetto Next.js.
    *   Esegui il comando di inizializzazione:
        ```bash
        firebase init
        ```
    *   Seleziona le seguenti funzionalità quando richiesto:
        *   "Hosting: Configure files for Firebase Hosting and (optionally) set up GitHub Action deploys"
        *   "Functions: Configure and deploy Cloud Functions" (se prevedi di usare Firebase Functions per il backend Genkit).
    *   Configura l'hosting:
        *   Specifica "dist" (o la tua directory di output di Next.js, solitamente `.next` ma Firebase Hosting si aspetta una cartella come `out` o `public` per asset statici, o una configurazione per SSR con Cloud Functions/Cloud Run). Per Next.js con output statico, esegui `next build && next export` e usa la cartella `out`. Per SSR, dovrai configurare Firebase per usare Cloud Functions o Cloud Run. Questa guida si concentrerà su un setup generico; consulta la [documentazione Firebase per Next.js](https://firebase.google.com/docs/hosting/frameworks/nextjs) per dettagli specifici.
        *   Configura come single-page app (SPA): Sì (se appropriato per la tua configurazione Next.js).
        *   Imposta build automatica e deploy con GitHub: No (per ora).
    *   Configura le Functions (se selezionato):
        *   Scegli TypeScript come linguaggio.
        *   Abilita ESLint: Sì (raccomandato).
        *   Installa le dipendenze: Sì.
        *   La directory delle functions di default è `functions`.

## 2. Generazione della Chiave API Gemini

1.  **Abilita l'API Vertex AI (o l'API AI Platform):**
    *   Vai alla [console di Google Cloud](https://console.cloud.google.com/).
    *   Assicurati che il progetto Google Cloud corretto sia selezionato.
    *   Nel menu di navigazione, vai su "API e servizi" > "Libreria".
    *   Cerca "Vertex AI API" e abilitala. Se stai usando un modello Gemini più vecchio tramite AI Platform, potresti dover abilitare "AI Platform Training and Prediction API".

2.  **Crea una chiave API (se necessaria per il tuo caso d'uso specifico con Gemini):**
    *   **Nota Importante:** Per le chiamate server-side (come da Firebase Functions), l'approccio raccomandato è usare gli SDK di Google Cloud con Credenziali Predefinite dell'Applicazione (ADC) associate all'account di servizio della funzione, che non richiedono una chiave API esplicita. Genkit con `@genkit-ai/googleai` dovrebbe usare ADC automaticamente quando deployato su Google Cloud.
    *   Se per qualche motivo hai bisogno di una chiave API esplicita (ad esempio, per accesso client-side limitato o altri scenari specifici, anche se meno sicuro per Gemini), puoi crearla da "API e servizi" > "Credenziali". Fai clic su "Crea credenziali" > "Chiave API". **Assicurati di limitare questa chiave API** per impedire l'uso non autorizzato.
    *   **Per Genkit e Firebase Functions, la `GEMINI_API_KEY` si riferisce generalmente alla chiave che Genkit usa per autenticarsi con i servizi Google AI. Quando deployato su Firebase/Google Cloud, questo è gestito tramite ADC e l'account di servizio. Se stai sviluppando localmente e non usi `gcloud auth application-default login`, potresti aver bisogno di generare una chiave API dal Google AI Studio (precedentemente MakerSuite) o configurare l'autenticazione locale in altro modo.**

3.  **Configurazione consigliata per Genkit (GEMINI_API_KEY):**
    *   Vai a [Google AI Studio](https://aistudio.google.com/app/apikey) (precedentemente MakerSuite).
    *   Crea una nuova chiave API. Questa è la chiave che userai come `GEMINI_API_KEY`.

## 3. Configurazione di Google Cloud Secret Manager

1.  **Abilita l'API Secret Manager:**
    *   Nella console di Google Cloud, vai su "API e servizi" > "Libreria".
    *   Cerca "Secret Manager API" e abilitala per il tuo progetto.

2.  **Crea un nuovo secret:**
    *   Vai a "Sicurezza" > "Secret Manager" nella console di Google Cloud.
    *   Fai clic su "Crea secret".
    *   Dai un nome al secret (ad esempio, `gemini-api-key`).
    *   Nel campo "Valore del secret", incolla la tua `GEMINI_API_KEY` generata al passaggio precedente.
    *   Lascia le altre impostazioni predefinite e fai clic su "Crea secret".

3.  **Concedi l'accesso al secret all'account di servizio delle Cloud Functions:**
    *   Dopo aver creato il secret, vai alla pagina dei dettagli del secret.
    *   Fai clic sulla scheda "Autorizzazioni".
    *   Fai clic su "Aggiungi entità".
    *   Nel campo "Nuove entità", inserisci l'indirizzo email dell'account di servizio che le tue Firebase Functions utilizzeranno. Di default, è `[PROJECT_ID]@appspot.gserviceaccount.com`. Per le functions di seconda generazione, potrebbe essere diverso. Controlla le impostazioni del tuo progetto.
    *   Nel campo "Ruolo", seleziona "Accessor secret di Secret Manager".
    *   Fai clic su "Salva".

## 4. Configurazione delle Variabili d'Ambiente in Firebase

Firebase Functions può accedere ai secret da Secret Manager. Invece di memorizzare la chiave API direttamente nelle variabili d'ambiente della funzione, la configurerai per fare riferimento al secret.

1.  **Modifica il file `.firebaserc` (opzionale ma utile):**
    *   Assicurati che il tuo file `.firebaserc` nella directory principale del progetto punti al progetto Firebase corretto:
        ```json
        {
          "projects": {
            "default": "TUO_ID_PROGETTO_FIREBASE"
          }
        }
        ```

2.  **Configura le variabili d'ambiente per le Functions (al momento del deploy o tramite la console):**
    *   Quando deployi le tue functions (o se le stai configurando separatamente), devi specificare che la variabile d'ambiente `GEMINI_API_KEY` deve essere popolata dal secret.
    *   Puoi farlo nel codice di deploy delle tue functions (ad esempio, in `index.ts` o `main.ts` della directory `functions` se stai usando `firebase-functions/v2`) o tramite la console Google Cloud per le tue Cloud Functions.
    *   Per `firebase-functions/v2`, puoi specificare i secret nel codice:
        ```typescript
        // Esempio in functions/src/index.ts
        import {setGlobalOptions} from "firebase-functions/v2";
        
        setGlobalOptions({secrets: ["GEMINI_API_KEY"]}); 
        // "GEMINI_API_KEY" qui è il nome della variabile d'ambiente che verrà esposta alla tua funzione.
        // Firebase cercherà un secret con questo nome (o mappato a questo nome) nel Secret Manager.
        
        // Il tuo codice della funzione...
        // process.env.GEMINI_API_KEY sarà disponibile qui.
        ```
    *   Assicurati che il nome del secret che hai creato in Secret Manager (es. `gemini-api-key`) sia mappato correttamente al nome della variabile d'ambiente (`GEMINI_API_KEY`) che la tua applicazione (Genkit) si aspetta. Potrebbe essere necessario specificare la versione del secret (es. `projects/PROJECT_ID/secrets/gemini-api-key/versions/latest`).
    *   Consulta la [documentazione di Firebase sulla configurazione delle functions](https://firebase.google.com/docs/functions/config-env) e sull'[uso dei secret](https://firebase.google.com/docs/functions/config-env#secret-manager).

    *Alternativamente, per le functions più vecchie o per configurazione manuale:*
    *   Puoi impostare le variabili d'ambiente durante il deploy usando la Firebase CLI:
        ```bash
        firebase functions:config:set gemini.key="TUO_VALORE_DI_GEMINI_API_KEY" 
        # Sconsigliato per le chiavi API! Usa Secret Manager.
        ```
    *   Per usare Secret Manager con versioni più vecchie delle functions o per un controllo più granulare, puoi impostare una variabile d'ambiente che faccia riferimento al secret:
        ```bash
        firebase functions:config:set GOOGLE_CLOUD_SECRET_GEMINI_API_KEY="projects/TUO_ID_PROGETTO_CLOUD/secrets/gemini-api-key/versions/latest"
        # E poi nel codice della tua funzione dovrai leggere questo secret usando la libreria client di Secret Manager.
        # Tuttavia, con le versioni più recenti di Firebase Functions e Genkit, la gestione dovrebbe essere più integrata.
        ```
    *   **L'integrazione `setGlobalOptions({secrets: ["GEMINI_API_KEY"]})` è il metodo preferito per le functions v2, poiché Firebase gestisce l'accesso al secret e lo espone come variabile d'ambiente.**

## 5. Modifiche al Codice (se necessario)

Il plugin `@genkit-ai/googleai` per Genkit dovrebbe rilevare automaticamente la `GEMINI_API_KEY` se è impostata come variabile d'ambiente nell'ambiente di esecuzione delle Firebase Functions.

*   **Verifica `src/ai/genkit.ts`:**
    ```typescript
    import {genkit} from 'genkit';
    import {googleAI} from '@genkit-ai/googleai';

    export const ai = genkit({
      plugins: [googleAI()], // Non è necessario passare esplicitamente la chiave API qui se è nell'ambiente
      model: 'googleai/gemini-pro', // o il modello che stai usando
    });
    ```
*   Se la chiave non viene rilevata automaticamente o se hai bisogno di logica personalizzata (improbabile per questo scenario con Firebase Functions e Secret Manager ben configurati), potresti dover usare la libreria client di Google Cloud per recuperare il secret:
    ```typescript
    // Esempio di recupero manuale (generalmente non necessario con l'integrazione di Firebase)
    // import {SecretManagerServiceClient} from '@google-cloud/secret-manager';
    // const client = new SecretManagerServiceClient();
    // async function accessSecretVersion() {
    //   const [version] = await client.accessSecretVersion({
    //     name: 'projects/TUO_ID_PROGETTO_CLOUD/secrets/TUO_NOME_SECRET/versions/latest',
    //   });
    //   const apiKey = version.payload.data.toString();
    //   // Usa l'apiKey...
    // }
    ```
    **Tuttavia, privilegia sempre l'integrazione nativa di Firebase Functions con Secret Manager.**

## 6. Sviluppo Locale

Per lo sviluppo locale, Genkit avrà comunque bisogno della `GEMINI_API_KEY`.

1.  **Crea un file `.env`:**
    *   Nella directory principale del tuo progetto, crea un file denominato `.env`.
    *   Aggiungi la tua chiave API al file `.env`:
        ```
        GEMINI_API_KEY=LA_TUA_CHIAVE_API_GEMINI_QUI
        ```
2.  **Aggiungi `.env` a `.gitignore`:**
    *   Assicurati che il file `.env` non venga committato nel tuo repository Git. Aggiungi la seguente riga al tuo file `.gitignore`:
        ```
        .env
        ```
3.  **Carica le variabili d'ambiente (se necessario):**
    *   Librerie come `dotenv` possono caricare automaticamente le variabili da `.env` quando l'applicazione si avvia. Next.js ha un supporto integrato per i file `.env`.
    *   Assicurati che Genkit o il tuo codice di backend sia configurato per leggerle (spesso automatico).

## 7. Deploy su Firebase

1.  **Build del progetto Next.js (se necessario):**
    *   A seconda della tua configurazione (statica o SSR), potresti aver bisogno di un comando di build:
        ```bash
        npm run build 
        # o yarn build
        ```
        (Verifica il tuo `package.json` per lo script di build corretto. Per Next.js, `next build` è standard.)

2.  **Deploy:**
    *   Esegui il comando di deploy di Firebase:
        ```bash
        firebase deploy
        ```
    *   Questo comando deployerà il tuo sito su Firebase Hosting e le tue functions (se configurate) su Cloud Functions for Firebase.

## 8. Verifica

*   Dopo il deploy, visita l'URL del tuo hosting Firebase per assicurarti che l'applicazione funzioni come previsto.
*   Controlla i log delle Cloud Functions nella console Firebase o Google Cloud per eventuali errori relativi alla configurazione della chiave API o all'inizializzazione di Genkit.

---

Ricorda di seguire le best practice per la sicurezza, specialmente per quanto riguarda la gestione delle chiavi API e l'accesso ai secret. Limita sempre i permessi al minimo necessario.
