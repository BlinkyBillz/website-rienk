# Je website

Twee dingen in deze map:

- **`editor.html`** — hiermee pas je de site aan.
- de map **`docs`** — dát is je website. Alleen die map gaat online.

De rest (dit bestand, `CLAUDE.md`, oude versies van `content.js`) is
gereedschap en hoort er niet bij. Zolang je alleen de map `docs` naar
Netlify sleept, komt daar dus niets van op internet.

## Iets aanpassen

Dubbelklik **`editor.html`**. Daar zit alles in: werk toevoegen, teksten,
foto's, links. Aanpassen, **Opslaan** klikken, en de editor maakt een
nieuwe `content.js` — die belandt in je map **Downloads**. Sleep hem uit
Downloads in de map **`docs`**, over de oude `content.js` heen. Klaar.

Wil je meteen zien wat je doet? Klik bovenin op **Voorbeeld**. Naast het
formulier verschijnt je site, en die werkt zichzelf bij zodra je even stopt
met typen; met **Telefoon** / **Laptop** wissel je tussen de twee
schermbreedtes. Het blijft een voorbeeld — opgeslagen is er pas iets als je
op **Opslaan** klikt. Op een smal scherm is er geen ruimte voor twee kolommen
en is de knop er dus niet.

## Bekijken

Dubbelklik **`index.html`** in de map **`docs`**. Je site opent in je
browser, precies zoals hij online komt te staan.

Op één ding na: video's openen hier op YouTube in een nieuw tabblad in
plaats van op de pagina zelf. Dat is een regel van YouTube voor bestanden
die je rechtstreeks opent, niet iets dat stuk is. Online spelen ze gewoon
af waar ze horen.

## Studio-video

De knop **STUDIO** speelt een eigen videobestand direct op de site af. Zet het
bestand in `docs/videos/` en vul in de editor bijvoorbeeld
`videos/studio.mp4` in. De video begint automatisch, zonder geluid; de
bezoeker kan het geluid aanzetten met de speler. Gebruik hiervoor geen
YouTube-link.

## Foto's

Zet ze in de map `docs/images/`. Gebruik **liggend** beeld (de vorm van een
videothumbnail), ongeveer **1600 pixels breed** — zwaardere persfoto's
maken de site alleen traag.

**Alleen kleine letters in de bestandsnaam:** `foto.jpg`, niet `Foto.JPG`.
Op je Mac maakt dat niets uit, online wél — daar blijft de foto dan weg.

## Online zetten

Sleep de map **`docs`** naar **drop.netlify.com** — niet de map waar dit
bestand in staat, maar `docs` zelf. Je krijgt meteen een link. Bijwerken?
Sleep `docs` opnieuw naar binnen.

Alles wat online mag staan zit in die map, en niets anders. Je hoeft dus
nooit iets weg te gooien of uit te zoeken voor je publiceert.

De site is ingesteld op **rienkspeelman.nl**. Koppel dat domein in Netlify
aan deze site, dan klopt alles meteen — ook het plaatje dat verschijnt als
je de link in WhatsApp of LinkedIn plakt.

## Er is iets stuk

De site zegt zelf wat er misgaat, meestal met een regelnummer erbij. Niet
schrikken: **Cmd+Z, opslaan, verversen** en alles staat weer zoals het was.

Zat je met de hand in `content.js`? Dan is het bijna altijd één van deze:

- rechte aanhalingstekens `"`, geen krulletjes `“ ”`
  (TextEdit → Instellingen → slimme aanhalingstekens uit);
- achter elke regel een komma `,`;
- worden `é` of `—` ineens `?`, dan staat de codering verkeerd:
  TextEdit → Instellingen → Openen en bewaren → **Unicode (UTF-8)**;
- er hoort **precies één** `window.SITE_CONTENT = {` in het bestand te
  staan. Plak je een nieuwe versie ónder de oude, dan telt alleen de
  onderste en is de helft van je werk weg.
