# TODO_FEATURES — fonctionnalités manquantes vs. concurrents (2026-09-10)

> Tâche d'ANALYSE uniquement (aucun code touché). Méthode : §1 est reconstruit à 100 % depuis le
> code (modules `backend/src/modules/`, écrans `frontend/src/pages/`, specs `e2e/cypress/e2e/`) —
> jamais deviné. §2/§3 recoupent cet inventaire avec une recherche web sur les logiciels de
> facturation concurrents (SaaS et self-hosted, y compris closed-source) pour ne garder que les
> manques réellement récurrents chez eux. Chaque ligne de manque porte une case "e2e" : ce qu'un
> test devrait prouver le jour où l'item est implémenté — **rien n'est implémenté ici**.
>
> Ce fichier est complémentaire à `TODO_MANDANT.md` (credentials/démarches de conformité e-invoicing)
> et à `COMPLIANCE_TODO.md`/`TODO_ISSUES.md` (le moteur de conformité pays). Il ne les recoupe pas :
> il couvre les fonctionnalités "métier" génériques (paiement, relances, portail, stock, temps…) que
> la quasi-totalité des concurrents proposent et qu'invoicerr n'a pas encore, indépendamment de la
> conformité e-invoicing par pays (déjà très avancée, voir §1.7).

---

## 1. Inventaire de l'existant (100 % code)

### 1.1 Documents (devis, factures, avoirs, dépenses, factures reçues)
Un seul mécanisme générique — `backend/src/modules/documents/descriptors/` (`type-registry.ts` +
un descripteur par type : `quote.descriptor.ts`, `invoice.descriptor.ts`,
`credit-note.descriptor.ts`, `expense.descriptor.ts`, `received-invoice.descriptor.ts`) — pilote
tout : champs, statuts, actions, numérotation, email, contributions dashboard/statistics. Aucun type
n'a son propre contrôleur/service Prisma ; `documents.service.ts` + `persistence.ts` sont génériques.
Preuves e2e : `17-document-descriptor`, `19-document-pdf`, `20-document-totals`,
`21-document-lifecycle`, `22-document-numbering`, `23-document-email`, `28-document-async-send`.

- **Devis → facture** : conversion intégrale (`actions/convert-to-invoice.ts`) ou **acompte en %**
  (`actions/request-deposit.ts`, recalcule le TTC du devis, refuse si plusieurs taux de TVA sans
  ligne unique) — e2e `26-document-deposit`.
- **Avoirs (credit notes)** : type dédié, seul type autorisé à réduire une facture
  (`settlement/credits.ts`) — e2e via `24-document-payments`/`25-document-settlement`.
- **Dépenses** : type "expense" minimal — description/montant/devise/date/notes, **aucune pièce
  jointe, aucune catégorie** (voir §3 — gap).
- **Factures reçues (AP)** : module dédié `received-invoices/` avec extraction (`extraction.ts`),
  OCR (`received-invoices/ocr/`, moteurs Mistral **et** local Tika — `ocr-service/`), et
  rapprochement fournisseur automatique/manuel (`supplier-reconciliation.ts`, marque
  `Client.isSupplier`) — e2e `36-received-invoices`.
- **Lignes** : remise en % par ligne déjà supportée, appliquée avant TVA
  (`totals/compute-totals.ts`).
- **Paiements & lettrage** : `DocumentPayment` générique à tout type de document
  (`settlement/payments.ts`), conversion multi-devise **au moment du paiement** avec taux figé
  (`settlement/convert-payment.ts`) — e2e `24-document-payments`, `27-multi-currency-consolidation`.
- **Récurrence** : moteur générique `schedules/` (cadence weekly/monthly/quarterly/yearly,
  `cadence.ts`), rejoue une action sur un document gabarit, option `{thenSend:boolean}` pour
  enchaîner l'envoi — écran `settings/recurring.settings.tsx` — e2e `29-document-recurrence`.
- **Partage/consultation publique** : lien à jeton hashé, PDF seul (`share-links/`,
  `public/public-documents.controller.ts`), **pas de portail authentifié** (voir §3) — e2e
  `37-document-share-link`.
- **Signature électronique** : OTP par email, jeton dédié (`signatures/otp.ts`,
  `signature-token.ts`), webhook `DOCUMENT_SIGNED` — e2e `45-signature`.
- **Archivage légal / WORM** : `archive/` (`persistence.ts`, `storage.ts`,
  `archive-verdict-on-terminal.ts`, `verdict-artifact.ts`), rétention (`archive/retention/`) — e2e
  `34-document-archive`.

### 1.2 Conformité e-invoicing (le cœur de la branche)
Voir `CLAUDE.md` et `documentation/compliance/COMPLIANCE_ARCHITECTURE.md`. En bref, déjà en place et
prouvé par des specs dédiées (hors périmètre de ce document, non reproduit ici en détail) :
- Formats nationaux + sémantiques (`formats/national`, `formats/semantic`, `formats/vendored/{en16931,peppol,pl,es,nl,de,it}`) — e2e `30-document-xml-format`.
- Canaux/transports (`transports/{pdp,ksef,sdi,chorus-pro,face,peppol,anaf}`) — e2e
  `31-national-channels`, `32-channel-mandate`.
- B2G (`b2g-routing/`, 15 pays livrables selon `B2G_COVERAGE.md`) — e2e `40-b2g-routing`.
- Politique pays (types de documents disponibles, mentions obligatoires, identifiants requis,
  routes de correction/annulation) : `country-policy/`, `mentions/`, `country-identifiers/`,
  `correction-routes/` — e2e `39-document-conformity`, `43-correction-routes`, `44-country-policy`.
- Fiscalité transfrontalière par composition de profils, jamais une matrice N×N (`tax/tax-engine.ts`)
  — e2e `35-cross-border-tax`.
- **Mentions légales calculées** : ex. FR — indemnité forfaitaire de recouvrement (40 €) et taux de
  pénalités de retard (taux BCE + 10 pts, figé à l'émission) générés automatiquement
  (`mentions/data/fr.json`) — une sophistication que peu de concurrents grand public égalent.
- **Déclarations temps réel** : fournisseurs `reporting/providers/{mydata,nav}-*` (Grèce, Hongrie),
  déclenchées à l'envoi (`report-on-send.ts`) — **aucun écran dédié** pour voir l'historique de ces
  déclarations (voir §3, item mineur).

### 1.3 Clients, articles, fournisseurs
- `modules/clients/` : CRUD complet, `ClientType` (particulier/société), `ClientKind`
  (BUSINESS/GOVERNMENT — routage B2G), flag `isSupplier` indépendant (réconciliation AP) — écran
  `pages/(app)/clients/`, e2e `05-clients`.
- `modules/articles/` : catalogue produit/service, pré-remplissage de ligne depuis le catalogue —
  e2e `14-articles`. **Aucun champ de quantité en stock.**
- `modules/company-lookup/` + `modules/sirene/` : enrichissement automatique à la création d'un
  client depuis un registre officiel (SIRENE FR + ~250 capacités par pays, REGISTER/PARTIAL) — e2e
  `16-company-lookup`.

### 1.4 Multi-société, auth, API
- `modules/companies/` + `modules/company/` (+ `signing-certificates/`, `channels/`,
  `currency-rates/`) : multi-société par utilisateur (`UserCompany`, `CompanyRole`
  OWNER/ADMIN/MEMBER), `@ActiveCompany()` scope toutes les requêtes — e2e `15-multi-company`,
  `02-company`.
- Auth better-auth + fallback clé API (`modules/api-keys/`, scopes) — e2e `13-api-keys`,
  `01-register`, `03-auth`.
- `modules/invitations/` : invitation de membres par code — écran
  `settings/_components/invitations.settings.tsx`.
- `modules/danger/` : reset app/société avec confirmation OTP.
- Taux de change (`company/currency-rates/`) : **saisie manuelle uniquement**
  (`CurrencyRate.source` par défaut `"manual"`, aucun fournisseur de taux live câblé) — voir §3.

### 1.5 Intégrations & extensibilité
- **Webhooks** : `modules/webhooks/` — 7 types de destination (`WebhookType`: GENERIC, DISCORD,
  MATTERMOST, SLACK, TEAMS, ZAPIER, ROCKETCHAT), événements génériques `DOCUMENT_*`/`CLIENT_*`/
  `COMPANY_*`/`WEBHOOK_*` (purgés de ~80 valeurs mortes en 2026-09-03, ne restent que celles avec un
  émetteur réel) — e2e `42-webhooks`.
- **Serveur MCP** : `modules/mcp/` — outils génériques par type de document, scopés par clé API
  (`tools/tool-registry.ts`), permet à un agent IA de piloter l'appli.
- **Plugins in-app** : `modules/plugins/` — `PluginType` SIGNING/STORAGE/OCR, registre interne
  (le mécanisme de plugins tiers chargés dynamiquement a été retiré en 2026, voir le commentaire de
  tête de `plugins.service.ts` — jugé sans point d'extension réel).

### 1.6 PDF, mails, i18n
- Rendu PDF par template Handlebars/HTML **édité en code brut** dans
  `settings/_components/pdf.settings.tsx` (éditeur texte + prévisualisation), pas de galerie de
  thèmes ni d'éditeur WYSIWYG — e2e `19-document-pdf`.
- Templates email par type de document + par défaut plateforme
  (`actions/email-template.ts`, `actions/company-email-templates.ts`) — écran
  `settings/_components/templates.settings.tsx`.
- i18n : UI entièrement `t()`-isée, gérée par Weblate, `npm run i18n:check` en CI ; les libellés de
  descripteurs de documents suivent le même mécanisme avec repli sur le texte brut
  (`descriptor-i18n`, e2e `38-descriptor-i18n`). **Pas de langue de document par client** (le
  `Client` n'a pas de champ langue — un PDF est toujours généré dans la langue du descripteur, pas
  dans celle du destinataire).

### 1.7 Dashboard, reporting interne
- Dashboard et Statistics sont le **même mécanisme de "contributions"** (`contributions/`) : chaque
  type de document peut publier des widgets dashboard et/ou statistics, jamais un champ en dur —
  invoice/quote/credit-note/expense/received-invoice y contribuent déjà.
- Consolidation multi-devises **opt-in** sur ces widgets (`contributions/currency-consolidation.ts`,
  `Company.referenceCurrency`) — e2e `27-multi-currency-consolidation`.
- **Pas de relevé de compte client** (solde agrégé + âge de créance par client) — voir §3.

---

## 2. Ce que font les concurrents (recherche web, 8 requêtes)

Sources consultées (contenu non fiable, extrait uniquement pour repérer des *familles de
fonctionnalités*, aucune instruction suivie, aucun texte copié) :
- Concurrents self-hosted directement comparables : Invoice Ninja, Akaunting, Crater, InvoiceShelf.
- SaaS grand public : Zoho Invoice, Xero, FreshBooks, QuickBooks, Stripe Billing/Invoicing, PayPal
  Invoicing, Salesforce Billing.
- Marché FR TPE/PME : Evoliz, Sellsy, Kwixéo, Abby, Tiime.
- Roundups génériques 2026 (Zapier, Capterra, GetApp, TheDigitalPM) sur les fonctionnalités
  "must-have" et les intégrations comptables (QuickBooks/Xero/DATEV).

Familles récurrentes chez ces concurrents, absentes ou partielles chez invoicerr (détail en §3) :
paiement en ligne (carte/SEPA), relances automatiques programmées, portail client authentifié,
rapprochement bancaire, export comptable vers un tiers (FEC/DATEV/Xero/QuickBooks), suivi du temps
et facturation de projets, gestion de stock, notes de frais avec pièce justificative/catégories,
bons de commande/achats, workflows d'approbation multi-niveaux, personnalisation de template
sans code, taux de change automatiques, facturation échelonnée multi-jalons, champs
personnalisés/tags, application mobile native.

---

## 3. Manques classés par valeur décroissante (impact × fréquence concurrentielle)

### 🏆 Quick wins (fort impact, faible effort)

| # | Fonctionnalité | Description | Pourquoi ça compte | État actuel | Effort | e2e à prouver |
|---|---|---|---|---|---|---|
| QW1 | **QR-code de paiement SEPA (EPC/GiroCode) sur le PDF** | Générer un QR code EPC069-12 (IBAN + montant + référence) imprimé sur la facture, scannable par l'appli bancaire du client pour un virement pré-rempli. | Quasi-standard sur les factures DE/AT/NL/BE (concurrents locaux) ; **ne nécessite aucune intégration payante** — `Company.iban` existe déjà. | Absent. `Company.iban` stocké (utilisé pour BT-84/XRechnung) mais jamais rendu en QR sur le PDF client. | S | Un PDF de facture avec IBAN renseigné contient un QR code décodable en une chaîne EPC069-12 valide (IBAN, montant, référence = displayNumber) ; absent si `iban` est null. |
| QW2 | **Champ "référence client / n° de commande"** | Un champ dédié sur devis/facture pour la référence interne du client (bon de commande, n° de dossier), imprimé sur le PDF. | Quasi-universel (Zoho, Xero, Evoliz…) ; les acheteurs B2G/B2B l'exigent souvent pour leur propre rapprochement. | Absent comme champ de premier ordre (seul un champ `notes` libre existe). | S | Créer une facture avec `clientReference` rempli → apparaît sur le PDF et dans la liste ; absent si non renseigné. |
| QW3 | **Taux de change automatiques (flux live)** | Récupérer quotidiennement les taux (BCE ou équivalent gratuit) au lieu d'une saisie 100 % manuelle. | Xero/QuickBooks le font nativement ; réduit une charge manuelle récurrente pour toute société multi-devises. | Partiel : `CurrencyRate` existe, le lettrage multi-devise et la conversion au paiement sont réels — mais `source` vaut toujours `"manual"`, rien n'alimente la table automatiquement. | S/M | Un job planifié insère un `CurrencyRate` daté du jour avec `source:"ecb"` (ou équiv.) pour chaque paire active ; un paiement enregistré ce jour-là résout ce taux sans saisie. |
| QW4 | **Relevé de compte client (statement)** | Vue agrégée par client : factures ouvertes, réglées, avoirs, solde, balance âgée — exportable en PDF. | Fonctionnalité "comptable" attendue par tout gestionnaire multi-clients (Xero, Zoho, Sellsy). | Absent comme écran ; la donnée existe déjà (`settlement/compute-settlement.ts`, `credits.ts`, `payments.ts`) — c'est une agrégation, pas un nouveau moteur. | M | Depuis la fiche client, un relevé liste chaque facture avec solde restant dû et une balance âgée (0-30/31-60/60+) cohérente avec les paiements/avoirs enregistrés. |
| QW5 | **Écran "déclarations" (mydata/NAV)** | Historique/visibilité des déclarations fiscales temps réel déjà envoyées automatiquement (Grèce mydata, Hongrie NAV) — statut, date, erreurs. | Sans écran, une déclaration ratée est invisible pour l'utilisateur alors que le mécanisme tourne déjà en tâche de fond. | Le mécanisme existe (`reporting/report-on-send.ts`, `reporting/providers/`) mais **aucun écran** ne l'expose — écart UX plus que fonctionnel. | S/M | Envoyer une facture GR/HU déclenche une déclaration ; l'écran Settings liste la déclaration avec son statut, y compris en cas d'échec. |

### Rang principal (hors quick wins), du plus au moins prioritaire

| # | Fonctionnalité | Description | Pourquoi ça compte | État actuel | Effort | Externe payant ? | e2e à prouver |
|---|---|---|---|---|---|---|---|
| 1 | **Paiement en ligne (carte, SEPA, PayPal)** | Un lien "Payer" sur la facture/portail qui encaisse réellement via Stripe/GoCardless/PayPal, marque la facture payée automatiquement (webhook du fournisseur → `DocumentPayment`). | LA fonctionnalité la plus universelle chez tous les concurrents cités (Invoice Ninja : 45+ passerelles ; Zoho, Xero, FreshBooks l'ont en natif). Sans elle, invoicerr reste un outil d'émission, jamais d'encaissement. | Absent. `PaymentMethodType.PAYPAL` n'est qu'une **étiquette** de paiement manuel enregistré a posteriori — aucune intégration de passerelle. | L | **Oui** — nécessite des credentials Stripe/GoCardless/PayPal côté chaque société (mandant/utilisateur final). | Un lien de paiement public sur une facture ISSUED déclenche un paiement test (sandbox de la passerelle) qui crée un `DocumentPayment` et fait franchir `DOCUMENT_SETTLED` sans saisie manuelle. |
| 2 | **Relances automatiques (dunning)** | Cadence programmable de rappels avant/à/après échéance (ex. J-3, J+7, J+14), ton qui s'durcit, applicable aussi aux devis non signés ("relance devis"). | Deuxième fonctionnalité la plus citée dans toutes les recherches (Evoliz, Sellsy, Kwixéo, Xero, Zoho) — impact direct sur le DSO. | Absent. L'infrastructure de cadence existe déjà pour la récurrence (`schedules/cadence.ts`, `schedule-sweep.ts`) — un nouveau "type" de règle de relance pourrait la réutiliser plutôt que d'en inventer une seconde. | M | Non | Une facture ISSUED dont l'échéance est dépassée de N jours déclenche l'envoi d'un email de relance (template dédié) une seule fois par palier configuré, visible dans les logs d'envoi. |
| 3 | **Portail client authentifié** | Un espace où le client se connecte (ou lien magique) pour voir TOUS ses documents (pas un seul), son solde, l'historique de paiement, accepter/refuser un devis en un clic, payer en ligne. | Zoho, Xero, Invoice Ninja en font un argument de vente central ("customer portal"). | Partiel : le lien de partage (`share-links/`) ne sert qu'**un seul** document en téléchargement PDF ; la signature OTP est un flux ponctuel par document, pas un espace persistant. | L | Non (sauf le paiement en ligne qu'il exposerait, item 1) | Un client avec ≥2 factures accède à un lien/espace listant les deux, leur statut et solde, sans revenir par email à chaque fois. |
| 4 | **Export comptable (CSV générique, puis FEC/DATEV)** | Export des écritures (factures, avoirs, paiements) dans un format que l'expert-comptable ou un logiciel de compta peut importer ; FEC est une attente française fréquente, DATEV en zone DE/AT. | Cité par tous les roundups "accounting integrations" ; les TPE/PME françaises delegate souvent à un cabinet qui demande un FEC ou un CSV structuré. | Absent — aucun module d'export comptable. | M (CSV) / L (FEC/DATEV strict) | Non | Un export sur une période donnée produit un fichier dont chaque ligne correspond à une facture/avoir/paiement réellement enregistré, montants et dates cohérents avec `compute-settlement.ts`. |
| 5 | **Suivi du temps & facturation de projets** | Enregistrer des heures/tâches par client (chrono ou saisie manuelle), les convertir en lignes de facture HOUR/DAY. | Cœur de l'offre freelances/consultants chez Zoho Invoice, Invoice Ninja, FreshBooks — segment que le catalogue d'articles actuel (`ItemType.HOUR/DAY`) anticipe déjà sans l'implémenter. | Absent : `ItemType` a bien `HOUR`/`DAY` mais rien ne logue de temps ni ne le rattache à un "projet". | L | Non | Un temps loggé sur un client puis sélectionné à la création d'une facture produit une ligne HOUR dont la quantité = les heures loguées, marquées "facturées" ensuite. |
| 6 | **Rapprochement bancaire (import relevé)** | Importer un relevé (CSV/OFX, ou connexion open banking) et faire correspondre automatiquement les lignes à des factures/paiements enregistrés. | "Bank reconciliation" ressort comme la fonctionnalité jugée la plus importante par les utilisateurs dans les comparatifs consultés (Xero/Zoho la standardisent). | Absent — les paiements sont uniquement saisis manuellement un par un (`settlement/payments.ts`). | L | Selon l'approche (CSV/OFX = non ; open banking type Plaid/Bridge = oui) | Importer un relevé CSV contenant un virement dont le montant/la référence matchent une facture ouverte crée le `DocumentPayment` correspondant sans saisie manuelle. |
| 7 | **Facturation échelonnée multi-jalons** | Depuis un devis, générer plusieurs factures programmées (ex. 30 %/40 %/30 % à des dates différentes), au-delà du seul acompte unique actuel. | Attendu en BTP/conseil/formation (Kwixéo le cite explicitement : "échéancier de paiement"). | Partiel : `request-deposit.ts` ne gère qu'**un seul** acompte en %, pas un plan à plusieurs échéances. | M | Non | Un devis avec un plan à 3 échéances génère 3 factures draft aux dates prévues, dont la somme des montants égale le TTC du devis. |
| 8 | **Notes de frais enrichies** | Pièce jointe (photo de reçu), catégories de dépense, kilométrage, statut d'approbation — au lieu des 5 champs actuels. | Zoho Invoice et la plupart des ERP-light le proposent nativement, y compris capture mobile du reçu. | Partiel : le type "expense" existe (`descriptors/expense.descriptor.ts`) mais est volontairement minimal — pas d'upload, pas de catégorie, pas d'OCR (alors que le pipeline OCR existe déjà côté `received-invoices/ocr/` et pourrait être réutilisé). | M | Non (réutilise l'OCR existant, pas de nouvelle clé) | Une dépense avec une pièce jointe image stocke le fichier et permet de le retélécharger ; une catégorie choisie apparaît dans les widgets statistics. |
| 9 | **Gestion de stock basique** | Quantité en stock par article, décrément à la facturation, alerte de stock bas. | Présent chez Akaunting/InvoiceShelf et la plupart des ERP-light — pertinent pour les articles de type PRODUCT. | Absent : `Article` n'a aucun champ de quantité. | M | Non | Facturer N unités d'un article suivi en stock décrémente son solde ; un solde sous le seuil déclenche une alerte visible. |
| 10 | **Bons de commande / achats fournisseurs** | Émettre un bon de commande vers un fournisseur, le rapprocher ensuite (3-way match) avec la facture reçue. | Fonctionnalité ERP-light classique (Odoo, Sage) ; complète naturellement `received-invoices/supplier-reconciliation.ts` côté amont. | Absent — seule la réception/rapprochement existe, rien pour émettre la commande en amont. | L | Non | Un bon de commande envoyé à un fournisseur, puis une facture reçue rapprochée dessus, affiche les écarts de quantité/montant s'il y en a. |
| 11 | **Personnalisation de template sans code** | Une galerie de thèmes + éditeur visuel (glisser-déposer / WYSIWYG) pour le PDF, en plus de l'éditeur Handlebars actuel. | Xero/Zoho proposent plusieurs thèmes prêts à l'emploi ; l'éditeur actuel suppose de savoir lire du HTML/Handlebars. | Partiel : `pdf.settings.tsx` permet déjà une personnalisation complète mais réservée à un profil technique. | M/L | Non | Un utilisateur sans notion de code choisit un thème dans une galerie et voit le PDF changer sans toucher au HTML. |
| 12 | **Workflow d'approbation interne** | Un devis/une facture au-dessus d'un seuil doit être validé par un rôle supérieur avant envoi. | Répandu dans les comparatifs "approval workflow" (Qvalia, Refrens, ApprovalMax) pour les organisations à plusieurs niveaux. | Absent : `CompanyRole` (OWNER/ADMIN/MEMBER) gère des permissions globales, pas un circuit de validation par document. | M | Non | Un MEMBER ne peut pas faire franchir "sent" à une facture au-dessus du seuil configuré tant qu'un ADMIN/OWNER n'a pas approuvé. |
| 13 | **Champs personnalisés / tags** | Permettre à l'utilisateur d'ajouter ses propres champs sur client/document sans toucher au code (au-delà des descripteurs fixes). | Cité comme standard ("custom fields") dans la plupart des comparatifs, y compris InvoiceShelf en self-hosted. | Absent — les champs sont exclusivement définis par les descripteurs (`descriptors/types.ts`), aucune UI pour en ajouter. | M | Non | Un champ personnalisé créé en Settings apparaît sur le formulaire de facture et sur le PDF pour toutes les factures suivantes. |
| 14 | **Langue du document par destinataire** | Générer le PDF (et l'email) dans la langue du client plutôt que dans celle du descripteur. | Attendu dès qu'une société facture au-delà de son propre pays (marché cible FR/PL/IT très concerné). | Absent : `Client` n'a pas de champ langue ; le PDF suit toujours la même langue de descripteur. | M | Non | Un client marqué langue "PL" reçoit un PDF avec les libellés fixes (statuts, mentions) en polonais, un client sans langue renseignée garde le comportement actuel. |
| 15 | **Application mobile native** | App iOS/Android pour créer une facture, scanner un reçu, consulter le statut en déplacement. | Zoho, Invoice Ninja, QuickBooks en ont toutes une ; le README d'invoicerr l'annonce comme axe futur ("ready for future integrations (mobile & desktop apps)") sans rien de livré. | Absent. L'API REST existe déjà (`/api`, Swagger) et pourrait la porter. | L (investissement stratégique, hors échelle S/M/L habituelle) | Non (juste du temps de dev) | Hors échelle e2e Cypress web actuelle — nécessiterait une suite mobile dédiée (Detox/Appium), non couverte ici. |
| 16 | **Facturation par abonnement avancée (usage-based, paliers, essai)** | Metered billing, tiered pricing, périodes d'essai façon Stripe Billing. | Très cité dans les roundups 2026, mais correspond à un segment SaaS/usage-based différent du cœur de marché actuel d'invoicerr (TPE/PME/B2B compliance, cf. mémoire "Primary markets FR/PL/IT"). | Absent — la récurrence actuelle (`schedules/`) rejoue un document identique à cadence fixe, pas un calcul d'usage. | L | Généralement oui (passerelle de paiement) | Priorité basse : à ne traiter qu'après les items 1-9 ci-dessus, sauf demande explicite du mandant. |

### Notes de classement
- Items 1-6 sont ceux qui reviennent dans **quasiment toutes** les sources consultées — à traiter en
  priorité une fois les quick wins faits.
- Les items marqués "Externe payant" impliquent que le mandant (ou chaque société utilisatrice, selon
  le modèle retenu) doit fournir des credentials tiers — même schéma que `TODO_MANDANT.md` pour la
  conformité e-invoicing (chemin ① société / chemin ② tests live CI).
- Le rapprochement bancaire (item 6) et le paiement en ligne (item 1) sont les deux items où le choix
  du fournisseur externe (Stripe vs GoCardless vs Mollie ; CSV/OFX vs Plaid/Bridge/Powens) est une
  **décision produit**, pas seulement technique — à trancher par le mandant avant tout devis
  d'effort définitif.
