# TODO_MANDANT — ce qui est à TA main (2026-09-06)

Tout ce qui suit est **hors de portée du code** : démarches administratives, créations de comptes,
identités humaines, contrats commerciaux, ou décisions produit. Le code correspondant est prêt et
attend derrière chaque item (référence donnée à chaque fois). Rien ici ne bloque le merge : la CI
PR est verte sans aucun secret (voir `CREDENTIALS_GUIDE.md` § "Read this first").

Deux chemins distincts pour chaque credential (ne pas confondre) :
- **① App déployée** : chaque société saisit SES credentials dans l'UI (Settings → Channels /
  Signing certificates), chiffrés en base. Seule variable serveur : `CREDENTIALS_ENCRYPTION_KEY`.
- **② Tests live CI** : secrets GitHub pour `compliance-live.yml` (opt-in, ne gate jamais la PR).

---

## A. Marchés primaires (FR / PL / IT) — par ordre d'utilité

### A1. 🇫🇷 PDP production — contrat commercial
Le sandbox (superpdp) est **prouvé live** (fr:200→201→202, dépôt réel). Pour la prod :
- [ ] Choisir une PDP immatriculée (annuaire officiel : impots.gouv.fr) et signer le contrat.
- [ ] Récupérer `client_id`/`client_secret` du portail développeur de la PDP retenue.
- [ ] Les poser en ① (Settings → Channels de chaque société) et/ou ② (`PDP_*`).
→ `CREDENTIALS_GUIDE.md` §2, `LIVE_TESTING.md` (leg PDP).

### A2. 🇮🇹 SdI — accréditation Agenzia delle Entrate (le plus long, à lancer tôt)
Code : **implemented-awaiting-accreditation** (`sdicoop-client.ts`), jamais couru contre le vrai
endpoint. Démarche :
- [ ] Partita IVA inscrite sur Entratel, puis accréditation du canal (collaudo) sur fatturapa.gov.it.
- [ ] L'URL `SdIRiceviFile` accréditée + le PFX sont **délivrés pendant** l'accréditation.
- [ ] Poser `SDI_ID_TRASMITTENTE`, `SDI_ENDPOINT`, `SDI_CERTIFICATE` (b64), `SDI_CERT_PASSWORD`.
→ `CREDENTIALS_GUIDE.md` §4.

### A3. 🇵🇱 KSeF production
Le test est **prouvé live** (CLEARED réel + ksefNumber, 2026-06-28). Pour la prod :
- [ ] Générer le token prod sur ksef.mf.gov.pl (NIP + profil de confiance/signature qualifiée).
- [ ] Récupérer les clés publiques PEM prod du MF.
- [ ] ⚠️ L'auth par token **s'éteint fin 2026** → prévoir la bascule certificat (chantier code à
      commander à ce moment-là).
→ `CREDENTIALS_GUIDE.md` §1.

### A4. 🇫🇷 Chorus Pro B2G (PISTE)
- [ ] Compte PISTE (piste.gouv.fr), souscrire à l'API « Dépôt flux G2B ».
- [ ] Créer le « compte technique » Chorus Pro sandbox — nécessite une structure avec SIRET et le
      rôle « Gestionnaire principal ».
- [ ] Poser `CHORUSPRO_CLIENT_ID/SECRET/TECH_LOGIN/TECH_PASSWORD`.
→ `CREDENTIALS_GUIDE.md` §3.

### A5. 🌍 Peppol production (touche aussi DE/NL/BE/… en B2G)
peppol.sh est prouvé en test, **zéro secret**. Pour la prod :
- [ ] Choisir un Access Point commercial (Storecove, Ecosio, Pagero/Tickstar, Unimaze…) ou
      l'adhésion OpenPeppol en self-hosted ; enregistrement SMP du participant.
- [ ] Poser `PEPPOL_PARTICIPANT_ID`, `PEPPOL_AP_URL`, `PEPPOL_API_KEY`, `PEPPOL_RECEIVER_ID`.
- [ ] Reste connu (non bloquant) : le `documentTypeId` exact attendu par OZG-RE (DE) et par un
      récepteur gouvernemental NL n'a pas été vérifié contre un SMP réel — à confirmer au premier
      envoi réel avec le compte AP (`peppol-client.ts`, en-tête `PEPPOL_DOC_TYPES`).
→ `PEPPOL_AP_RESEARCH.md`, `CREDENTIALS_GUIDE.md` §6.

---

## B. Décisions produit à trancher (rien ne bouge sans toi)

- [ ] **it-it, Check #1 d'assertCompliance** : asserter que le statut n'est pas
      `TRANSMISSION_FAILED` red-ifierait it-it tant qu'il n'y a pas de creds SdI (SdI est le SEUL
      canal IT, pas de repli email). Options : creds sandbox SdI dans le setup e2e, ou
      special-case par profil. → mémoire de l'audit false-green (2026-07-14), TODO_ISSUES.md.
- [ ] **Clé Mistral (OCR cloud)** : uniquement si tu veux l'OCR cloud pour le SaaS — créer la clé
      sur console.mistral.ai, la poser dans l'env du service `ocr` (JAMAIS ailleurs), rejouer
      `MISTRAL_OCR_LIVE=1`. Le self-host a maintenant l'OCR local sans clé (profil `ocr-local`).
- [ ] **Langues Tika pol/nld** : l'image stock n'a pas le polonais/néerlandais (PL = marché
      primaire !). Dockerfile 2 lignes documenté dans `docker-compose.yml` — décider si on
      publie une image dérivée ou si on laisse l'opérateur le faire.
- [ ] **Seconde vague de purge des WebhookEventType** : <15 valeurs vivantes sur 94 restantes.
      Purge = seconde migration + audit de chaque abonnement existant en prod — décision produit.
      → TODO_ISSUES.md (item T2bis).
- [ ] **Doctrine fiscale des voies de correction `unverified`** : commander (ou non) une vague de
      lectures par pays pour promouvoir les routes non sourcées. → TODO_DOCUMENTS.md (manques par lot).
- [ ] **`e2e/demo-videos/run-complet/`** : dossier non versionné qui traîne — garder, déplacer ou
      supprimer (je n'y touche pas sans toi).
- [ ] **Ouvrir la PR vers main** : la branche porte 870+ commits ; décider du moment (et si tu veux
      un `/code-review ultra` avant).

---

## C. Déploiement / infra

- [ ] `CREDENTIALS_ENCRYPTION_KEY` : `openssl rand -hex 32` — obligatoire en prod pour le
      chiffrement des credentials par société.
- [ ] (Optionnel, recommandé) Environnement GitHub `live-tests` avec *required reviewer* pour
      gater chaque run live avant de dépenser un appel d'autorité réelle.
- [ ] Weblate : les nouvelles clés i18n de la vague (écrans correction/annulation, hints B2G,
      réception) attendent leurs traductions hors-anglais — vérifier que Weblate a bien ramassé.

---

## D. Longue traîne — identités humaines requises (aucune urgence, aucun marché primaire)

Chacun exige une identité/entité locale réelle, sans chemin automatisable (détail :
`CREDENTIALS_GUIDE.md`, tableau §"Summary" et sections dédiées) :

- [ ] 🇪🇸 FACe B2G : certificat qualifié **FNMT** (vérification d'identité en personne/visio),
      puis enregistrement du cert comme « aplicación » FACe. Le WS-Security est déjà implémenté
      et live-prouvé — seul le cert FACe-enregistré manque.
- [ ] 🇭🇺 NAV Online Számla (déclaration ⚖) : inscription contribuable hongrois + Primary User
      pour créer l'utilisateur technique.
- [ ] 🇬🇷 AADE myDATA (déclaration ⚖) : identité TaxisNet grecque (aade.gr refuse les accès
      automatisés — citation légale restée unverified).
- [ ] 🇷🇴 ANAF e-Factura : OAuth interactif avec certificat qualifié (seul le refresh token 365 j
      s'automatise ensuite).
- [ ] 🇲🇽 CFDI : compte **PAC** certifié SAT (Finkok, Facturama…) + certificat **CSD** de
      sat.gob.mx.
- [ ] Hors-UE restants (AR/BR/CL/EC/UY/SA/TR/EG/NG/KE/IN/MY/ID) : voir le tableau — tous rouges,
      tous gated proprement, aucun ne casse rien en leur absence.

---

*Généré à la clôture des chantiers NLCIUS + OCR local (commits `edd6b5c2`, `fe3f7e11`). Les items
cochables sont à ta main exclusivement ; quand l'un d'eux est fait, dis-le-moi et je rejoue le
live correspondant (`LIVE_TESTING.md` donne la commande exacte par canal).*
