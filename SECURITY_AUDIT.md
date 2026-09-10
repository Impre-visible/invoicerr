# Audit de sécurité — invoicerr (branche `feat/compliance-engine-v2`)

Date : 2026-09-10
Type : audit défensif (red-team autorisé par le propriétaire), sur le code de sa propre application.
Méthode : lecture statique complète des zones à risque + sondage non destructif de l'instance locale
(backend `:4000`, frontend `:6284`, comptes de test) pour confirmer certains comportements. Aucune
correction appliquée, aucun commit. Aucune action destructive, aucun flood, aucune exfiltration réelle.

Contexte : GHSA-vhjw-gwc5-pjfp (OTP de signature brute-forçable) vient d'être corrigée (verrou à vie
`otpFailedAttempts` + `ThrottlerModule`). Cet audit vérifie le reste de la surface.

**Légende** : `CONFIRMÉ` = comportement prouvé par lecture de code de bout en bout et/ou requête
ciblée sur l'instance locale. `THÉORIQUE` = chemin suspect identifié mais non entièrement tracé /
dépend d'une condition non vérifiée ici (ex. configuration de déploiement).

---

## Sommaire des findings

| # | Titre | Sévérité | Statut |
|---|-------|----------|--------|
| 1 | Le rate-limit de connexion de better-auth est contournable par usurpation de `X-Forwarded-For` | Haute | CONFIRMÉ (code) |
| 2 | SSRF authentifié via l'URL de webhook sortant (aucune validation) | Haute | CONFIRMÉ (code) |
| 3 | Secrets d'exemple non rejetés (`docker-compose.yml`) : `JWT_SECRET`/`BETTER_AUTH_SECRET` publics si non changés | Haute | CONFIRMÉ (code) |
| 4 | `@xmldom/xmldom` obsolète (multiples DoS) atteignable depuis l'endpoint public SdI | Moyenne | CONFIRMÉ |
| 5 | Corps de requête illimité sur l'endpoint public SdI (`readRawBody`) | Moyenne | CONFIRMÉ (code), atténué par nginx en topologie standard |
| 6 | Aucun en-tête de sécurité (CSP/X-Frame-Options/HSTS/nosniff) | Moyenne | CONFIRMÉ |
| 7 | Template d'email légataire envoyé en HTML brut non assaini à des tiers (clients) | Moyenne | CONFIRMÉ (code) |
| 8 | Fuite du message d'erreur interne sur l'endpoint anonyme `/webhooks/:uuid` | Basse | CONFIRMÉ (sonde live) |
| 9 | Cookie de session sans flag `Secure` si `APP_URL` est en `http://` derrière un reverse-proxy TLS | Basse | THÉORIQUE (dépend du déploiement) |
| 10 | Rendu de champ `date` : l'échappement HTML est sauté quand la valeur est parseable comme `Date` | Basse | CONFIRMÉ (code), exploitabilité THÉORIQUE |
| 11 | Aucun rate-limit dédié sur les opérations coûteuses (rendu PDF Puppeteer, lookup registre) | Basse | CONFIRMÉ |
| 12 | Dépendances obsolètes (npm audit) | Voir §dépendances | Mixte |

Aucune faille **Critique** confirmée (pas de RCE anonyme, pas de contournement trivial et
inconditionnel de l'authentification). Aucun IDOR inter-tenant trouvé — voir « Ce qui est bien fait ».

---

## Findings détaillés

### 1. [Haute] Rate-limit de connexion contournable par `X-Forwarded-For` usurpé — CONFIRMÉ (code)

**Fichiers** :
- `nginx.conf:11-16` (`proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;`)
- `entrypoint.sh` + `Dockerfile:16` (nginx et `main.js` tournent dans **le même conteneur**, nginx
  proxifie vers `http://localhost:3000`)
- `backend/src/main.ts` (aucun `app.set('trust proxy', ...)` nulle part dans le code)
- `backend/node_modules/better-auth/dist/utils/get-request-ip.mjs:6-13`
- `backend/node_modules/better-auth/dist/api/rate-limiter/index.mjs:370-383` (règles spéciales
  `/sign-in`, `/sign-up`, `/change-password`, `/change-email` → 3 req/10s ; reset de mot de passe →
  3 req/60s)
- `backend/node_modules/@nestjs/throttler/dist/throttler.guard.js:141-142` (`getTracker` par défaut
  = `req.ip`)

**Description** : better-auth calcule l'IP du client en lisant `X-Forwarded-For` **sans notion de
« hop de confiance »** :
```js
const ip = value.split(",")[0].trim();  // prend la PREMIÈRE valeur de la liste
```
Or `nginx.conf` fait `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;`, qui **ajoute**
l'adresse réelle à la fin d'un éventuel en-tête déjà présent dans la requête entrante, plutôt que de
le remplacer. Un client qui envoie lui-même `X-Forwarded-For: 1.2.3.4` fait donc lire à better-auth
`1.2.3.4` (sa propre valeur), jamais l'IP réelle vue par nginx.

En parallèle, le `ThrottlerGuard` global (Nest, `app.module.ts:111-114`) utilise `req.ip`
(Express), qui — en l'absence de `trust proxy` — ignore totalement `X-Forwarded-For` et vaut
l'adresse du socket amont. Comme nginx et `main.js` tournent dans le **même conteneur** et se
parlent en loopback, `req.ip` vaut `127.0.0.1` pour **toutes** les requêtes, quel que soit le client
réel : le compartimentage « par IP » du Throttler Nest devient de fait un seau **global unique**
(120 req/min pour toute l'instance, tous clients confondus).

**Scénario d'exploitation** : un attaquant qui envoie un en-tête `X-Forwarded-For` différent à
chaque tentative de connexion (`POST /api/auth/sign-in/email`) fait échouer le compartimentage
« 3 tentatives / 10s / IP » de better-auth — chaque tentative semble venir d'une IP différente. Il
lui reste seulement le seau global Nest (120 req/min, partagé avec tout le trafic légitime de
l'instance) comme frein — soit potentiellement des dizaines de milliers de tentatives de mot de
passe par jour sur un compte connu, sans qu'aucun verrou à vie n'existe côté mot de passe (contrairement
à l'OTP de signature, corrigé). C'est la même **classe** de vulnérabilité que le GHSA déjà corrigé
(brute-force non limité), sur un chemin différent (login, pas signature).

**Recommandation** : `app.set('trust proxy', 1)` (ou l'équivalent Nest) pour que `req.ip` lise le
DERNIER hop de confiance de `X-Forwarded-For` (celui que nginx ajoute lui-même), jamais le premier ;
et/ou configurer `advanced.ipAddress.ipAddressHeaders` de better-auth pour qu'il fasse de même
(lire la dernière valeur, pas la première) — ou plus simplement faire porter `X-Real-IP` (déjà
positionné par `nginx.conf:12`, non falsifiable par le client puisque nginx l'écrase toujours) au
lieu de `X-Forwarded-For`. Ajouter un verrou par compte (comme l'OTP) en complément d'un simple
rate-limit IP, qui reste par nature contournable par rotation de proxies.

---

### 2. [Haute] SSRF authentifié via l'URL de webhook sortant — CONFIRMÉ (code)

**Fichiers** :
- `backend/src/modules/webhooks/webhooks.service.ts:149-165` (`create`/`update`, aucune validation
  de `body.url`)
- `backend/src/modules/webhooks/drivers/generic.driver.ts:12-23`, `zapier.driver.ts:11-19`,
  `chat-webhook.driver.ts:96-105` (Slack/Mattermost/RocketChat) — chacun fait un `fetch(url, ...)`
  brut
- `backend/src/modules/webhooks/webhooks.controller.ts:109-115` (`@Roles(OWNER, ADMIN)`)

**Description** : `POST /api/company/webhooks` (rôle OWNER/ADMIN de l'entreprise active) accepte un
`url` arbitraire, sans aucun filtre de schéma, de plage d'IP privée/loopback, ni de résolution DNS.
Chaque événement métier (facture créée, signée, etc.) déclenche ensuite un `fetch()` serveur vers
cette URL. La réponse n'est jamais renvoyée au caller (seul `res.ok` est utilisé) — c'est donc un
SSRF **aveugle**, mais un SSRF aveugle reste exploitable pour : atteindre des services internes non
exposés publiquement (bases de données d'admin, API internes), scanner le réseau interne du
déploiement (SaaS hébergé mutualisant plusieurs entreprises), ou — le cas le plus classique et le
plus grave — interroger le service de métadonnées cloud (`http://169.254.169.254/...`) si l'instance
tourne sur AWS/GCP/Azure sans IMDSv2/protection équivalente, ce qui peut exposer des identifiants
d'infrastructure.

**Scénario d'exploitation** : un OWNER (ou un compte OWNER compromis, ou — en SaaS mutualisé — un
client malveillant du produit) crée un webhook avec `url: "http://169.254.169.254/latest/meta-data/iam/security-credentials/<role>"`
ou `url: "http://<service-interne>:<port>/admin"`, puis déclenche l'événement associé (ex. créer un
client → `CLIENT_CREATED`). Le serveur invoicerr effectue la requête depuis SON réseau.

**Recommandation** : valider `url` à la création/mise à jour — schéma `https`/`http` uniquement,
résoudre le DNS et rejeter les plages privées/loopback/link-local (RFC1918, `169.254.0.0/16`,
`::1`, etc.), refaire cette résolution à CHAQUE envoi (pas seulement à la création, pour empêcher un
DNS rebinding). Envisager un timeout court et l'interdiction des redirections suivies automatiquement
par `fetch`.

---

### 3. [Haute] Secrets d'exemple acceptés tels quels dans `docker-compose.yml` — CONFIRMÉ (code)

**Fichiers** :
- `docker-compose.yml:42-43` : `JWT_SECRET="your_jwt_secret"`, `BETTER_AUTH_SECRET="your_better_auth_secret"`
- `backend/node_modules/better-auth/dist/context/create-context.mjs:37-43` (`validateSecret`)

**Description** : le fichier `docker-compose.yml` fourni comme quickstart contient des valeurs
**non vides**, à l'apparence « déjà configurée », pour les deux secrets qui signent les sessions /
JWT. Ces chaînes sont **publiques** (committées dans le dépôt open-source). La seule garde-fou côté
better-auth (`validateSecret`) ne compare le secret qu'à SA PROPRE constante interne
(`DEFAULT_SECRET`), pas à ces chaînes-là — un déploiement qui copie-colle le fichier sans modifier
ces deux lignes démarre donc **sans erreur ni avertissement**, avec un secret de signature de session
connu de quiconque lit le dépôt GitHub. `backend/.env.example:26` fait mieux (`BETTER_AUTH_SECRET=""`
— une valeur vide fait échouer le boot avec une erreur explicite), ce qui souligne que le
`docker-compose.yml` est le point faible.

**Scénario d'exploitation (THÉORIQUE, conditionné à l'opérateur)** : un attaquant qui identifie une
instance invoicerr en ligne et suppose (souvent vérifiable, ex. via des artefacts de version/erreurs)
qu'elle tourne avec le `docker-compose.yml` non modifié peut forger un cookie de session ou un JWT
valide pour n'importe quel `userId`, sans aucun mot de passe — contournement total de
l'authentification.

**Recommandation** : dans `main.ts`/`auth.ts`, rejeter explicitement au boot un jeu de valeurs
« placeholder » connues (`your_jwt_secret`, `your_better_auth_secret`, etc.), ou mieux : ne PAS
fournir de valeur par défaut dans `docker-compose.yml` du tout (laisser vide comme `.env.example`,
ce qui fait échouer le démarrage) plutôt qu'une chaîne qui a l'air remplie.

---

### 4. [Moyenne] `@xmldom/xmldom` obsolète, atteignable sans authentification — CONFIRMÉ

**Fichiers** :
- `backend/src/modules/documents/transports/sdi/xml-helpers.ts:9,31-38` (`new DOMParser(...)`)
- `backend/src/modules/documents/transports/sdi/sdi-notifiche.controller.ts:62-65` (`@Public()`,
  route `POST /api/public/sdi/notifiche`)
- `backend/package.json:51` → `"@xmldom/xmldom": "^0.9.10"`

**Description** : `npm audit` liste 13 avis pour `@xmldom/xmldom` (ReDoS sur la grammaire des
Processing Instructions, complexité quadratique de désérialisation/déduplication d'attributs,
consommation mémoire quadratique, contournement de `requireWellFormed` par divers vecteurs). Ce
parseur est utilisé pour lire le XML **brut et non authentifié** que SdI (ou n'importe qui,
puisqu'il n'y a ni authentification ni mTLS sur cette route — fait déjà documenté dans le
commentaire du fichier lui-même) poste sur `/api/public/sdi/notifiche`. C'est donc une dépendance
vulnérable directement exposée à Internet sans authentification. `@xmldom/xmldom` n'implémente pas
la résolution d'entités externes/DTD (pas de XXE classique), mais les avis de déni de service
restent pertinents ici.

**Recommandation** : `npm audit fix` / mise à jour vers la version corrigée (le audit indique
`fixAvailable: true`, changement non majeur a priori — à revérifier).

---

### 5. [Moyenne] Lecture de corps de requête sans limite de taille sur l'endpoint public SdI — CONFIRMÉ (code)

**Fichier** : `backend/src/modules/documents/transports/sdi/sdi-notifiche.controller.ts:35-44`
(`readRawBody`)

**Description** : cette route (`@Public()`) contourne le `bodyParser.json({ limit: '1mb' })` global
(`main.ts:33-42`, qui ne s'applique qu'au `Content-Type: application/json`) et lit le flux HTTP
octet par octet dans un tableau de `Buffer` **sans aucune limite de taille explicite côté
application**. Dans la topologie livrée (nginx + node dans le même conteneur), la limite par défaut
de nginx (`client_max_body_size` non surchargée dans `nginx.conf` ⇒ 1 Mo par défaut) borne le risque
en pratique. Mais rien dans le code Node lui-même n'empêche un déploiement différent (ingress
Kubernetes sans limite, proxy tiers, ou exposition directe du port 3000) de laisser un attaquant
anonyme envoyer un corps de plusieurs Go et épuiser la mémoire du process.

**Recommandation** : imposer une limite explicite dans `readRawBody` (compter les octets reçus,
détruire la connexion au-delà d'un seuil raisonnable, ex. quelques Mo).

---

### 6. [Moyenne] Aucun en-tête de sécurité HTTP — CONFIRMÉ

**Fichiers** : `backend/src/main.ts` (pas de `helmet()`), `nginx.conf` (aucun `add_header`)

**Description** : ni Nest ni nginx n'ajoutent `X-Content-Type-Options: nosniff`,
`X-Frame-Options`/`frame-ancestors`, `Content-Security-Policy`, `Referrer-Policy`, ou
`Strict-Transport-Security`. Le SPA (frontend) est donc embarquable dans une `<iframe>` tierce
(clickjacking) et ne bénéficie d'aucune CSP pour limiter l'impact d'un futur XSS. Pas de découverte
concrète de faille exploitée par cette absence dans le code audité, mais c'est une défense en
profondeur manquante attendue sur une application qui gère des documents financiers et un lien de
partage public de PDF.

**Recommandation** : ajouter `helmet()` (ou les en-têtes équivalents dans `nginx.conf`), a minima
`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` (ou `frame-ancestors 'none'` en CSP),
`Referrer-Policy: strict-origin-when-cross-origin`, `Strict-Transport-Security` si servi en HTTPS.

---

### 7. [Moyenne] Template d'email « legacy » envoyé en HTML brut, non assaini, à des tiers — CONFIRMÉ (code, via sous-agent + vérification)

**Fichiers** :
- `backend/src/modules/documents/signatures/signatures.service.ts:314-323` (`interpolate` = simple
  `.replace()` sur `{{KEY}}`, puis `html: interpolate(mailTemplate.body)`)
- `backend/src/modules/company/company.controller.ts:49-73` (`PUT /api/company/email-templates`,
  `@Roles(OWNER, ADMIN)`)
- Front : `frontend/src/pages/(app)/settings/_components/templates.settings.tsx` (éditeur HTML du
  template, avec `DOMPurify.sanitize` seulement côté **prévisualisation**, jamais appliqué à ce qui
  est réellement stocké/envoyé)

**Description** : un OWNER/ADMIN peut éditer le corps HTML du template d'email de demande de
signature / code OTP. Ce corps est envoyé **tel quel** (`html:` du mailer, jamais passé par un
sanitizer côté serveur) au CLIENT de l'entreprise — une personne hors du périmètre de confiance de
ce compte. Ce n'est pas un SSTI (pas de moteur de template, juste une substitution de variables
serveur), et les variables interpolées (`SIGNATURE_URL`, `OTP_CODE`, etc.) sont générées côté
serveur, donc pas de second ordre d'injection par ce biais — mais un admin (ou un compte admin
compromis, cf. finding #1) peut injecter n'importe quel HTML dans un email qui porte le lien de
signature et le code OTP officiels du produit : pixels de tracking, mise en page trompeuse, lien de
phishing qui imite la vraie page de signature pour intercepter l'OTP au moment où le client le
saisit.

**Recommandation** : passer `mailTemplate.body` dans un sanitizer HTML côté serveur (allowlist de
balises/attributs, comme le front le fait déjà pour l'aperçu) avant l'envoi réel, pas seulement pour
la prévisualisation.

---

### 8. [Basse] Fuite du message d'erreur interne sur l'endpoint anonyme `/webhooks/:uuid` — CONFIRMÉ (sonde live)

**Fichier** : `backend/src/modules/webhooks/webhooks.controller.ts:86-94`

Sonde effectuée (lecture seule, aucune donnée modifiée) :
```
POST /api/webhooks/deadbeef-dead-beef-dead-beefdeadbeef
→ HTTP 500
{"success":false,"message":"Webhook processing failed",
 "error":"Active plugin with UUID deadbeef-dead-beef-dead-beefdeadbeef not found or has no webhook configured"}
```
Le `catch` renvoie `error.message` brut à l'appelant anonyme. Dans ce cas précis le message est
anodin, mais le même mécanisme s'applique à TOUTE exception levée par `provider.handleWebhook`
(erreurs Prisma, erreurs internes d'un plugin tiers) — un chemin qui peut, selon le plugin installé,
révéler des détails d'implémentation à un appelant non authentifié.

**Recommandation** : logguer `error` complet côté serveur, ne renvoyer qu'un message générique au
client (`"Webhook processing failed"`, sans `error.message`).

---

### 9. [Basse / THÉORIQUE] Cookie de session sans `Secure` si `APP_URL` est en `http://` derrière un TLS-terminating proxy

**Fichier** : `backend/node_modules/better-auth/dist/cookies/index.mjs:18` (`secure: !!secureCookiePrefix`,
dérivé de `baseURLString.startsWith('https://')` sinon de `isProduction`), `backend/src/lib/auth.ts:147`
(`baseURL: process.env.APP_URL || 'http://localhost:3000'`)

**Description** : le flag `Secure` du cookie de session dépend entièrement du schéma de `APP_URL`.
Un pattern d'auto-hébergement très courant (Traefik/Caddy/nginx externe qui termine le TLS et
transmet en HTTP en interne, avec `APP_URL=http://...`) produirait un cookie de session SANS
`Secure`, même si l'utilisateur final n'accède au site qu'en HTTPS. `httpOnly` reste `true` dans
tous les cas (bonne nouvelle : pas de vol de cookie par XSS), et `SameSite=Lax` est toujours actif.
Non vérifié en conditions réelles (dépend du choix de déploiement de chaque opérateur) — classé
THÉORIQUE.

**Recommandation** : documenter clairement que `APP_URL` doit être en `https://` dès que l'instance
est exposée via TLS (même terminé en amont), ou exposer `advanced.useSecureCookies: true` comme
option explicite dans la configuration.

---

### 10. [Basse] Rendu du champ `date` : l'échappement est sauté si la valeur est parseable en `Date` — CONFIRMÉ (code), exploitabilité THÉORIQUE

**Fichier** : `backend/src/modules/documents/rendering/render-html.ts:74-81`
```ts
case 'date': {
  const dateStr = String(value);
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) {
    return escapeHtmlSafe(dateStr);
  }
  return dateStr; // YYYY-MM-DD format — PAS échappé
}
```
Toutes les autres branches de `renderFieldValue` passent systématiquement par `escapeHtmlSafe` (bien
vérifié par ailleurs — voir « Ce qui est bien fait »). Cette branche est la seule exception : si
`new Date(dateStr)` réussit à parser la chaîne (le parseur JS `Date` est tolérant sur des formats
non-ISO), la valeur brute est concaténée sans échappement dans le HTML envoyé à Puppeteer. Je n'ai
pas trouvé de validation stricte en amont qui garantirait qu'un champ de type `date` ne contient
QUE `YYYY-MM-DD` avant stockage — donc l'exploitabilité réelle dépend de la capacité à faire
accepter une chaîne contenant à la fois des métacaractères HTML et un motif que `Date.parse`
accepte quand même (pas démontré ici, incertain avec le moteur V8).

**Recommandation** : retirer l'exception — appeler `escapeHtmlSafe(dateStr)` inconditionnellement,
que le parse réussisse ou non (aucune perte fonctionnelle, `dateStr` au format `YYYY-MM-DD` ne
contient de toute façon aucun caractère à échapper).

---

### 11. [Basse] Aucun rate-limit dédié sur les opérations coûteuses — CONFIRMÉ

**Fichiers** : `backend/src/modules/documents/rendering/render-pdf.ts` (lance une page Puppeteer par
rendu), `backend/src/modules/company-lookup/company-lookup.controller.ts` (`lookup`, authentifié,
interroge des registres externes)

**Description** : en dehors des deux routes de signature publique (`@Throttle` dédié) et du seau
global de 120 req/min, aucune route « chère » (rendu PDF via un navigateur headless partagé,
interrogation de registres nationaux externes avec quota) n'a de limite propre. Un compte
authentifié normal peut déclencher jusqu'à 120 rendus PDF/minute, ce qui sature potentiellement le
process Puppeteer partagé (un seul `browserInstance` pour toute l'instance — un pic sur une
entreprise dégrade le service pour toutes les autres, self-host mutualisé ou SaaS).

**Recommandation** : ajouter un `@Throttle` plus serré sur `GET .../pdf` et sur `company-lookup`
(déjà partiellement mitigé par le cache mémoire 6h de `CompanyLookupService`).

---

## Dépendances (`npm audit`)

### Backend (`backend/`)
`13 moderate, 18 high, 0 critical` (31 total). Triés par atteignabilité réelle :

| Paquet | Sévérité | Contexte | Atteignable ? |
|---|---|---|---|
| `better-auth` | Haute | **prod**, bibliothèque d'auth elle-même | Le CVE listé (« account takeover via magic-link/email-OTP ») ne s'applique pas ici : `auth.ts` n'active ni `magicLink` ni `emailOTP` (seulement `emailAndPassword` + OIDC générique). À mettre à jour quand même — surface d'attaque future si ces plugins sont un jour activés. |
| `@xmldom/xmldom` | Haute | **prod**, atteint par l'endpoint public SdI | **Atteignable sans auth** — voir finding #4. Priorité haute. |
| `nodemailer` | Haute | **prod**, envoi d'emails réel (invitations, OTP, notifications) | Atteignable (tout flux d'envoi d'email) ; avis porte sur du contournement de validation de domaine destinataire, pas de RCE. À mettre à jour. |
| `prisma` / `@prisma/config` | Haute | **prod**, ORM | Montée de version majeure (`fixAvailable` signale `prisma@6.19.3`, majeur) — à planifier avec `npx prisma generate` + tests de migration, pas un simple `audit fix`. |
| `puppeteer` / `puppeteer-core` / `@puppeteer/browsers` / `extract-zip` | Haute | `puppeteer` est **prod** (rendu PDF) ; les 3 autres sont transitifs | Les avis (`extract-zip` symlink path traversal) concernent surtout le **téléchargement du binaire Chromium à la construction de l'image**, pas les requêtes HTTP en production. Risque supply-chain au build, pas RCE runtime direct. À mettre à jour lors d'un prochain cycle. |
| `multer` | Haute | Transitif via `@nestjs/platform-express` | **Non atteignable** : aucun `FileInterceptor`/multipart n'est câblé nulle part dans `src` (uploads en base64 JSON uniquement, plafonnés à 1 Mo). Priorité basse malgré la sévérité affichée. |
| `mysql2` | Haute | Transitif via `prisma` (support multi-SGBD du CLI) | **Non atteignable** à l'exécution : l'app ne parle qu'à Postgres. Priorité basse. |
| `fast-uri`, `ip-address`, `js-yaml`, `brace-expansion`, `deepmerge-ts`, `browserslist` | Haute/Modérée | Tous transitifs (build tooling, CLI Prisma, etc.) | Non directement atteignables par une requête HTTP. À nettoyer via mise à jour des paquets parents. |

### Frontend (`frontend/`)
`1 low, 2 moderate, 5 high, 0 critical` (8 total) :
- `better-auth` (client) — même bibliothèque, la faille vit côté serveur (voir ci-dessus).
- `react-router` — « CSRF Bypass in RSC Mode » : l'app est une SPA Vite classique, **pas** en mode
  React Router RSC → non atteignable.
- `postcss` — divulgation de fichiers `.map` via `sourceMappingURL` : risque **build-time uniquement**
  (source maps ne sont pas servies en prod sauf configuration explicite à vérifier).
- `browserslist`, `nanoid` — outillage de build, non atteignables au runtime.

**Conclusion dépendances** : sur les ~89 alertes Dependabot évoquées, la fraction réellement
atteignable par un attaquant distant sans compte est petite (`@xmldom/xmldom` en tête). La plupart
sont soit des dépendances de build/CLI jamais exécutées en service, soit des bibliothèques
serveur (`better-auth`, `nodemailer`, `prisma`) dont le vecteur précis documenté par l'avisory ne
correspond pas à la configuration actuelle de l'app — mais elles méritent d'être mises à jour par
hygiène, `prisma` et `puppeteer` nécessitant une montée de version majeure planifiée.

---

## Ce qui est bien fait

- **Isolation multi-tenant systématique.** Chaque contrôleur audité (documents, archives, clients,
  clés API, certificats de signature, canaux de transmission, changement d'entreprise active) scope
  ses requêtes Prisma par `companyId` issu de `@ActiveCompany()` — jamais d'un paramètre d'URL ou du
  corps de requête. `guards/auth.guard.ts` fixe `request.companyId` uniquement depuis la session
  serveur ou depuis le `companyId` de la clé API — non falsifiable côté client. Aucun IDOR inter-
  tenant trouvé, y compris dans le code neuf de cette branche (archive, country-identifiers,
  country-policy). `companies.service.ts#switchActiveCompany` revérifie l'appartenance avant de
  changer d'entreprise active. `api-keys.service.ts#revoke` et `signing-certificates` re-vérifient
  `companyId` avant toute suppression, y compris quand le premier `findUnique` était fait par id nu.
- **Durcissement de la signature (le GHSA corrigé)** : confirmé en conditions réelles — token
  résolu par hash, réponses strictement indistinguables (400/404 identiques pour "inconnu",
  "expiré", "déjà utilisé"), verrou à vie sur les tentatives OTP en plus du throttle par IP.
- **Chiffrement des secrets** (`utils/secret-crypto.ts`) : AES-256-GCM, IV aléatoire unique par
  chiffrement (`randomBytes(12)`), tag d'authentification 128 bits, clé exclusivement via
  `CREDENTIALS_ENCRYPTION_KEY` (jamais en dur), fonctionnalité qui se désactive proprement si la clé
  est absente/invalide plutôt que de stocker en clair.
- **Certificats de signature** (`signing-certificates.service.ts`) : PFX et mot de passe chiffrés
  séparément, jamais loggés, jamais renvoyés par l'API (`toMeta()` est la seule forme exposée),
  refus explicite d'un certificat déjà expiré à l'upload, et l'en-tête du fichier documente
  explicitement un IDOR inter-tenant déjà corrigé et testé en régression.
- **Rendu PDF** (`rendering/render-html.ts`) : toutes les valeurs interpolées (nom d'entreprise,
  champs de document, totaux, mentions légales) passent systématiquement par un échappement HTML
  avant d'être données à Puppeteer — une seule exception mineure trouvée (finding #10).
- **Pas de moteur de template pour l'email/PDF** — donc pas de surface SSTI (« compiler » une chaîne
  fournie par l'utilisateur n'existe nulle part) ; interpolation par simple substitution de chaîne
  sur un vocabulaire fixe.
- **Pas de SQL/Prisma brut exploitable** : les seules occurrences de `$queryRaw`/`$queryRawUnsafe`
  sont soit un `SELECT 1` de health-check, soit de la synchronisation de schéma au boot (jamais
  déclenchée par une requête utilisateur), soit un template littéral Prisma taggé (paramétré).
- **Aucune surface d'upload de fichier binaire classique** (pas de `multer`/`FileInterceptor` câblé
  nulle part) — tout passe par du JSON base64 plafonné à 1 Mo, ce qui réduit fortement les risques
  classiques (traversal de chemin, exécution de fichier, DoS par fichier énorme).
- **Cookies** : `httpOnly: true` toujours actif (pas de vol par XSS), `SameSite=Lax` par défaut ;
  aucun jeton d'authentification stocké côté frontend (`localStorage`/`sessionStorage`) — tout passe
  par le cookie de session (`credentials: 'include'`).
- **CORS** : allowlist explicite d'origines (`localhost:5173`, `APP_URL`, `CORS_ORIGINS`), jamais de
  wildcard ni de réflexion de l'origine reçue.
- **Endpoints publics recensés** (`@Public()`/`@AllowAnonymous()`) : chacun a une justification
  documentée dans son propre en-tête de fichier, et pour ceux qui exposent une vraie surface
  d'attaque (signature, lien de téléchargement PDF), les réponses sont indistinguables et les tokens
  ont 256 bits d'entropie (`share-link-token.ts`) — brute-force non réaliste.
- **Code de garde-fou architectural** : `@ActiveCompany()`, `AuthGuard`/`RolesGuard` en `APP_GUARD`
  globaux (impossible d'oublier de les appliquer sur un nouveau contrôleur), disciplin documentée
  dans `CLAUDE.md` et respectée dans tout le code audité.

---

## Confiance / ce qui reste non vérifié

**Confirmé par lecture de code de bout en bout** : findings #2 à #11, la scoping multi-tenant
(section « bien fait »), le comportement des routes publiques (aussi confirmé par sonde live).

**Confirmé par sonde live non destructive** (`curl` en lecture seule, aucune mutation, aucun compte
verrouillé) : réponses indistinguables des endpoints `public/signatures` et `public/documents`,
statut 401 sur les routes protégées, fuite de message d'erreur sur `/webhooks/:uuid`, disponibilité
des endpoints `@Public()` recensés.

**Théorique / dépendant du déploiement, non vérifiable sur ce poste** : finding #1 (le rate-limit de
better-auth est désactivé en mode `NODE_ENV=test`, qui est le mode de l'instance locale disponible
ici — le contournement XFF a été établi par lecture de code des trois composants impliqués
[`nginx.conf`, l'absence de `trust proxy`, et `get-request-ip.mjs`], pas rejoué sur une instance de
production réelle, précisément pour éviter tout brute-force effectif) ; finding #3 (dépend d'un
opérateur qui ne changerait pas les secrets d'exemple) ; finding #9 (dépend du choix de topologie
TLS de chaque opérateur) ; finding #10 (l'existence d'une chaîne exploitable réelle n'a pas été
démontrée, seulement le chemin de code qui la laisserait passer).

**Hors du périmètre de ce passage** (à auditer séparément si souhaité) : le détail des ~15
providers de transmission nationaux (PDP, KSeF, SdI, ANAF, Peppol…) au-delà de la surface publique
déjà couverte ; le contenu exact de chaque Schematron vendored ; les scripts CI/CD eux-mêmes
(secrets GitHub Actions).
