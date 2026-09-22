# CLAUDE.md — Rienk Speelman portfolio site

Static portfolio for **Rienk Speelman** (Utrecht): producer, songwriter &
vocalist for commercials, trailers, television and games. He does NOT call
himself a composer — he said so directly; don't reintroduce the word. Also releases drum & bass as
**RIENK** (Monstercat, Liquicity, UKF, NCS) — but this site's job is winning
*commissioned media work*, not promoting the artist brand.

## Who you're probably talking to

Likely **Rienk himself, who is not a developer**. Default to making changes
*for* him, explain in plain language, and keep edits inside `content.js`
whenever the request is about content (adding work, changing text, swapping
images). Only touch the other files for genuine design/behavior changes.
He may write in Dutch; that's fine.

## Hard constraints — do not break these

1. **No build step, no CMS, no frameworks, no npm.** Plain HTML/CSS/vanilla
   JS. The site must work by double-clicking `index.html` (`file://`) and on
   any static host (Netlify Drop, GitHub Pages).
2. **`content.js` is the single source of truth, and the owner reaches it two
   ways.** All visible content (sections, items, music, texts, socials,
   email) lives there. Never move content into HTML/JS. His *primary* route
   is now **`editor.html`** — plain Dutch form fields that read `content.js`
   through a `<script>` tag and write a fresh one on Save; he never types a
   brace. Hand-editing the file must keep working exactly as it does today:
   the editor is a friendlier front door, not a replacement, so if it ever
   broke the site is unaffected. Anything you add to the content model has to
   be reachable in BOTH — a field only the editor knows is a field he loses
   the day he edits by hand, and vice versa. The editor preserves keys it
   doesn't recognise, so a future field survives a save it doesn't know about.
3. **The renderer is forgiving — keep it that way.** Wrong types are coerced
   (`asArray`/`asText`), a single item without `[ ]` still works, bare URL
   strings become items, protocol-less links get `https://` prepended, and
   the whole render is wrapped in try/catch that shows a friendly on-brand
   error screen. **It is deliberately bilingual:** an English heading and one
   sentence for whoever is looking at a broken live site, then a rule and the
   fix instructions in Dutch, because only Rienk can act on those.
   **That screen HIDES `main` and inserts itself before it** —
   it must never go back to `document.body.innerHTML = …`, which took the
   header, the footer and index.html's own `<noscript>` fallback with it and
   left a page that didn't say whose site it was. It can also name the
   broken line: a small capture-phase `<script>` in index.html's `<head>`,
   before the `content.js` tag, stashes `e.lineno`/`e.message` on
   `window.CONTENT_LOAD_ERROR` (it skips resource errors, which carry no
   `message`). Nothing from content.js is duplicated into site.js to build
   it — index.html carries the static fallback.
   Nothing the owner types may *silently* disappear: bad video
   links get a helpful dashed error card, broken image paths fall back to a
   generated text banner.
4. **Docs must match reality — and everything owner-facing is DUTCH.**
   `README.md` (377 words, Dutch only — the old 5,687-word bilingual version
   was replaced because he doesn't read walls of text), the ~14-line Dutch
   header in `content.js`, the editor's own labels and Hulp panel, and the
   Dutch half of the site's error screen. Change behaviour and you update
   all of them in the same commit-sized change. Code comments and this file
   stay English for maintainers.
5. **No third-party requests on page load** except YouTube thumbnail images
   (`i.ytimg.com`, which index.html now `preconnect`s to — a handshake, not
   a request). Spotify embeds no longer count: they start with `data-src`
   and are handed their address by the reveal observer, so they only fetch
   once the visitor scrolls to them (Chromium ignores `loading="lazy"` on
   iframes, so this had to be done by hand). Fonts are self-hosted in `fonts/` (OFL
   Bebas Neue + Space Mono) — do not reintroduce Google Fonts (render-blocking
   SPOF + GDPR exposure for an EU site). YouTube players load only on click,
   via `youtube-nocookie.com`.

## File map

- `site/content.js` — owner-editable content. Structure: `name`, `fullName`,
  `tagline`, `sections[]` (work), `music{}` (own releases), `about`,
  `photo` (About portrait, `images/rienk.jpg`), `email`, `socials[]`.
  **About section:** the heading is a STATEMENT, not a label — "I'M
  RIENK" in display type (`[data-content="firstname"]` = first word of
  `name`, so it stays short whatever the full name is), the bio beneath
  it, and the squircle portrait flush with the RIGHT edge of the page
  column (`.about-body` `minmax(0,1fr) auto`, `justify-self: end` on the
  photo, vertically centered, stacking centered ≤720px; `.about-photo` is
  the clipping frame (`border-radius: 22%`) — the hover blur MUST be
  clipped by a frame or the edge goes fuzzy; the photo hides
  itself if the file is missing, and the intro then takes the full row).
  The current portrait (`images/rienk.jpg`, 900×900) has deliberate prism
  fringing, so it is NOT grayscaled — `filter: contrast(1.03)` only.
  A full circle (`50%`) was tried and rejected: it cut the top of his head.
  History: a giant "ABOUT" label made the strongest typographic slot a
  filler word, which is what made every portrait placement feel unmoored
  (hero, centered-above, tinted band, small label, centered narrow column
  — all rejected). Don't go back to a plain "ABOUT" giant heading.
  **Hero:** stops at 80svh on >720px screens (was 86) and
  `#work > .work-section:first-child` trims its top padding, so the first
  section label *and* the top of the first card row crest the fold as a
  scroll cue; keep the 100svh fallback for mobile. The hero name is
  measured and fitted to the column (see below). Tagline and categories are
  one sentence, so `.hero-sub` stacks them left-aligned in a column
  (tagline `max-width: 52ch` so it sets on one line ≥721px, 24ch on
  mobile — `ch` ignores letter-spacing, and the 0.08em tracking costs about
  4ch, so the one-line budget is wider than the 46ch it started at). The tagline wears the reference's label treatment — accent mono,
  weight 400, `0.08em` tracking — so tagline + pills read as one yellow
  system instead of a second bold-white voice under the name; the
  `.hero-sub` gap is a deliberate `clamp(1.4rem, 3.2vh, 2.4rem)` of air
  (crowding the pills against the sentence read as one messy block).
  The categories are a wrapping row of dotted accent PILLS with a
  rising-fill hover (see "Buttons speak the template's dialect"), wrapping
  into a pill cloud on phones. Throwing the two to opposite edges of the
  hero was rejected — the reader had to jump the gap to finish the
  sentence; so was a plain-text `·`-divided row (superseded by the pills).
- `site/index.html` — skeleton with `data-slot` / `data-content` hooks. The
  `<title>` and meta description are **deliberately static** here (JS must
  not overwrite them — taglines are sentence fragments that make bad titles).
  The head also carries the full share-preview block (`og:type`,
  `og:site_name`, `og:url`, `og:image` + `:width`/`:height`/`:alt`,
  `twitter:card=summary_large_image`, `twitter:image`), a `preconnect` to `https://i.ytimg.com`
  (a handshake, not a request — it saves ~3 RTT before the first thumbnail)
  and the small capture-phase error-stash script described in constraint 3.
  **`<noscript>` sits at the TOP of `<body>`**, not after `</footer>`: with
  no JS there is no content at all below it, so a note parked at the bottom
  of an empty page was both invisible and untrue. It keeps the two contact
  routes index.html already carried (Spotify artist, Instagram);
  `.noscript-note` pads by `calc(var(--header-h) + 2rem)` to clear the fixed
  header. `<title>`/`og:title` and the meta/`og:description` are duplicate
  strings — four places, two texts; change one and change its twin.
  The contact heading is `GET IN <br>TOUCH` — the space before the `<br>`
  is deliberate: without it `textContent` reads "GET INTOUCH", which is
  what crawlers, copy-paste and accessible-name computation see.
- `site/css/style.css` — all styling; design tokens in `:root`.
- `site/js/site.js` — renders content.js into the DOM. One IIFE, ES5-ish style,
  no dependencies.
- `site/fonts/` — self-hosted woff2 (unicode-range subsets).
- `site/images/` — banner pictures. **Lowercase filenames only** (macOS is
  case-insensitive, static hosts are not — wrong case works locally and
  404s online). Landscape ~16:9 preferred; cards crop with `object-fit: cover`.
- `site/og.jpg` — 1200×630 social-share image (size verified, mirrored in the
  `og:image:width`/`height` tags). Scrapers don't resolve relative paths, so
  the URLs are **absolute** and the domain is baked in as
  `https://rienkspeelman.nl/`. Change the domain and **three** lines in
  index.html change together: `og:url`, `og:image`, `twitter:image`.
- `editor.html` — the owner's editing tool, one self-contained file, Dutch.
  Reads `content.js` via a `<script>` tag (the only way on `file://`, where
  `fetch` is blocked) and rebuilds the file on Save, header and section
  labels included. Live checks that exist because they catch *silent*
  mistakes: the link verdict mirrors `js/site.js`'s regexes (copied, not
  imported — keep them in step), the image field actually loads the file and
  warns on capitals in the name (macOS is case-insensitive, so a wrong-case
  file loads locally and 404s online — a not-found check alone can never
  catch it), and the description field says when the site will DROP the line
  (roll tiles, Spotify embeds, error cards render no caption).
  It also carries the **live preview** (`Voorbeeld` in the top bar) — its own
  section below.
  **`showSaveFilePicker` never fires on `file://`** — Chrome refuses a handle
  on an opaque origin — so double-clicking always lands on the download path.
  From the second download in a session the browser silently names the file
  `content(1).js`, which can never overwrite anything; the editor warns about
  exactly that, because nothing else can detect it. Comments are not data and
  do not survive a rebuild (the TEST ITEM note will vanish on his first save).
- **The repo is SPLIT, and that split is the security boundary.** Everything
  publishable lives in `site/` (`index.html`, `content.js`, `css/`, `js/`,
  `fonts/`, `images/`, `og.jpg`, `favicon.svg`, `404.html`); everything else
  — `editor.html`, `README.md`, this file, spare `content-*.js` copies,
  `.claude/` — sits OUTSIDE it and is never uploaded. Rienk drags `site`,
  not the project folder.
  This replaced a `_redirects` blocklist that 404'd the working files, and
  it was replaced because that approach leaked three separate times: a
  mid-pattern splat (`/content-*.js`) silently matches NOTHING in Netlify —
  splats only work at the end; and Netlify's file lookup is
  case-insensitive and strips `.html` while rule matching is literal, so
  `/CLAUDE.md` was blocked while `/claude.md`, `/CLAUDE.MD` and `/editor`
  all served the real file. A blocklist there can never be airtight because
  the case permutations are unbounded. **Do not reintroduce `_redirects` as
  a way to hide files** — if something must not be public, it goes outside
  `site/`. Note the diagnostic trap that hid this: a blocked path and an
  absent file both return 404, so "it 404s" proves nothing unless you have
  separately confirmed the file is in that deploy.
- `site/404.html` — Netlify serves it automatically; deliberately standalone, no
  `content.js` or `site.js`, so the page that says "not found" cannot fail
  for the same reason the visitor arrived.
- `site/favicon.svg`. Outside `site/`: `editor.html`, `README.md` (owner
  manual, Dutch, one screen), this file, and spare `content-*.js` copies.
- `.claude/launch.json` — dev server config (`python3 -m http.server 8123`).

## How the renderer works (js/site.js)

Every item is `{title?, subtitle?, description?, link?, image?}` (`youtube:`,
`spotify:`, `url:` accepted as `link` synonyms, `desc:` as a `description:`
synonym). `buildCard()` decides:

- `link` is a **YouTube video** (watch / youtu.be / shorts / embed / live,
  11-char id — the pattern ends `(?![\w-])`, so a *12*-character id is not
  a match and falls through to the dashed error card below; without that
  guard its last character was chopped off and the card silently played a
  DIFFERENT video). Thumbnail chain: the item's own
  `image:` when it has one (owner-supplied stills beat YouTube's, which
  often carry baked-in logos or lyric captions) → `vi_webp/maxresdefault.webp`
  → `vi/maxresdefault.jpg` → `vi/hqdefault.jpg`, advancing on error or when
  `naturalWidth < 320` (YouTube's grey placeholder). **The `< 320` test is
  scoped to the YouTube sources** (`firstYouTube` index) — a small file the
  owner chose must never be silently swapped out. Both branches share the
  `<img>`, so the `file://` anchor gets the custom still too. Timestamps
  (`?t=371`, `t=1m30s`, `start=`) become `&start=N`.
  On click the button is replaced by an autoplay iframe (`iframe.focus()`
  after swap, `referrerPolicy = "strict-origin-when-cross-origin"` — the
  player throws **Error 153** without a Referer header). `playsinline=1` is
  on the embed URL and must stay: the API defaults it to 0, and without it
  every card takes over the whole screen on an iPhone. On `file://` pages
  no referrer can ever be sent, so there the facade is an `<a>` opening the
  video on YouTube in a new tab instead — keep that branch.
  **The swap dissolves in both directions.** On play the frame is inserted
  under `.video-frame.is-entering` (opacity 0) and un-classed on a double
  rAF so the player fades up; a hard cut in and a soft fade out read as a
  bug. **Pause-to-thumbnail:** the first play click lazily loads YouTube's
  IFrame API (`enablejsapi=1&origin=…` on the embed URL); when a video is
  PAUSED for `RESTORE_DELAY` or ENDED, the player is destroyed and the
  facade returns, remembering `getCurrentTime()` so the next click resumes
  there. **`RESTORE_DELAY` is 20000, not the 1500 it started at**: a second
  and a half took the player away from anyone who paused to think, and made
  YouTube's own captions, settings and speed menus unusable a moment after
  every pause. The three "not now" answers below re-arm on a separate
  `RECHECK_DELAY = 1500` — a wait, not a decision.
  `.video-frame.is-leaving` fades the player out (350ms — the same number as
  `FADE_OUT` in site.js and `transition: opacity 0.35s` on `.video-frame`
  in the stylesheet; each names the other in a comment), then the facade is
  swapped in under `.video-thumb.is-returning` and un-classed on a double
  rAF so it fades up. Any non-paused state event during that window calls
  `cancelRestore()` — resuming mid-fade must never destroy a playing player.
  **Under `prefers-reduced-motion` all of that choreography is skipped and
  the wait is 0ms** (`reducedMotion()`, read at call time so an OS change
  lands immediately): the stylesheet kills the transitions there, so waiting
  out 350ms only left the card blank on every pause. Guards
  that must stay: the restore re-arms instead of firing while
  `document.fullscreenElement` is set (destroying the fullscreen iframe
  would eject the viewer), while `document.activeElement === iframe` (the
  viewer paused from the player's own controls and is still in there — and
  this is the **only** one of the three that covers iPhone, whose native
  video fullscreen sets no `document.fullscreenElement`, leaving the check
  above blind), and while the playhead moved since the pause
  (scrubbing); focus is only handed back to the facade button when the
  iframe actually had it; `picture-in-picture` is deliberately absent from
  `iframe.allow` (pausing a PiP window would tear the player down and close
  it). If the API script is blocked, embeds behave as plain iframes — never
  make the API a hard dependency, and never load it before the first play
  click.
- `link` is **open.spotify.com** playlist/album/artist/track/show/episode
  (with optional `/intl-xx/`) → embed iframe. Heights: track 232px;
  episode & show 352px (aligned on purpose); others 420px.
  **The iframe starts with `data-src`, not `src`**, and is pushed onto
  `lazyFrames`; `loadLazyFrames(root)` hands the address over when the
  reveal `IntersectionObserver` reaches the card (both the observer callback
  and the initial on-screen pass call it), and the no-IntersectionObserver
  branch calls it with no root to load them all. `loading="lazy"` is still
  set as a harmless second layer, but it is NOT what does the work —
  Chromium ignores it on iframes, which is how ~683 KB of Spotify JS came
  to load ahead of the fonts for players thousands of pixels down the page.
  The sized container stays, so nothing shifts when a player arrives.
- `link` looks like a *failed* video attempt (`watch`/`youtu.be` but no valid
  id) or is a `spotify.link/...` short URL → friendly dashed error card.
- Any other `link` (including YouTube channels/playlists, Spotify profiles)
  → clickable banner (↗ mark, `aria-hidden` on the arrow, opens new tab).
- **No link at all → still a card.** `buildCard()` falls through to
  `buildBannerCard(card, item, "")`: a plain `<div class="banner">` (never a
  dead `<a>`) holding the `image:`, or the generated typographic banner when
  there is none. No `is-action`, so no blur and no badge — the static
  gentle-zoom path that exists for "a click that promises nothing" — and the
  caption keeps its `h3` / `p` / `p`. The `<img>` gets `alt=""` on this
  branch only: the title is printed directly below it, and unlike the linked
  branch there is no wrapper `aria-label` to suppress the duplicate. A
  `description:` here stays caption-only (nothing softens on hover), which is
  the same "normal card with no picture" rule, and content.js/README say it
  out loud. This path was unreachable before `roll:` existed.

**Routing is the `roll:` field, not the link.** `rollMode()` — forgiving the
same way `featureMode()` is: real booleans, `"yes"/"no"/"true"/"false"`
case- and whitespace-insensitively, and any other non-empty string counts as
**true** (the owner typed *something*, and it was to get the work into the
roll) — decides whether an item renders as a full card or as a tile in the
section's `.client-roll`. **The default is false**: a work is a big card
unless the owner writes `roll: true`. **`featured:` beats `roll:`** — a work
marked BIG is never demoted into the strip. A `roll: true` item that cannot
make a tile (no title *and* no image) falls through to a card rather than
vanishing. The old automatic "no link → roll" rule is **gone**; every
previously link-less item in content.js was migrated to an explicit
`roll: true` in the same pass, so the rendered page did not change. Do NOT
auto-roll anything, exactly as nothing is auto-featured.

- **`roll: true` → a tile in the roll**, a grid below the cards at **4 up on
  desktop, 2 on phones**. Cards themselves are 1 up on phones and **2 or 3 up on
  desktop**: `balanceColumns()` sets `--cols` per section from the count of
  non-featured cards, choosing whichever of 2/3 leaves no empty gap in the
  last row (3 wins ties) — the owner explicitly does not want holes in the
  grid. Desktop page gutters RAMP into `13vw`:
  `--pad-x: clamp(2.5rem, 43.44vw - 389.6px, 13vw)` inside
  `@media (min-width: 989px)`, so the whole page sits in a centred column
  with equal margins (a fixed `max-width` on the grid was tried and
  rejected — it looked small and off-centre on wide screens). It is a ramp
  and not a flat `13vw` because 989px is also where the cards go
  multi-column: stepping both at once took the page column from 909px at
  988 to **732px at 989**, so one pixel of window shrank every card in a
  three-up section by 60% and shoved the wordmark 68px off centre. The
  middle term is the line through (989px, 40px) and (1280px, 166.4px) — the
  gutter grows out of its 988 value and only *meets* 13vw at 1280, above
  which the clamp's ceiling hands back to plain `13vw`. Keep the two
  changes off the same breakpoint.
  Each tile is `.client-shot` (16:9 frame, `overflow:hidden` so the hover
  zoom clips) holding the `image:` **in full colour**, with the title and
  subtitle underneath; no image (or a 404) falls back to the title set in
  display type inside the same frame. This exists because a wall of 16:9
  cards read as busy — the big cards are reserved for the work the owner
  wants a visitor to stop at.
  **A tile may itself be clickable.** When a `roll: true` item has a
  `link:`, `buildClientTile()` wraps the whole tile — picture, name and
  kind — in ONE `<a class="client-link">` (`target="_blank"`,
  `rel="noopener"`, `https://` prepended by `itemLink()`), appends the
  shared `.external-mark` ` ↗` to the `client-title` (`aria-hidden`:
  decoration, so heading navigation still reads the plain name) and adds a
  `.visually-hidden` "(opens in a new tab)" as the anchor's LAST child —
  deliberately not an `aria-label`, which would swallow the `client-label`
  line inside the link. `.client-link` is `display: block` (an inline box
  around block children splits in odd places) **and `position: relative` —
  that one is load-bearing**: the `.visually-hidden` span is
  `position: absolute`, and with no positioned ancestor it hangs off the
  page instead of off the tile, which once the roll slides pushes the whole
  document sideways in Blink/WebKit (Gecko clips it either way). Measured
  with 12 linked tiles at 1440: `scrollWidth` 2910 before, 1440 after.
  **No badge disc and no blur in the roll** — the strip promises less than
  a card on purpose; the global `a:hover` lifting the name to accent (the
  same move `a.banner-generated:hover` makes) plus the tile's existing
  full-colour zoom carry the affordance. Inside a sliding rail the focus
  ring is drawn inset
  (`.client-rail .client-link:focus-visible { outline-offset: -2px }`) —
  the rail is a scroll box that clips vertically, so the usual 3px offset
  would be cut off at the edges; tab order stays rail → tiles in DOM order
  → prev → next. No new transition or animation came with any of this (the
  anchor rides the existing `a { transition: color }`, which the
  reduced-motion block already neutralizes), so that block needed no edit.
  The tiles rest dimmed
  (`filter: brightness(0.85) saturate(0.9)`) and come to full colour
  with a 1.05 zoom on hover, which reads as a quiet strip rather than a
  second wall of imagery. That rest filter is colour, not motion, so it
  deliberately survives `prefers-reduced-motion` (only its easing goes).
  NOTE: a monochrome white-logo version of this roll was built and
  REJECTED by the owner ("I don't like the svg/colorless icons"); the
  sourced logos were deleted. Keep the colour photos. `featured:` still
  forces a full card if ever needed.
  **More than four tiles → the roll slides sideways** (a fifth would open a
  second row, and two rows of pictures are the wall this strip exists to
  avoid). `makeRollScrollable(roll, label)` rewrites the roll *in place*
  after `fillGrid()` has filled it: `.client-roll` gains
  `client-roll-scroll`, the tiles move into a `.client-rail`
  (`tabindex="0"`, `role="region"`, `aria-label` = section title + "— more
  work, scroll sideways"), and two `.roll-arrow` buttons are appended.
  **≤ 4 is a guaranteed no-op** — the class is never added, the DOM is
  byte-for-byte what it was; keep it that way. **The peek is the primary
  cue, not the buttons:** `--roll-tile` is
  `(100% − --roll-across × --roll-gap) / --roll-span` with 4/4.35 on
  desktop and 2/2.35 ≤720px, i.e. whole tiles plus ~35% of the next one
  showing at the right edge. `--roll-gap` was hoisted onto `.client-roll`
  so the grid and the rail measure from one number. Layout notes that cost
  time to get right: the wrapper is a **one-cell grid** with the rail and
  both buttons in `grid-area: 1 / 1` — NOT `position: absolute`, because
  `.client-roll` carries the `.reveal` transform and its own `padding-top`,
  either of which would move an absolute containing block; the buttons are
  parked on the middle of the *picture* band (not of the tile, captions
  included) with `margin-top: calc(var(--roll-tile) * 9 / 32 − ...)`, which
  works because a percentage **top** margin resolves against the containing
  block's **width** — the same width `--roll-tile` is cut from; and the
  layout declarations use the double class `.client-roll.client-roll-scroll`
  so they outrank the two-up phone rule further down the file. The buttons
  are the badges' language at a quieter size (36px disc, dotted accent ring
  at rest → solid accent on hover, `::after { inset: -6px }` for a 48px tap
  target, the play badge's own triangle path mirrored for "prev"); they get
  no `:active` dip — the rail moving *is* the feedback, so the file still
  has exactly two non-token `0.1s` timings. **≤720px the arrows are
  `display: none`** — the swipe is the interaction there, and a 36px disc
  would sit exactly on the peek sliver that is the scroll cue. Scrolling is
  smooth `scrollBy` by one page = `clientWidth −` one tile, behind a
  feature-detect (`"scrollBehavior" in document.documentElement.style`) with
  `scrollLeft +=` as the fallback AND the reduced-motion path — a browser
  without the options form doesn't throw on it, it silently no-ops, so a
  try/catch can never catch it. CSS does `scroll-snap-type: x proximity` +
  `overscroll-behavior-x: contain` with the scrollbar hidden. Arrow
  visibility is the `[hidden]` attribute, driven by a passive `scroll`
  listener per rail plus one shared rAF-latched `resize` pass; the first
  pass runs from `updateRolls()` **after** the sections are in the document
  — a rail measures 0 before that, which would hide both arrows for good.
  When an arrow hides itself while focused, `update()` hands focus to the
  other arrow (or the rail) so keyboard users aren't dropped on the floor.
  `balanceColumns()` is untouched and must stay so: it counts
  `.work-card:not(.work-feature)` inside the *work grid*, and roll tiles
  have never been in it.
- Banner cards, linked or not (`buildBannerCard`). With `image:` → the
  picture; without (or if the image 404s) → generated typographic banner.
  The banner title is an `h3` (heading navigation must list every card);
  when the image-error fallback fires it removes the duplicate title below
  the card. The `<img>` is **always `alt=""`** — the title is printed under
  the card and a linked banner already carries it in the anchor's own
  label, so an alt made a screen reader say the same name three times.

**Hover effect:** captions always sit statically below the cards, on every
device. On `(hover: hover) and (pointer: fine)` pointers, *actionable*
cards — video facades and banners that link somewhere — carry an
`is-action` class: hovering **the clickable element itself** (not the
caption — the trigger is scoped to `.video-thumb` / `.banner`, and to
`:focus-visible` rather than `:focus-within`, so script focus after a
pause-restore never re-blurs) softly blurs the image (10px + dim, slight
scale to hide the blur's soft edges) while the badge comes alive.
**Badge geometry & state:** `.play-badge` (▸) and `.visit-badge` (↗) are
ONE rule in the video-cards section — same disc, different glyph — sitting
dead centre (`position: absolute; inset: 0; margin: auto`) at
`clamp(52px, 6vw, 56px)`. **Quiet at rest, loud on hover**, which is the
owner's brief in his words ("less obvious when the image is NOT being
hovered"): at rest a `rgba(10, 0, 0, 0.4)` scrim with the glyph in accent,
**no border** — a dotted accent ring was tried here and removed on the
owner's request; the dotted-outline language belongs to the hero category
pills and roll arrows, not the badges. (`fill`/`stroke: currentColor`, so
the badge's own `color` drives both SVGs and only one property has to
transition.) On `:hover`/`:focus-visible` *only*, the fill goes solid
`--accent`, the glyph inverts to `--accent-ink`, and it scales 1.1.
Touch keeps the quiet rest state — it's still a visible
affordance — plus the `:active` image dip. History: a full-strength accent
disc at `clamp(56px, 9vw, 72px)` was too loud (it sat on the subject of
every still), and parking it 46px bottom-left fixed the loudness but lost
the centre; the owner asked for the centre back, quieter. That supersedes
the older "always visible so links are obvious" badge decision — captions
still deliberately carry NO ↗, the badge is the link indicator.
`.work-feature.feature-center` no longer needs a size/position exception
(the base rule is what that exception used to say); its hover hand-over —
badge to `opacity: 0` as the centred caption fades in — still targets
`.play-badge` / `.visit-badge` by name.
**The timing is deliberately asymmetric — that's what makes it feel calm:**
tune it via `--hover-in` / `--hover-out` in `:root`. The base rules carry
the slow RELEASE (`--hover-out` with `--ease-release`, a *lingering*
ease-in-out curve), and the `:hover`/`:focus-visible` rules override both
duration (`--hover-in`) and curve (`--ease-smooth`, front-loaded) for a
responsive way in. **The release must keep the lingering curve:** with a
front-loaded curve, blur drops below the visible ~2px in the first
half-second regardless of duration, so longer values appear to do nothing
(this exact confusion happened). Badges share the same in/out timing so
the card moves as one. Keep this split; a single symmetric duration was
tried and felt worse (as did a pre-blurred cross-fade layer — owner
rejected it for washed-out edges; don't reintroduce either). Static image banners get only
a gentle zoom (1.06, same asymmetric timing), no blur (nothing would
happen on click, so nothing should be promised) — which is also the shape a
work with no `link:` and no `roll: true` renders as. Generated text banners and Spotify embeds get no hover effect
(`is-action` is removed in the image-error fallback path).

**Descriptions (`description:` / `desc:`)** are optional per-item prose,
`asText`-coerced like every other field; missing or empty renders exactly
today's DOM (no empty node). It is **ONE node** — `<p class="work-desc">`
appended to `.work-meta` after the subtitle by `appendMeta()` — and it simply
**prints under the subtitle, in `--accent`, on every card type and every
device**. `max-width: 46ch` normally, `40ch` inside a feature's narrower text
column; `.feature-flip` hangs it right and `.feature-center` centres it (both
reset when features stack at ≤988px). Accent so it reads as a different kind
of information from the grey subtitle above it.

**History — do not rebuild this.** It used to be lifted onto the picture and
revealed on hover: `.visually-hidden` at rest, an absolute top-left overlay
inside the hover query, `container-type: inline-size` on the card via
`:has()`, `@container` tiers at 340/420px, `-webkit-line-clamp` sized so the
text cleared the centred badge, and a `rgba(10,0,0,0.72)` plate for contrast
over bright stills. **The owner rejected it** — it read as a box dumped on the
still. The plain version is also strictly better: hover text is invisible on
every phone AND on the narrow cards of a three-up row, so the one line saying
what he actually DID was reaching almost nobody, and the mechanism that hid
it needed ~80 lines of CSS plus a container-query fallback path. That whole
apparatus is gone; nothing in the stylesheet uses container queries now.

- **Spotify embeds, error cards and client-roll tiles still never render it**
  (`appendMeta`'s `allowDescription` is false there; `buildClientTile` has no
  caption at all). The editor says so live as he types, so it is surfaced
  rather than silently dropped.
- Reduced motion needs no entry: the line no longer transitions.
- There is no length ceiling imposed by geometry any more — it wraps. The
  editor warns past ~120 characters purely on the grounds that one short
  line reads better than a paragraph.

**Hero name — measured, not guessed.** `fitHeroName()` reads the name's
current computed size, sets `white-space: nowrap`, measures the text with a
`Range` (sub-pixel; `scrollWidth` is the fallback) and scales the font-size
so the line spans `heroName.clientWidth` — the hero's own content box, so
`--pad-x` is never hardcoded and the name lands on the same gutters as the
tagline. Reads happen before the single write (one reflow per fit). `× 0.998`
of slack keeps a rounding error from pushing the last letter past the gutter
and the page into horizontal scroll. Clamps: floor `HERO_MIN_SIZE` 48px, and
a ceiling of `room / lineRatio` where `room` is the hero's inner height minus
`.hero-sub` (measured against `min-height` when the box has already grown, so
the fit converges instead of chasing its own overflow). If even the floor
overflows, `nowrap` is dropped and the name wraps, as the old CSS clamp did.
Fires: once after the sections render (the category list sets `room`), then
as part of `layoutPass()` — see below. The old character-count formula
(`170 / name.length` vw) left ~160px of dead margin at 1440 — don't go back
to guessing. The CSS starting size (`clamp(3rem, 14vw, 12rem)`) is only ever
a starting point, since the fit is a ratio; what it really decides is the
**no-JS** page, where 30vw used to render 432px over three lines with a
mid-word break.

**One measured pass — `layoutPass()`.** Three things read the layout and
write a size back into it: `updateRolls()` (a rail's scroll length),
`updatePillRings()` (the ring is drawn from the pill's measured box) and
`fitHeroName()`. They answer to the same two events, so they run together:
one rAF-latched `scheduleLayoutPass()` on `resize` (a resize storm costs one
reflow per frame, not one per handler) and one `document.fonts.ready.then`
— both faces load `font-display: swap`, so the first measure of *either*
can be the fallback font. This replaced two independent rAF latches; the
pills were missing the `fonts.ready` hook and sat up to 4px narrow, rings
drawn to match, until the visitor happened to resize. Add the next measured
thing to `layoutPass()` rather than to a new listener.

Sections: each `sections[]` entry renders as `<section id="<slug>">` with a
`.section-label.reveal` — **display type** (Bebas, `clamp(2rem, 3.2vw, 3rem)`,
tracking 0.03em), not the old small mono label — followed by an accent,
`aria-hidden` `.section-count` kept small and mono on purpose
(absolute `0.85rem`, `vertical-align: 0.5em`; an `em` size would grow with
the label), e.g. "COMMERCIALS · 08" — the space before the span is
real text so copy/paste and accessible names stay clean. **That number is
everything the section rendered, cards AND roll tiles** (`fillGrid()`
returns one count for both), which is why Commercials reads `· 09` today
with four cards and five tiles; it is the count of *works*, not of cards,
and it is meant to be. Hairline top
borders separate work sections. Type hierarchy at 375px: section labels 32px
< `#music .giant-label` 48px (scoped down from the shared 160px giant) <
"I'M RIENK" 64px. A section whose items ALL fail to build is
skipped entirely (no label, no nav entries — `firstSlug` = first *rendered*
section), matching the music section's gating. The hero category list,
header WORK link and mobile menu are generated from them. The retarget is
`$all('a[href="#work"]')`, so it moves **both** the header WORK link and the
skip link onto the first rendered section — that is deliberate (`#work` is
the wrapper, and a skip link should land on the first thing there is to
read), so keep the selector broad rather than narrowing it to the header. `fillGrid()` adds `.reveal` to every card; the
stagger delay is assigned in the IntersectionObserver callback *per
intersecting batch* (`min(batchIndex,5) × 70ms`) — never per DOM index, or
solo-revealed cards wait out dead delay. At startup, visible (non-hidden)
`.reveal` elements whose top is inside the FULL viewport get `.in-view`
immediately with the same stagger — the observer's `-10%` bottom margin
would otherwise leave the hero-peek band (the first section label)
invisible until the first scroll; keep this initial pass. Featuring is OWNER-CONFIGURED via the item's
`featured:` field (parsed by `featureMode()`; forgiving — `true`/unknown
words mean "right", `feature:` accepted as alias): `"right"` →
`.work-feature` (media left, display-font title right), `"left"` → adds
`.feature-flip` (title left, right-aligned), `"center"` → adds
`.feature-center` (media full-row; on hover-capable pointers the caption
becomes a centered overlay revealed via `.video-thumb:hover ~ .work-meta`
etc. — sibling combinator, `:hover`/`:focus-visible` only (NEVER
`:focus-within`, see the pause-restore lesson), badge fades out as the
title fades in; touch keeps the caption statically below, centered).
That overlay's scrim is `rgba(10, 0, 0, 0.6)` and its `.work-subtitle`
drops `--ink-muted` for full `--ink`, both **inside the hover query only**:
at 0.35 with the muted subtitle the softened still came through at 3.8:1 on
one of the darkest images on the site — a live AA failure, on desktop the
*only* place that card's client and role are readable. Measured after:
worst 11.3:1, and 7.7:1 even against a pure-white still. Touch is untouched
(the caption sits on the page background there, 7.25:1).
Feature layouts work for every card type (video, banner, Spotify embed).
`.feature-flip` mirrors the column template (media keeps the wide 5fr
column on both sides — reordering alone would hand the wide column to the
text); `.work-feature > :only-child` spans the row when no caption
rendered. Features stack at ≤988px — this breakpoint MUST stay exactly one
pixel under the outer grid's multi-column threshold (`@media
(min-width: 989px)`), or "featured" items render smaller than regular cards
in the in-between band. The number itself is a leftover from the old
auto-filled grid's 440px minmax and is no longer measurable as such: at 989
a two-up card is 439.7px but a three-up one is 283px. Treat 988/989 as a
pair to keep in step, not as arithmetic.
**Below that point a feature is typographically just a card** (owner's call):
the caption resets to the ordinary mono title, and `feature-center` stops
centring. Featuring is a LAYOUT idea — an oversized title earns its size by
sitting beside media in a wide row — so in one column it is a promise the
page can't keep, and the reader sees two headings of similar weight with no
reason for the difference. This replaced an earlier fudge that merely shrank
the display face to ~2.4rem, which landed in the gap between "the same" and
"a statement". The one thing kept: a feature's `description:` still prints,
because it is content and a phone has no hover, so that is the only route by
which any description reaches a mobile visitor. Do NOT auto-feature
anything — featuring is entirely content.js-driven. Slugs dedupe
and **reserve** `work, music, about, contact, top, mobile-menu` — never let a
generated id collide with those. The `music{}` block renders as its own zone
(`#music`, giant label) after the work sections; its WORK/MUSIC/ABOUT header
entry and mobile-menu entry hide automatically when no music item *renders*
(gate on built cards, not raw item count).

Socials: `url:` is the documented key, but `link:` and `href:` are read as
synonyms (the rest of content.js says `link:`, so typing it here is the
obvious slip), every value goes through `asText()` and the shared
`fixScheme()` helper — the same scheme repair `itemLink()` gives work items,
so a bare `instagram.com/…` still resolves — and an entry with no usable
address `console.warn`s instead of vanishing. Bare-string socials
(`socials: ["https://…"]`) still don't render; they warn now. `fixScheme()`
is hoisted next to `asText()` and is the ONE place the `https://` repair
lives; don't inline a second copy.

Contact button: `mailto:` when `email` is set (non-empty, contains `@`, not
"example"), else falls back to the first social link. `email` is
`rjtspeelman@gmail.com` — supplied by the owner (Wesley confirmed it in
chat); the social fallback is dormant but must keep working. Never REPLACE
it with a guessed address; only the owner supplies email values.

## Live preview (editor.html → index.html)

`Voorbeeld` in the editor's top bar puts index.html in an iframe beside the
form, so he can see a change before he saves it. Two files: a ~40-line
`previewContent()` in `js/site.js` (section 11 of the editor's script is the
other half). This is the ONLY thing the site's own behaviour learned, and on
the deployed site it is provably inert.

**The channel is the URL fragment, and the alternatives are measured dead.**
On `file://` Chrome gives every file its own opaque origin, so:
`iframe.contentDocument` is blocked (Chrome; Firefox happens to allow it —
don't build on that), and `window.name` is wiped on every cross-origin
navigation, which on `file://` means *every* navigation (the child received
`null`). What survives is the page's own address. So the editor writes
`index.html?preview=<n>#preview=<encodeURIComponent(JSON)>` and the framed
page reads its OWN `location.hash`. No cross-document access anywhere.
Verified in headless Chrome and headless Firefox, on `file://` and over
`http`. `postMessage` does work across origins if a back-channel is ever
needed; `contentDocument` still won't.

**The counter is not decoration.** Two addresses that differ only in their
fragment do not reload an iframe — they scroll it. `?preview=<n>` increments
on every refresh so the query changes too and the browser has to navigate for
real. Remove it and the preview silently freezes on the first thing it ever
showed. Measured both ways.

**The gate is the security boundary**, and it is `AND`-ed:
`window.top !== window.self` (must be framed) **and** a local address
(`location.protocol === "file:"`, or hostname `localhost` / `127.0.0.1`).
Without it, anyone could pass around a link that frames the published site
with a hash of their own and have it render work and words that aren't his.
Verified: unframed with a crafted `#preview=` hash renders content.js
(Chrome + Firefox, `file://` and http), and framed from a non-local hostname
renders content.js while the identical page on `localhost` renders the
crafted payload — same harness, so the negative result means something.

**Malformed input falls through to `content.js`, never to the error screen** —
that screen is for a broken content.js and a half-typed fragment isn't one.
Non-JSON, truncated JSON, `null`, and a top-level array were all checked.
(Chrome refuses to navigate to a ~3MB URL at all, which is why the editor
caps the encoded payload at 1.5MB and shows a calm Dutch line instead —
below the browser's own ~2MB limit, so it never gets to produce a broken URL.)

**The reload is turned into a feature.** A reload resets scroll, so the
editor appends `&at=<slug>` — the id the site already gives the section he
has a field focused in (`focusin`, walking up to `[data-section-index]`, plus
`top` / `music` / `about` / `contact`; the editor's `sectionSlugs()` mirrors
`slugify()`'s reserved names and `-2` dedupe, copied not imported, like the
other mirrors in that file). The framed page hands that slug to the browser
with `location.replace("#" + slug)` once the section exists, so the browser
does its own fragment navigation — `scroll-padding-top` and all — and no new
scrolling code exists anywhere. `replace()`, not assignment, in both places:
a plain `iframe.src =` and a plain `location.hash =` each leave a history
entry behind, and after an afternoon of typing his Back button would walk
backwards through his own keystrokes.

Editor side, worth keeping: the refresh is debounced 400ms and skipped
outright when the serialized payload is byte-identical to what the frame is
already showing (typing a word is one reload, not eight). It hangs off
`markDirty()` — deliberately *outside* that function's `if (!dirty)` guard,
which only has to fire once. Below **1100px** the second column is not just
hidden, the toggle button is too: a button that can only do nothing is worse
than no button, and a form squeezed to half a phone is worse than no preview.
Both the on/off state and the width live in `sessionStorage`, in a try/catch.
Width is a two-way switch: telefoon renders at a real 375px, laptop at a real
**1280px** scaled down with `transform: scale()` + `transform-origin: top
left` — narrowing the iframe instead would show him the mobile layout and
call it his desktop site. The frame's *height* is the pane height divided
back out of the scale, so an `svh` hero is a hero here and not a letterbox.
The pane says in Dutch that it is a voorbeeld (nothing is saved yet) and, on
`file://` only, that video's open on YouTube there — that is YouTube's Error
153 rule about referrers, not a fault, and online they play in the page.

## Design language (keep consistent)

Modeled on the Squarespace "Cucoloris" template, original implementation:
near-black `#0a0000`, off-white `#f5f5f5`, chartreuse accent `#edf07b`,
Bebas Neue for giant display type (the hero name is fitted to the column,
see above; section labels are display type too), Space Mono for everything
else, yellow pill buttons, fixed translucent header that gains background
after scroll (initialized on load + rAF + `load` + `hashchange` — deep
links must not show a transparent header).

**Buttons speak the template's dialect.** `.pill-button` is a full capsule
(`999px`), mono caps, chunky padding (`0.85em 1.9em` — `em`, so the compact
header pill scales from the same shape; `.pill-button-big` sets its own
`rem` padding), solid `--accent` at rest.
The hover (mice only, `(hover: hover) and (pointer: fine)`) is the
reference's signature flip run backwards: the fill **drains to transparent**
while a **1.5px dotted `--accent` border** and accent text take over. The
border exists at rest too, `1.5px solid transparent`, so the flip can't
shift the layout by 3px. The badges fill solid on hover the same way (see
the hover-effect section — they carry NO dotted ring at rest, owner's
call). Rest borders are dotted-accent COLOUR, not motion, so they survive
`prefers-reduced-motion`; only the easing and the `1.04` lift go. An
ungated `.pill-button:hover { color: var(--accent-ink) }` sits before the
gated rule as a touch guard — sticky `:hover` on a phone would otherwise
let the global `a:hover` paint the label accent-on-accent. Do NOT copy the
reference's *primary*-button hover (a dull opacity fade), and do not
pill-ify the header nav — that stays text.
**The hero categories ARE pills** (owner reversed the earlier stay-text
call after seeing the reference's filter pills): `1.5px dotted --accent`
capsules, accent text, that **fill with accent from the bottom up** on
hover/:focus-visible — a bottom-anchored one-colour gradient grown via
`background-size: 100% 0% → 100% 100%` (no extra element), text flipping
to `--accent-ink` on the same clock, border going solid. Deliberately NOT
on the big hover tokens: 0.2s up / 0.3s down, both `--ease-smooth` — the
0.9s image-blur drain read as sluggish on a control this small (owner
flagged it). The visible capsule measures ~40px tall at 1440; an
`::after { inset: -4px }` halo adds 4px all round for a ~48px tap target.
There is deliberately **no `min-height` on the pill** — its height comes
from its own padding and line-height, and `updatePillRings()` measures
`offsetHeight` to draw the ring, so a min-height would grow the capsule out
from under its own dots.
**The dots are DRAWN, not the browser's:** CSS `border: dotted` spaces its
dots per edge, which left ragged gaps where the straights meet the curves
(owner flagged it). `addPillRing()`/`updatePillRings()` in site.js give
each pill an SVG `rect` ring; the capsule perimeter is computed exactly
(`2·(w−h) + π·h`), the dot count divides it exactly (≈4.6px spacing,
round linecaps at `stroke-width` 1.6), so spacing is even everywhere with
a clean seam. Redrawn with the rolls and the hero name in `layoutPass()` —
on resize and on `document.fonts.ready`. The
dotted CSS border stays as the no-JS fallback — `.has-ring` (added only
after a successful measure) turns it transparent, never removes it; on
hover the CSS `stroke-dasharray: none` closes the ring into the solid
line.
**Two box-model traps, both already sprung once — don't undo either.**
(1) The pill's fill needs `background-origin: border-box`: the default
padding-box stops the gradient short of the transparent border, and a
*filled* pill then showed a black hairline down its bottom and right
edge (owner flagged it). (2) `updatePillRings()` measures the **SVG's own
`getBoundingClientRect()`**, never the pill's `offsetWidth`. An `<svg>` is
a replaced element, so `width: auto` takes its intrinsic 300×150 and
ignores insets; and browsers round the 1.5px border to whole device pixels,
so anything derived from the pill's size lands ~0.5px out. The SVG must
therefore stay in the box at all times (it is not `display: none` at rest —
an unsized `<rect>` paints nothing, which is what hides it before the
first measure), or measuring it returns 0 and the ring never draws. The CONTACT pill's hover outline and the roll arrows still use
native dotted borders — small/round enough that the artifact doesn't
show; promote them to drawn rings only if someone complains. On phones they wrap as a pill
cloud (the old stacked-list override is gone); the `·` divider between
categories is gone with it.

## Invariants that came out of hard review rounds

- Global `[hidden] { display: none !important; }` — JS toggles the `hidden`
  attribute everywhere and relies on it beating author `display` rules.
- **There is no dead CSS and no orphan custom property** (swept and
  verified). Don't go hunting: several class names that a `grep` of the
  stylesheet can't find in index.html are built by string concatenation in
  site.js (`"spotify-" + spotify.kind`, `"roll-arrow roll-arrow-" +
  direction`), so a "unused" match is almost certainly a false one.
- A single-item section must keep normal card width. This used to be an
  `auto-fill` (not `auto-fit`) grid; it is now
  `repeat(var(--cols, 2), minmax(0, 1fr))` with `--cols` set per section by
  `balanceColumns()`, and `bestColumns()` returns 2 for a count of ≤ 1 — so
  the outcome is unchanged and must stay so, but check it in the JS, not in
  a `grep` for `auto-fill`.
- Modern-CSS baseline: `:has()` is in use (header pill, About photo) and must
  degrade to a sane state where it's missing — the pill just stays visible.
  **Container queries are no longer used anywhere** (they went with the
  description overlay); don't reintroduce one without a reason that survives
  the question "what does a browser without it see?".
- Mobile menu (≤720px, `matchMedia(min-width: 721px)` closes it when
  crossing the breakpoint): scrollable overlay (`overflow-y:auto`,
  `overscroll-behavior:contain`, margin-auto centering) so landscape phones
  aren't clipped; opening sets `inert` on `main`/footer + locks body scroll;
  closing restores focus to the burger; header-name and skip-link clicks
  also close it; Escape closes it. It animates **in** only (`menu-in`
  opacity on the overlay + `menu-link-in` staggered 40ms per link, capped
  from the 6th) — the `[hidden]` toggle restarts the animations, so no JS
  change was needed; exit stays instant so closing never feels sticky.
- The header CONTACT pill stays visible on phones (it was `display: none`,
  which hid the site's only call to action on its biggest audience): shrunk
  to ~75×31px with a `::after` inset spacer for a 44px hit area, header grid
  `minmax(0, auto) 1fr`, `.header-name` truncates with an ellipsis. It is
  `visibility: hidden` while the burger is `aria-expanded="true"`
  (`:has()`), or it would float above the overlay over a scroll-locked page
  — the overlay renders its own CONTACT link.
- `prefers-reduced-motion` disables reveals, the description overlay's fade
  and every transform transition
  (including `.menu-toggle-bar`, the `:active` press dips and the menu
  entrance animations), and zeroes the hover *lifts* that would otherwise
  snap with no transition left to soften them — the pill's `1.04` and the
  badges' and roll arrows' `1.1` (the badges need their full five-class
  selectors there to outrank the hover rules), **and every hover ZOOM on a
  picture**: `.video-thumb:hover/:focus-visible img`, both `.banner:hover
  img` variants (`.is-action` and `:not(.is-action)`),
  `.client:hover .client-shot img` and `.about-photo:hover img` — those
  seven were missing and snapped in one frame. The blur and the roll's
  colour lift stay; only the movement goes. Colour-only states stay: the
  client roll's dim, and the hero pills' and roll arrows' dotted accent
  outlines — they're what says "clickable" (the hero pills' rising fill
  simply lands instantly there). New animations must be added to
  that block — and new *waits in JS*, and anything the browser would
  animate on the script's say-so, must consult `reducedMotion()`: the video
  swap waits 0ms there, and the roll arrows scroll with `behavior: "auto"`
  instead of `"smooth"`. Otherwise the script sits out a transition the
  stylesheet already removed.
- **Numbers that live in two files.** Each pair now names the other in a
  comment; keep that habit. The pairs:
  `FADE_OUT = 350` ↔ `.video-frame { transition: opacity 0.35s }`;
  `ROLL_MAX = 4` ↔ `--roll-across` / `--roll-span` on
  `.client-roll.client-roll-scroll`; `matchMedia("(min-width: 721px)")` ↔
  the two `@media (max-width: 720px)` blocks (and the hero's
  `@media (min-width: 721px)`); `--frame-ratio` ↔ the two places CSS can't
  read it from — `.video-frame`'s literal `aspect-ratio: 16 / 9` and the
  roll arrows' `9 / 32` margin; the `<title>`/`og:title` and
  meta/`og:description` duplicate strings in index.html; and the CSS
  `@media (min-width: 989px)` ↔ the `@media (max-width: 988px)` that stacks
  features.
- Tap targets ≥ ~44px (filter-style small links get padding; the ~40px hero
  category pills and the 36px client-roll arrows both use an invisible
  `::after` spacer — `inset: -4px` and `inset: -6px` — to reach ~48px, the
  same trick as the header pill). There is **no `min-height: 44px` on the
  hero categories** and adding one would break the drawn ring, which is
  measured from the pill's box. Touch gets its own feedback:
  `.pill-button:active` dips to 0.97 (the whole hover flip, `scale(1.04)`
  included, is gated behind `(hover: hover) and (pointer: fine)`, and the
  `:active` rule must stay *after* that gated block or the lift outranks the
  press), `.video-thumb/.banner:active img` to 0.98 — the two deliberate
  non-token `0.1s` timings, since a press must answer instantly.
- TextEdit smart quotes are the #1 way the owner breaks `content.js` — the
  error screens and docs mention it; keep that guidance intact.
- All 320–1440px widths must be free of horizontal overflow.

## Working on the site

Preview: serve with `python3 -m http.server 8123` (there's a
`.claude/launch.json` for it) — needed for YouTube embeds to actually play.
Opening `index.html` directly works for everything else; embeds fall back
to opening YouTube in a tab (Error 153 — no referrer from `file://`).
There WAS a double-clickable `Preview site.command` for the owner; it was
deleted on purpose. macOS quarantines an unsigned `.command` the moment the
folder is zipped or sent, so the one file whose job was "make previewing
easy" was the one guaranteed to greet him with a Gatekeeper refusal — and a
Terminal window is a poor first experience for a non-developer. Everything
except inline video playback works from `file://`, and the editor now
validates links as he types, which is what the preview was really for.
Don't reintroduce it.
After changes: check the browser console is clean, click a video (facade →
iframe swap), test the burger menu at narrow width, and sanity-check
320/375/768/1280 widths. There are no tests and no linter — verification is
loading the page.

Deploy: drag the WHOLE folder to Netlify Drop (or GitHub Pages). Re-drag to
update. Drag **`site`**, not the project folder — that is the whole
mechanism, and nothing has to be deleted or configured first. The intended address is **rienkspeelman.nl**, already baked into the
share tags; attach that domain in Netlify and the unfurl works. Until it is
attached the site still runs fine on the netlify.app URL — only the share
picture will be wrong, because the tags point at a domain that isn't live
yet.

## Verified facts (don't re-research, don't invent)

- Spotify artist: `open.spotify.com/artist/1EDTEfdQZ9nRsyZjfRNEfo` (RIENK).
- Socials: Instagram `rienk.music`, SoundCloud `rienkmusic`,
  TikTok `@rienkmusic`. No personal YouTube channel exists (only an
  auto-generated Topic channel) — don't add one unless Rienk provides it.
- Banner images in `images/` are official promotional/brand assets
  (brand-site heroes, platform key art) used as portfolio client
  identification; if a client ever objects, deleting the `image:` line
  falls back to the generated text banner.
- **The shipped lineup is curated, and the rule behind it is the owner's:
  every item on the page must be clickable.** Nine link-less items were cut
  in that pass — Lotto, Krasloten (×2, one of them a TEST ITEM), Yakult and
  Lidl from Commercials; Dating Naked UK, Love Is Blind, Qmusic and 3FM from
  Television. His reasoning: a credit nobody can check proves nothing, and
  "Sync placement · Netflix" advertises a *different* skill (someone
  licensed an existing track) than the one this site sells. **Consequence:
  nothing carries `roll: true` today, so the client-roll strip renders
  nothing at all.** The feature and its sliding behaviour are intact and
  documented above — do not delete them, and do not invent a use for them.
  Qmusic and 3FM are the cuts worth reversing first: commissioned station
  imaging is the most on-message work he has, and they only went because
  there is nothing to link. If he supplies links, they come straight back.
- Spare line-ups (`content-oud.js`, `content-v2.js`, whatever else) sit at
  the PROJECT root, not in `site/`, so they can never publish. Only
  `site/content.js` is ever loaded.
- The section is called **"Television"**, not "Television & Radio": the
  radio credits (Qmusic, 3FM jingles) were the link-less ones, so no radio
  work survives the cut. Rename it back if they return.
- Every YouTube link in content.js was verified against the real upload.
  When adding new work items for Rienk, verify links/titles before writing
  them in — never guess catalog facts.
- **Three credits a pre-launch audit flagged as suspicious. All three were
  put to Wesley and RESOLVED — do not re-flag them:**
  - *LOT42 — Capture the Moment*: the linked video credits "Abbad +
    Freimann", not Rienk. **Rienk is part of Abbad + Freimann** — it was the
    act used for that sync. The credit is his; the caption is honest.
  - *Walmart*: `BplZPXGioqU` is an anonymous re-upload ("Keith P."). Kept
    deliberately — no official upload exists. If it ever 404s, the fix is a
    frame grab as `image:` with no `link:` (renders as a non-clickable
    picture card), not a different video.
  - *Solomon France — Magazine*: WAS `1Dxe3aIO_rA`, a fan re-creation by
    "Monsterbunny". Now `g1p0DPp2t-0`, the artist's own upload. Verified the
    same track before swapping: both 166s, official posted 2024-08-04 vs the
    re-creation's 2024-07-12.
- Custom video stills (frame grabs from the actual uploads, exported at
  1280×720, each chosen to avoid burnt-in branding/lower-thirds):
  `veiled-experts.jpg`, `air-i-breathe.jpg`, `freefall.jpg` — the latter
  two are crops, since the Monstercat label bug / NCS wordmark sit in
  every frame of those videos. **Three more have since been added:**
  `mobile-legends.jpg`, `solomon-france.jpg`, `liquicity.jpg` — the last of
  these is currently unused (the Liquicity aftermovie was cut as a sync of
  his own track, not commissioned work). Mobile Legends had been left on
  YouTube's thumbnail at one point (burnt-in lyric captions run from 0:09
  to the end, and the clean frames don't identify the client) — that is
  history now, it carries its own still. Before touching any of these,
  check the `image:` lines in content.js rather than this list.
  **Still missing, and both asked of Rienk:** a clean frame for *Walmart*
  (YouTube's thumbnail is letterboxed ~10% top and bottom and shows nothing
  that says Walmart — and it is now the second card in the first section),
  and one for *Regina Maria*, which is the page's flagship and has no
  `image:` at all. Never solve either by pointing an existing file at them:
  pairing a Lidl or Lotto frame with another client's credit would fabricate
  a picture of a job.
