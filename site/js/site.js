/* ==========================================================================
   RIENK SPEELMAN — site logic
   (Rienk: you don't need to edit this file — all text lives in content.js)
   ========================================================================== */

(function () {
  "use strict";

  /* ---------- friendly error screen ---------- */

  /* The panel takes the place of the (empty) main; the header, the footer and
     the no-JS note in index.html stay exactly where they are. Wiping the body
     used to take them with it, and a visitor then had a page that didn't say
     whose site it was or how to reach anyone. Nothing from content.js is
     repeated in here — index.html is the one that carries the fallback. */
  function renderError(introHtml) {
    /* index.html's <head> stashes the browser's own parse error, if there
       was one, so the screen can name the line that broke */
    var stashed = window.CONTENT_LOAD_ERROR;
    var line = stashed ? parseInt(stashed.line, 10) : 0;
    var hint = line > 0
      ? "<p>De browser stopte met lezen rond <strong>regel " + line +
        "</strong> van <code>content.js</code> — de fout staat meestal op die " +
        "regel, of op de regel er vlak boven.</p>"
      : "";

    /* Two audiences, two languages, on purpose. The heading is for whoever
       happens to be looking at a broken live site — a producer, in English,
       like the rest of the page. Everything under it is instructions only
       Rienk can act on, so it matches his Dutch editor and README. */
    var panel = document.createElement("div");
    panel.className = "content-error";
    panel.innerHTML =
      "<div>" +
      "<h1>This page didn&rsquo;t load</h1>" +
      "<p lang=\"en\">Something is wrong with the site&rsquo;s content file. " +
      "It should be back shortly.</p>" +
      "<hr>" +
      "<p lang=\"nl\"><strong>Rienk:</strong></p>" +
      introHtml +
      hint +
      "<p lang=\"nl\">Cmd+Z in <code>content.js</code>, opslaan, en deze pagina " +
      "verversen — dan staat alles weer zoals het was. Of open " +
      "<code>editor.html</code> en sla daar opnieuw op.</p>" +
      "</div>";

    var main = document.querySelector("main");
    if (main && main.parentNode) {
      main.hidden = true;
      main.parentNode.insertBefore(panel, main);
    } else {
      document.body.appendChild(panel);
    }
  }

  /* ---------- live preview, for editor.html only ----------

     editor.html shows this page in a frame while Rienk types, so he can
     see a change before he saves it. It cannot simply hand us the new
     content: opened from the hard drive every file is its own origin, so
     the editor may not touch this document at all (measured — Chrome
     blocks it), and window.name is wiped on every navigation (measured —
     the frame got null). What does survive a navigation is the page's OWN
     address, so the editor writes the content into the fragment and we
     read it back out of our own location.hash.

     The gate is the point, not a formality. On the published site the
     fragment is never read — the page has to be inside a frame AND be
     served from the hard drive or from localhost. Without that, anyone
     could pass around a link that frames rienkspeelman.nl with a hash of
     their own making and have it show work and words that aren't his.

     Anything unreadable in the fragment falls straight through to
     content.js. A half-written payload must never reach the error
     screen — that screen is for a broken content.js, and this isn't one. */
  function previewContent() {
    if (window.top === window.self) return null; /* not framed → not a preview */
    var host = window.location.hostname;
    if (window.location.protocol !== "file:" &&
        host !== "localhost" && host !== "127.0.0.1") return null;

    var hash = window.location.hash || "";
    var payload = /[#&]preview=([^&]*)/.exec(hash);
    if (!payload) return null;

    var parsed;
    try {
      parsed = JSON.parse(decodeURIComponent(payload[1]));
    } catch (err) {
      return null; /* truncated, mangled, or not JSON at all */
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;

    /* The editor also names the section he is working in. Hand that slug
       to the browser once the page exists and it does the scrolling
       itself — same behaviour as clicking a nav link, header offset and
       all. replace() so a session of typing doesn't fill up the back
       button, and only if the section actually rendered. */
    var at = /[#&]at=([\w-]+)/.exec(hash);
    if (at) {
      window.setTimeout(function () {
        if (document.getElementById(at[1])) window.location.replace("#" + at[1]);
      }, 0);
    }
    return parsed;
  }

  var content = previewContent() || window.SITE_CONTENT;

  if (!content || typeof content !== "object") {
    renderError(
      "<p lang=\"nl\">De site kon <code>content.js</code> niet lezen. Meestal is " +
      "er een aanhalingsteken <code>\"</code> of een komma <code>,</code> " +
      "weggevallen, of staat er een krulletje <code>“ ”</code> waar een recht " +
      "teken <code>\"</code> hoort (TextEdit → Instellingen → slimme " +
      "aanhalingstekens uit)."
    );
    return;
  }

  try {

  /* ---------- tiny helpers ---------- */

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $all(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null && text !== "") node.textContent = text;
    return node;
  }

  /* forgiving readers — a single item without [ ] still works, wrong types
     become empty instead of crashing the page */
  function asArray(x) {
    if (x == null) return [];
    return Array.isArray(x) ? x : [x];
  }

  function asText(x) {
    return x == null ? "" : String(x).trim();
  }

  /* a web address typed without its https:// still works: when the value
     carries no scheme but looks like a domain, the scheme is added. Both the
     work items and the social links go through here, so a bare
     "instagram.com/…" is forgiven the same way in either place. */
  function fixScheme(link) {
    if (link && !/^[a-z][a-z0-9+.-]*:/i.test(link) && /^[\w-]+(\.[\w-]+)+/.test(link)) {
      return "https://" + link;
    }
    return link;
  }

  /* The stylesheet drops every transition when the visitor asks for reduced
     motion — so the script must not sit out their duration either. Read at
     the moment it matters, so flipping the OS setting takes effect at once. */
  var motionQuery =
    window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;

  function reducedMotion() {
    return !!(motionQuery && motionQuery.matches);
  }

  /* Accepts every common YouTube link format and returns the 11-char video id:
     watch?v=, youtu.be/, shorts/, embed/, live/, music.youtube.com …
     The (?![\w-]) at the end is a guard, not tidiness: without it a mistyped
     12-character id had its last letter chopped off and played a DIFFERENT
     video, silently. Now it simply isn't a video link, and the card says so. */
  function youtubeId(url) {
    if (typeof url !== "string") return null;
    var match = url.match(
      /(?:youtube\.com\/(?:watch\?(?:[^#]*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})(?![\w-])/
    );
    return match ? match[1] : null;
  }

  /* Start time from a YouTube link: ?t=371, ?t=1m30s, ?start=90 … → seconds */
  function youtubeStart(url) {
    if (typeof url !== "string") return 0;
    var match = url.match(/[?&#](?:t|start)=([0-9hms]+)/);
    if (!match) return 0;
    var value = match[1];
    if (/^\d+$/.test(value)) return parseInt(value, 10);
    var seconds = 0;
    var h = value.match(/(\d+)h/);
    var m = value.match(/(\d+)m/);
    var s = value.match(/(\d+)s/);
    if (h) seconds += parseInt(h[1], 10) * 3600;
    if (m) seconds += parseInt(m[1], 10) * 60;
    if (s) seconds += parseInt(s[1], 10);
    return seconds;
  }

  /* Accepts any open.spotify.com link (playlist / album / artist / track /
     podcast show / episode, with or without /intl-nl/) → embed URL + kind */
  function spotifyInfo(url) {
    if (typeof url !== "string") return null;
    var match = url.match(
      /open\.spotify\.com\/(?:intl-[a-zA-Z-]+\/)?(playlist|album|artist|track|show|episode)\/([A-Za-z0-9]+)/
    );
    if (!match) return null;
    return {
      kind: match[1],
      embedUrl: "https://open.spotify.com/embed/" + match[1] + "/" + match[2] + "?theme=0",
    };
  }

  /* --- YouTube IFrame API, loaded lazily on the first play click. It lets
     the site restore the calm thumbnail when a video is paused or finished,
     instead of leaving YouTube's cluttered player chrome on screen. If the
     script fails to load, videos simply behave like plain embeds. --- */

  var ytApiCallbacks = [];
  var ytApiRequested = false;

  function withYouTubeApi(callback) {
    if (window.YT && window.YT.Player) {
      callback(window.YT);
      return;
    }
    ytApiCallbacks.push(callback);
    if (ytApiRequested) return;
    ytApiRequested = true;
    window.onYouTubeIframeAPIReady = function () {
      var callbacks = ytApiCallbacks;
      ytApiCallbacks = [];
      callbacks.forEach(function (cb) {
        try { cb(window.YT); } catch (err) {
          if (window.console && console.error) console.error(err);
        }
      });
    };
    var script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    document.head.appendChild(script);
  }

  function svgIcon(label) {
    /* one generic + a few recognisable social icons, all inline so the site
       has zero external image dependencies */
    var icons = {
      instagram:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.3" cy="6.7" r="1.2" fill="currentColor" stroke="none"/></svg>',
      spotify:
        '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm4.6 14.5a.7.7 0 0 1-1 .2c-2.6-1.6-5.9-2-9.8-1.1a.7.7 0 1 1-.3-1.4c4.2-1 7.9-.5 10.8 1.3.3.2.4.7.3 1Zm1.2-2.9a.9.9 0 0 1-1.2.3c-3-1.8-7.5-2.4-11-1.3a.9.9 0 1 1-.5-1.7c4-1.2 9-.6 12.4 1.5.4.2.5.8.3 1.2Zm.1-3a1 1 0 0 1-1.4.4C13.1 9 8 8.8 4.9 9.8a1 1 0 1 1-.6-2c3.5-1.1 9.2-.9 13.2 1.4.5.3.7.9.4 1.4Z"/></svg>',
      youtube:
        '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21.6 7.2a2.5 2.5 0 0 0-1.7-1.8C18.2 5 12 5 12 5s-6.2 0-7.9.4A2.5 2.5 0 0 0 2.4 7.2 26.4 26.4 0 0 0 2 12c0 1.6.1 3.2.4 4.8a2.5 2.5 0 0 0 1.7 1.8c1.7.4 7.9.4 7.9.4s6.2 0 7.9-.4a2.5 2.5 0 0 0 1.7-1.8c.3-1.6.4-3.2.4-4.8 0-1.6-.1-3.2-.4-4.8ZM10 15.2V8.8L15.5 12 10 15.2Z"/></svg>',
      soundcloud:
        '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.5 10.2h-.4a5.6 5.6 0 0 0-5.5-4.7c-.7 0-1.4.1-2 .4v10.6h7.9a3.2 3.2 0 0 0 0-6.3ZM9.4 6.9h-1v9.6h1V6.9ZM7.2 8.5h-1v8h1v-8ZM5 9.8H4v6.7h1V9.8ZM2.8 11H1.9v4.3h.9V11Z"/></svg>',
      tiktok:
        '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.6 3c.4 2 1.7 3.4 3.9 3.6v2.7c-1.5 0-2.8-.4-3.9-1.2v6.3a5.6 5.6 0 1 1-5.6-5.6c.3 0 .6 0 .9.1v2.8a2.8 2.8 0 1 0 1.9 2.7V3h2.8Z"/></svg>',
      generic:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5"/><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7L12.5 18.5"/></svg>',
    };
    var key = String(label || "").toLowerCase().replace(/[^a-z]/g, "");
    return icons[key] || icons.generic;
  }

  /* ---------- fill simple text slots ---------- */

  var name = asText(content.name) || "RIENK SPEELMAN";
  var fullName = asText(content.fullName) || name;

  $all('[data-content="name"]').forEach(function (node) {
    node.textContent = name;
  });

  /* --- the hero name is MEASURED and scaled to span the page column ---
     It is display type, so it should reach both gutters exactly like the
     tagline and the categories under it. Guessing a size from the number of
     characters always left a ragged margin on one side, so the name is
     measured once at whatever size it currently has and scaled from there.
     The first fit runs further down, once the category list is rendered
     (the hero's vertical budget depends on it), and again whenever the
     window resizes or the web font finishes loading. */

  var heroName = $(".hero-name");
  var heroBox = $(".hero");
  var heroSub = $(".hero-sub");

  /* below this the name stops reading as a hero — a name that long is
     allowed to wrap instead, the way the plain CSS size used to */
  var HERO_MIN_SIZE = 48; /* px ≈ 3rem */

  function heroTextWidth() {
    /* a Range measures the text itself: no extra node, and sub-pixel
       accurate. scrollWidth (whole pixels) covers older browsers. */
    if (document.createRange) {
      try {
        var range = document.createRange();
        range.selectNodeContents(heroName);
        var width = range.getBoundingClientRect().width;
        if (width) return width;
      } catch (err) { /* fall through to scrollWidth */ }
    }
    return heroName.scrollWidth;
  }

  function fitHeroName() {
    if (!heroName) return;

    /* read everything first, write after — one reflow per fit */
    var style = window.getComputedStyle(heroName);
    var current = parseFloat(style.fontSize);
    var lineHeight = parseFloat(style.lineHeight); /* px, or the bare ratio */
    var available = heroName.clientWidth; /* = the hero's own content box */
    var room = 0; /* vertical space one line of the name may take */

    if (heroBox) {
      var boxStyle = window.getComputedStyle(heroBox);
      var boxHeight = heroBox.clientHeight;
      /* while the hero sits at its min-height these are the same number; if
         an earlier fit made it taller, measure against the min-height so the
         next fit shrinks back instead of chasing its own overflow */
      var minHeight = parseFloat(boxStyle.minHeight);
      if (minHeight > 0 && minHeight < boxHeight) boxHeight = minHeight;
      room = boxHeight -
        parseFloat(boxStyle.paddingTop) - parseFloat(boxStyle.paddingBottom);
      if (heroSub) {
        room -= heroSub.offsetHeight +
          (parseFloat(window.getComputedStyle(heroSub).marginTop) || 0);
      }
    }

    if (!current || !available) return;
    /* browsers report line-height either resolved to px or as the bare
       number; "normal" parses to NaN and gets Bebas's rough ratio */
    var lineRatio = lineHeight > 4 ? lineHeight / current
      : (lineHeight > 0 ? lineHeight : 1.2);

    /* measure the name as one unbroken line, at its current size */
    heroName.style.whiteSpace = "nowrap";
    var textWidth = heroTextWidth();
    if (!textWidth) {
      heroName.style.whiteSpace = "";
      return;
    }

    /* 0.2% of slack: a sub-pixel rounding must never push the last letter
       past the gutter, and the page into sideways scrolling */
    var size = current * (available * 0.998) / textWidth;
    /* and never so tall that the line crowds the tagline out of the hero */
    if (room > 0) size = Math.min(size, room / lineRatio);
    if (size < HERO_MIN_SIZE) size = HERO_MIN_SIZE;

    /* a name so long that even the floor overflows the column wraps */
    heroName.style.whiteSpace =
      textWidth * (size / current) <= available ? "nowrap" : "";
    heroName.style.fontSize = size + "px";
  }

  var taglineNode = $('[data-content="tagline"]');
  if (taglineNode) taglineNode.textContent = asText(content.tagline);

  /* "I'M RIENK" — just the first word of the name, so the statement stays
     short however the full name is written */
  $all('[data-content="firstname"]').forEach(function (node) {
    node.textContent = name.split(" ")[0];
  });

  var aboutNode = $('[data-content="about"]');
  if (aboutNode) aboutNode.textContent = asText(content.about);

  /* the About portrait — only appears once the photo actually loads, so a
     missing/renamed file just leaves the text-only layout.
     No loading="lazy": the wrapper starts hidden, and a lazy image inside
     display:none never loads — which would keep it hidden forever. */
  var aboutPhotoWrap = $('[data-slot="about-photo"]');
  var photoPath = asText(content.photo);
  if (aboutPhotoWrap && photoPath) {
    var portrait = el("img");
    portrait.alt = fullName;
    portrait.onload = function () {
      aboutPhotoWrap.hidden = false;
    };
    portrait.onerror = function () {
      aboutPhotoWrap.hidden = true;
    };
    portrait.src = photoPath;
    aboutPhotoWrap.appendChild(portrait);
  }


  var copyrightNode = $('[data-content="copyright"]');
  if (copyrightNode) {
    copyrightNode.textContent =
      "© " + new Date().getFullYear() + " " + fullName + " — all rights reserved";
  }

  /* the browser-tab title stays as hand-written in index.html — taglines
     like "COMPOSER & PRODUCER OF MUSIC FOR" are sentence fragments that the
     hero completes visually with the category list, so they make bad titles */

  /* ---------- socials (header, mobile menu, contact) ---------- */

  /* url: is the documented key, but link: and href: are read too — the rest
     of content.js says "link:", so typing it here is the obvious slip — and
     the address goes through the same scheme repair the work items get. An
     entry with no usable address used to disappear without a word, which
     looks exactly like a social he simply hasn't filled in yet; now it says
     so in the console. */
  var socials = [];
  asArray(content.socials).forEach(function (s) {
    var url = s && typeof s === "object"
      ? fixScheme(asText(s.url) || asText(s.link) || asText(s.href))
      : "";
    if (url) {
      socials.push({ label: s.label, url: url });
    } else if (window.console && console.warn) {
      console.warn(
        "content.js: a social link has no web address, so it was skipped. " +
        'It needs a line like  url: "https://instagram.com/rienk.music"', s
      );
    }
  });

  function renderSocialIcons(slot) {
    var node = $('[data-slot="' + slot + '"]');
    if (!node) return;
    socials.forEach(function (s) {
      var a = el("a");
      a.href = s.url;
      a.target = "_blank";
      a.rel = "noopener";
      a.setAttribute("aria-label", asText(s.label) || "Social link");
      a.innerHTML = svgIcon(s.label);
      node.appendChild(a);
    });
  }

  renderSocialIcons("header-socials");

  var contactSocials = $('[data-slot="contact-socials"]');
  if (contactSocials) {
    socials.forEach(function (s) {
      var a = el("a", null, asText(s.label) || s.url);
      a.href = s.url;
      a.target = "_blank";
      a.rel = "noopener";
      contactSocials.appendChild(a);
    });
  }

  /* contact button: mailto when an email is set, else first social link */

  var contactButton = $('[data-slot="contact-button"]');
  if (contactButton) {
    var email = asText(content.email);
    if (email && email.indexOf("@") > 0 && email.indexOf("example") === -1) {
      contactButton.href = "mailto:" + email;
      contactButton.textContent = "EMAIL ME";
    } else if (socials.length) {
      contactButton.href = socials[0].url;
      contactButton.target = "_blank";
      contactButton.rel = "noopener";
      contactButton.textContent =
        "MESSAGE ME ON " + (asText(socials[0].label) || "SOCIALS").toUpperCase();
    } else {
      contactButton.hidden = true;
    }
  }

  /* ---------- sections ---------- */

  /* normalise: item.link, with youtube:/spotify:/url: accepted as synonyms;
     a bare domain without https:// gets the scheme added so it still works */
  function itemLink(item) {
    return fixScheme(
      asText(item.link) || asText(item.youtube) || asText(item.spotify) || asText(item.url)
    );
  }

  function slugify(text, used) {
    var slug = asText(text).toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "section";
    var candidate = slug;
    var n = 2;
    while (used[candidate]) {
      candidate = slug + "-" + n;
      n += 1;
    }
    used[candidate] = true;
    return candidate;
  }

  /* --- card builders — every item becomes one .work-card --- */

  function buildYoutubeCard(card, item, id, link) {
    card.classList.add("is-action"); /* hover: soft blur + the action pops */
    var start = youtubeStart(link);

    /* YouTube's embedded player requires an HTTP Referer header (it shows
       "Error 153" without one). A page opened straight from the hard drive
       (file://) can never send one, so in that case the card opens the
       video on YouTube in a new tab instead of embedding it. */
    var cannotEmbed = window.location.protocol === "file:";

    var button;
    if (cannotEmbed) {
      button = el("a", "video-thumb");
      button.href = link;
      button.target = "_blank";
      button.rel = "noopener";
      button.setAttribute("aria-label",
        "Watch on YouTube: " + (asText(item.title) || "video") + " (opens in a new tab)");
    } else {
      button = el("button", "video-thumb");
      button.type = "button";
      button.setAttribute("aria-label", "Play video: " + (asText(item.title) || "YouTube video"));
    }

    /* thumbnail: the owner's own picture first when the item has an image:
       (a clean still beats YouTube's, which often carries baked-in titles
       or a frozen frame), then webp (smallest) → jpg → guaranteed hqdefault;
       a missing file simply falls through to YouTube's pictures */
    var img = el("img");
    img.alt = "";
    img.loading = "lazy";
    var ownStill = asText(item.image);
    var sources = ownStill ? [ownStill] : [];
    var firstYouTube = sources.length;
    sources.push(
      "https://i.ytimg.com/vi_webp/" + id + "/maxresdefault.webp",
      "https://i.ytimg.com/vi/" + id + "/maxresdefault.jpg",
      "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg"
    );
    var sourceIndex = 0;
    function nextSource() {
      sourceIndex += 1;
      if (sourceIndex < sources.length) img.src = sources[sourceIndex];
    }
    img.onerror = nextSource;
    img.onload = function () {
      /* YouTube serves a tiny grey placeholder when maxres doesn't exist, so
         anything under 320px wide moves on — but only for YouTube's own
         pictures: a small file the owner chose must never vanish silently */
      if (sourceIndex >= firstYouTube &&
          img.naturalWidth < 320 && sourceIndex < sources.length - 1) {
        nextSource();
      }
    };
    img.src = sources[0];

    var badge = el("span", "play-badge");
    badge.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3.5v17l14-8.5z"/></svg>';

    button.appendChild(img);
    button.appendChild(badge);
    if (!cannotEmbed) {
      /* where to resume when the thumbnail comes back after a pause */
      var resumeAt = start;

      button.addEventListener("click", function () {
        var frame = el("div", "video-frame");
        var iframe = document.createElement("iframe");
        /* playsinline=1 or an iPhone takes the whole screen for every card:
           the API defaults it to 0, and a video that hijacks the display is
           not what a card on a portfolio page should do */
        iframe.src =
          "https://www.youtube-nocookie.com/embed/" + id +
          "?autoplay=1&rel=0&playsinline=1&enablejsapi=1&origin=" +
          encodeURIComponent(window.location.origin) +
          (resumeAt ? "&start=" + Math.floor(resumeAt) : "");
        iframe.title = asText(item.title) || "YouTube video";
        /* no picture-in-picture: pausing a PiP window would tear the player
           down (and close the window) — the two features are incompatible */
        iframe.allow =
          "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; web-share";
        iframe.allowFullscreen = true;
        /* the player refuses to work without referrer information — make the
           policy explicit so privacy setups that strip it don't break playback */
        iframe.referrerPolicy = "strict-origin-when-cross-origin";
        frame.appendChild(iframe);
        /* the player fades UP over the thumbnail, mirroring the dissolve
           that hands the card back — the same double frame as below, so the
           browser paints the hidden state before the transition starts */
        var fadeIn = !reducedMotion();
        if (fadeIn) frame.classList.add("is-entering");
        card.replaceChild(frame, button);
        iframe.focus();
        if (fadeIn) {
          requestAnimationFrame(function () {
            requestAnimationFrame(function () {
              frame.classList.remove("is-entering");
            });
          });
        }

        /* paused or finished → bring the calm thumbnail back (the video
           resumes from the same spot on the next click). The delay ignores
           the "paused" blips of seeking, and the restore politely backs off
           while the viewer is scrubbing, in fullscreen, or still inside the
           player. */
        withYouTubeApi(function (YT) {
          if (!frame.parentNode) return; /* card already reverted */
          /* how long a PAUSED video may rest before the thumbnail returns.
             This was a second and a half, which took the player away from
             anyone who paused to think or to take a note — and made
             YouTube's own captions, settings and speed menus unusable a
             moment after every pause. Twenty seconds reads as "they moved
             on", not "they stopped for a second". A FINISHED video still
             hands the card back at once, further down. */
          var RESTORE_DELAY = 20000;
          /* the "not now" answers below are a wait, not a decision, so they
             look again on the short beat the whole thing used to run on */
          var RECHECK_DELAY = 1500;
          var pauseTimer = null;
          var pausedAtTime = 0;
          /* the polite "not now" answers are a wait, not a veto. Without a
             deadline the focus check below never lets go: clicking a
             cross-origin player to pause leaves focus INSIDE the iframe, so
             the restore re-armed every 1.5s for as long as the tab lived and
             the thumbnail never came back at all. */
          var restoreDeadline = 0;

          function playerTime() {
            try { return player.getCurrentTime() || 0; } catch (err) { return 0; }
          }

          function inFullscreen() {
            return !!(document.fullscreenElement || document.webkitFullscreenElement);
          }

          function attemptRestore() {
            pauseTimer = null;
            /* fullscreen pause: leave the player alone; check again shortly
               so the thumbnail still returns after fullscreen is exited */
            if (inFullscreen()) {
              pauseTimer = setTimeout(attemptRestore, RECHECK_DELAY);
              return;
            }
            /* focus is still inside the player → the viewer is probably using
               it (they paused from its own controls). Give them room, but
               only until the deadline: focus stays in the iframe after any
               click in it, so an unbounded wait means the thumbnail never
               returns. This is also the ONLY guard iPhone has: its native
               video fullscreen sets no document.fullscreenElement, so the
               check above is blind there and this one is what keeps a viewer
               from being ejected mid-video. */
            if (document.activeElement === iframe && Date.now() < restoreDeadline) {
              pauseTimer = setTimeout(attemptRestore, RECHECK_DELAY);
              return;
            }
            /* time moved since the pause began → the viewer is scrubbing;
               give the gesture another beat instead of yanking the player */
            var now = playerTime();
            if (Math.abs(now - pausedAtTime) > 0.3) {
              pausedAtTime = now;
              pauseTimer = setTimeout(attemptRestore, RECHECK_DELAY);
              return;
            }
            resumeAt = Math.max(0, Math.floor(now));
            restoreThumbnail();
          }

          var player = new YT.Player(iframe, {
            events: {
              onStateChange: function (event) {
                if (pauseTimer) {
                  clearTimeout(pauseTimer);
                  pauseTimer = null;
                }
                if (event.data === YT.PlayerState.PAUSED) {
                  pausedAtTime = playerTime();
                  /* a fresh pause restarts the grace period, so a viewer who
                     keeps using the player keeps it */
                  restoreDeadline = Date.now() + RESTORE_DELAY * 2;
                  pauseTimer = setTimeout(attemptRestore, RESTORE_DELAY);
                } else if (event.data === YT.PlayerState.ENDED) {
                  resumeAt = 0;
                  restoreThumbnail();
                } else {
                  /* playing again mid-dissolve → call the whole thing off */
                  cancelRestore();
                }
              },
            },
          });

          /* the swap is a soft dissolve: the player fades out, then the
             thumbnail fades back in (both cards sit on black, so it reads
             as a gentle dip rather than a hard cut). With reduced motion
             there is no fade to wait for — waiting anyway would leave the
             card blank for a third of a second on every pause.
             350 is the fade the stylesheet actually runs: `.video-frame`
             in css/style.css carries `transition: opacity 0.35s`. The two
             numbers are one number — change either and change both. */
          var FADE_OUT = 350;
          var swapTimer = null;

          function cancelRestore() {
            if (swapTimer) {
              clearTimeout(swapTimer);
              swapTimer = null;
            }
            frame.classList.remove("is-leaving");
          }

          function restoreThumbnail() {
            if (swapTimer) return; /* already dissolving */
            var softSwap = !reducedMotion();
            if (softSwap) frame.classList.add("is-leaving");
            swapTimer = setTimeout(function () {
              swapTimer = null;
              /* only hand focus back if the player actually had it — never
                 steal focus from something else the viewer moved on to */
              var hadFocus = document.activeElement === iframe;
              /* destroy() throws if the API has already let go of this
                 player (the iframe was navigated away, the API script was
                 blocked halfway). Either way it is gone, which is exactly
                 what this line wanted — so there is nothing to report. */
              try { player.destroy(); } catch (err) { /* already gone */ }
              if (frame.parentNode === card) {
                if (softSwap) button.classList.add("is-returning");
                card.replaceChild(button, frame);
                /* two frames so the browser paints the hidden state first,
                   otherwise there is nothing to transition from */
                if (softSwap) {
                  requestAnimationFrame(function () {
                    requestAnimationFrame(function () {
                      button.classList.remove("is-returning");
                    });
                  });
                }
                if (hadFocus) button.focus({ preventScroll: true });
              } else if (frame.parentNode) {
                frame.parentNode.removeChild(frame);
              }
            }, softSwap ? FADE_OUT : 0);
          }
        });
      });
    }
    card.appendChild(button);
    appendMeta(card, item, false, true);
  }

  /* --- Spotify players wait until their card comes near ---
     Every embed is roughly half a megabyte of somebody else's JavaScript, and
     all of them sit thousands of pixels down the page — yet Chromium ignores
     loading="lazy" on an iframe, so they were fetched alongside the
     stylesheet, ahead of the fonts and every picture. They now start with no
     address at all (the box keeps its full height, so nothing on the page
     moves) and are handed one by the reveal observer at the bottom of this
     file, the same one that fades the cards in. */
  var lazyFrames = [];

  function loadLazyFrames(root) {
    if (!lazyFrames.length) return;
    lazyFrames = lazyFrames.filter(function (frame) {
      /* no root given = load every one of them, which is what a browser
         without IntersectionObserver gets */
      if (root && root !== frame && !root.contains(frame)) return true;
      frame.src = frame.getAttribute("data-src");
      frame.removeAttribute("data-src");
      return false;
    });
  }

  function buildSpotifyCard(card, item, spotify) {
    var iframe = document.createElement("iframe");
    /* the address rests in data-src until loadLazyFrames() hands it over */
    iframe.setAttribute("data-src", spotify.embedUrl);
    lazyFrames.push(iframe);
    iframe.title = "Spotify player" + (asText(item.title) ? ": " + asText(item.title) : "");
    iframe.loading = "lazy";
    iframe.allow =
      "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";
    var wrap = el("div", "spotify-embed spotify-" + spotify.kind);
    wrap.appendChild(iframe);
    card.appendChild(wrap);
    /* a Spotify player is Spotify's own box — there is no picture of ours to
       lay a description over, so the field is quietly ignored here */
    appendMeta(card, item, false, false);
  }

  /* a picture card (or the name set in big letters when there's no picture).
     With a link it is an <a> that blurs on hover and carries the ↗ badge;
     without one it is a plain <div> — nothing to click, so nothing is
     promised and no dead anchor is left behind. That link-less shape is what
     a work with no link: and no roll: true renders as. */
  function buildBannerCard(card, item, link) {
    var hasImage = !!asText(item.image);
    var external = !!link;
    var shell = external ? el("a", "banner") : el("div", "banner");
    if (external) {
      shell.href = link;
      shell.target = "_blank";
      shell.rel = "noopener";
      shell.setAttribute("aria-label",
        (asText(item.title) || "Visit page") + " (opens in a new tab)");
    }

    function makeTextBanner() {
      /* text banners carry their info on the card itself — no hover effect */
      card.classList.remove("is-action");
      shell.classList.add("banner-generated");
      shell.textContent = "";
      /* h3 so every card, banner or video, appears in heading navigation */
      var inner = el("h3", "banner-title",
        asText(item.title) || asText(item.subtitle) || "—");
      if (external) {
        var mark = el("span", "external-mark", " ↗");
        mark.setAttribute("aria-hidden", "true");
        inner.appendChild(mark);
      }
      shell.appendChild(inner);
      /* if the image broke after the meta was rendered, drop the now-duplicate
         title below the banner */
      var duplicate = card.querySelector(".work-title");
      if (duplicate) {
        var metaWrap = duplicate.parentNode;
        duplicate.parentNode.removeChild(duplicate);
        if (metaWrap && !metaWrap.childNodes.length) {
          metaWrap.parentNode.removeChild(metaWrap);
        }
      }
    }

    if (hasImage) {
      var img = el("img");
      img.src = asText(item.image);
      /* the name is printed right underneath either way, and a linked banner
         already carries it in the link's own label — a third copy in the alt
         made a screen reader say the title three times per card */
      img.alt = "";
      img.loading = "lazy";
      /* image missing/broken → fall back to the generated text banner */
      img.onerror = makeTextBanner;
      shell.appendChild(img);
      if (external) {
        /* linked banners blur on hover and carry an accent ↗ badge */
        card.classList.add("is-action");
        var visit = el("span", "visit-badge");
        visit.innerHTML =
          '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>';
        shell.appendChild(visit);
      }
    } else {
      makeTextBanner();
    }

    card.appendChild(shell);
    /* generated banners already show the title inside — only repeat it
       below when there's a real image */
    appendMeta(card, item, !hasImage, true);
  }

  /* the caption below a card: title + subtitle + the optional description.
     Link indicators live on the image itself (the ↗ visit badge), not in
     the caption.
     The description is ONE node and it always belongs to the caption — the
     stylesheet is what lifts it onto the picture on cards that can be
     hovered. So the words a mouse reveals are the same words a screen
     reader, a search engine and a copy-paste get, written once, with no
     aria-hidden bookkeeping. `allowDescription` is false where a card has
     nowhere to put it (a Spotify player, an error card). */
  function appendMeta(card, item, skipTitle, allowDescription) {
    var meta = el("div", "work-meta");
    var title = asText(item.title);
    var subtitle = asText(item.subtitle);
    /* desc: works as a shorthand; nothing typed = no node at all, so an
       item without a description renders exactly as it always did */
    var description = allowDescription
      ? asText(item.description) || asText(item.desc)
      : "";
    if (title && !skipTitle) {
      meta.appendChild(el("h3", "work-title", title));
    }
    if (subtitle) meta.appendChild(el("p", "work-subtitle", subtitle));
    if (description) meta.appendChild(el("p", "work-desc", description));
    if (meta.childNodes.length) card.appendChild(meta);
  }

  function buildCard(item) {
    if (typeof item === "string") item = { link: item };
    if (!item || typeof item !== "object") return null;

    var card = el("article", "work-card");
    var link = itemLink(item);
    var id = youtubeId(link);
    var spotify = spotifyInfo(link);

    /* links that were clearly MEANT to be a specific video/track but are
       malformed get a helpful error card; everything else that's a URL
       falls through to a clickable banner (channels, playlists, profiles …) */
    var brokenVideoLink =
      !id && /youtu\.be\/|youtube\.com\/(?:watch|shorts\/|embed\/|live\/)/.test(link);
    var shortSpotifyLink = /spotify\.link\//.test(link);

    if (id) {
      buildYoutubeCard(card, item, id, link);
    } else if (spotify) {
      buildSpotifyCard(card, item, spotify);
    } else if (shortSpotifyLink) {
      var err = el("div", "card-error");
      err.textContent =
        "That’s a shortened Spotify link — open it once in your browser, then " +
        "copy the open.spotify.com address from the address bar into content.js.";
      card.appendChild(err);
      appendMeta(card, item, false, false);
    } else if (brokenVideoLink) {
      var err2 = el("div", "card-error");
      err2.textContent =
        "This YouTube link doesn’t look like a video link — check it in content.js: “" +
        link.slice(0, 60) + "”";
      card.appendChild(err2);
      appendMeta(card, item, false, false);
    } else if (link || asText(item.title) || asText(item.image) || asText(item.subtitle)) {
      buildBannerCard(card, item, link);
    } else {
      return null; /* completely empty block — skip quietly */
    }

    return card;
  }

  /* --- render all sections + build navigation from them --- */

  var sectionsWrap = $('[data-slot="sections"]');
  var categoriesList = $('[data-slot="categories"]');
  var mobileNav = $('[data-slot="mobile-nav"]');

  /* how an item wants to be featured: "left", "right", "center", or ""
     (normal card). Forgiving: featured: true and unknown words mean "right". */
  function featureMode(item) {
    if (!item || typeof item !== "object") return "";
    var f = item.featured != null ? item.featured : item.feature;
    if (f == null || f === false || f === 0) return "";
    var text = asText(f).toLowerCase();
    if (text === "left" || text === "right" || text === "center") return text;
    if (text === "" || text === "false" || text === "no" || text === "0") return "";
    return "right";
  }

  /* does this work belong in the client roll? An explicit choice by the
     owner — roll: true puts it in the strip, anything else (or no line at
     all) leaves it a full card. Forgiving the same way featureMode() is:
     "yes", "true", even a typo like "yep" all count as yes, because he
     typed SOMETHING and it was to get the work into the roll. */
  function rollMode(item) {
    if (!item || typeof item !== "object") return false;
    var r = item.roll;
    if (r == null || r === false || r === 0) return false;
    if (r === true) return true;
    var text = asText(r).toLowerCase();
    if (text === "" || text === "false" || text === "no" || text === "0") return false;
    return true;
  }

  /* --- the category pills' dotted ring, drawn instead of borrowed ---
     A CSS dotted border lays its dots out per EDGE, so a capsule shows
     ragged gaps where the straights hand over to the curves. Each pill
     instead gets a thin SVG ring whose round dots divide the measured
     perimeter exactly — even spacing all the way around, clean seam. The
     dotted CSS border stays underneath as the no-JS fallback; `has-ring`
     only turns it invisible once the drawn ring is really there. */

  var SVG_NS = "http://www.w3.org/2000/svg";
  var RING_STROKE = 1.6; /* dot size; the inset below is half of it */
  var pillRings = [];

  function addPillRing(a) {
    if (!document.createElementNS) return; /* keep the CSS border */
    var svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("class", "pill-ring");
    svg.setAttribute("aria-hidden", "true");
    var ring = document.createElementNS(SVG_NS, "rect");
    svg.appendChild(ring);
    a.appendChild(svg);
    pillRings.push({ a: a, svg: svg, ring: ring });
  }

  function updatePillRings() {
    pillRings.forEach(function (pill) {
      /* measured on the SVG itself, not on the pill: the ring is drawn in
         this box's own coordinates, so anything derived from the pill's
         size has to guess how the browser rounded the 1.5px border and
         lands half a pixel out */
      var box = pill.svg.getBoundingClientRect();
      var w = box.width;
      var h = box.height;
      if (!w || !h) return; /* not laid out yet — the CSS border carries on */
      var inset = RING_STROKE / 2;
      var innerW = w - RING_STROKE;
      var innerH = h - RING_STROKE;
      pill.ring.setAttribute("x", inset);
      pill.ring.setAttribute("y", inset);
      pill.ring.setAttribute("width", innerW);
      pill.ring.setAttribute("height", innerH);
      pill.ring.setAttribute("rx", innerH / 2);
      /* a capsule's perimeter is exact math — two straights plus a circle —
         so the dot count can divide it exactly and the seam disappears */
      var perimeter = 2 * (innerW - innerH) + Math.PI * innerH;
      var gap = perimeter / Math.max(8, Math.round(perimeter / 4.6));
      pill.ring.setAttribute("stroke-dasharray", "0 " + gap.toFixed(3));
      pill.a.classList.add("has-ring");
    });
  }

  /* a client-roll entry: a small picture (or the name set in display type
     when there's none) with the work's name and kind underneath. A work in
     the roll may still have a link — then the whole little tile becomes one
     quiet link with a small ↗ after its name. Deliberately no accent badge
     disc here: the roll is a strip of credits, not a second wall of
     buttons. */
  function buildClientTile(item) {
    if (typeof item === "string") item = { title: item };
    var title = asText(item.title);
    var image = asText(item.image);
    if (!title && !image) return null;

    var tile = el("div", "client");
    var link = itemLink(item);
    /* everything hangs off `body`: the tile itself, or the link wrapping
       all of it — picture, name and kind — when there is a link */
    var body = tile;
    if (link) {
      var anchor = el("a", "client-link");
      anchor.href = link;
      anchor.target = "_blank";
      anchor.rel = "noopener";
      tile.appendChild(anchor);
      body = anchor;
    }

    var shot = el("div", "client-shot");

    function useName() {
      shot.classList.add("client-shot-text");
      shot.textContent = "";
      shot.appendChild(el("span", "client-name", title || "—"));
    }

    if (image) {
      var img = el("img");
      img.alt = "";
      img.loading = "lazy";
      img.onerror = useName; /* missing picture → the name carries the tile */
      img.src = image;
      shot.appendChild(img);
    } else {
      useName();
    }
    body.appendChild(shot);

    if (title) {
      var heading = el("h3", "client-title", title);
      if (link) {
        /* the same little arrow a linked banner wears — decoration, so
           heading navigation still reads the plain name */
        var mark = el("span", "external-mark", " ↗");
        mark.setAttribute("aria-hidden", "true");
        heading.appendChild(mark);
      }
      body.appendChild(heading);
    }
    var label = asText(item.subtitle);
    if (label) body.appendChild(el("p", "client-label", label));
    /* said once, for screen readers only — the arrow is decoration, and an
       aria-label here would swallow the kind-of-work line above */
    if (link) {
      body.appendChild(el("span", "visually-hidden", " (opens in a new tab)"));
      /* a picture-only tile renders no text at all — without this the
         link's accessible name would be just "(opens in a new tab)" */
      if (!title && !label) {
        body.setAttribute("aria-label", "Visit page (opens in a new tab)");
      }
    }
    return tile;
  }

  /* --- a roll with more than four works starts sliding sideways ---
     A fifth tile would open a second row, and two rows of pictures are the
     wall of imagery this quiet strip exists to avoid. The stylesheet sizes
     the tiles so the next one already peeks in from the right — that sliver
     is the scroll cue; the two triangle buttons are the backup, and the
     rail is focusable so the arrow keys work too. Four or fewer tiles are
     left exactly as they were built: same DOM, same grid, same everything. */

  /* the same four as `--roll-across` on `.client-roll.client-roll-scroll`
     in css/style.css, which is how many whole tiles the sliding rail shows.
     Keep them equal: raise this and some rolls would never start sliding
     even though their tiles no longer fit; lower it and a roll would slide
     with room to spare. (The phone override there drops to two across, but
     that is only how many are VISIBLE — five tiles is still what starts it.) */
  var ROLL_MAX = 4;
  var rollUpdaters = []; /* one per sliding roll, run once the page is built */

  function makeRollArrow(direction) {
    var back = direction === "prev";
    var button = el("button", "roll-arrow roll-arrow-" + direction);
    button.type = "button";
    button.setAttribute("aria-label", back ? "Scroll left" : "Scroll right");
    /* the play badge's triangle, turned to point the way it scrolls */
    button.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' +
      (back ? "M18 3.5v17l-14-8.5z" : "M6 3.5v17l14-8.5z") +
      '"/></svg>';
    return button;
  }

  function makeRollScrollable(roll, label) {
    var tiles = $all(".client", roll);
    if (tiles.length <= ROLL_MAX) return; /* one row is plenty — leave it be */

    var rail = el("div", "client-rail");
    rail.tabIndex = 0; /* a hidden scrollbar still has to work from a keyboard */
    rail.setAttribute("role", "region");
    rail.setAttribute("aria-label", label + " — more work, scroll sideways");
    tiles.forEach(function (tile) {
      rail.appendChild(tile);
    });

    var prev = makeRollArrow("prev");
    var next = makeRollArrow("next");
    prev.hidden = true; /* the rail starts at its left end */

    roll.classList.add("client-roll-scroll");
    roll.appendChild(rail);
    roll.appendChild(prev);
    roll.appendChild(next);

    /* one press moves a screenful minus a tile, so the picture you were
       looking at stays on screen as your bearing */
    function pageStep() {
      var first = rail.firstElementChild;
      var step = rail.clientWidth - (first ? first.offsetWidth : 0);
      return step > 40 ? step : rail.clientWidth;
    }

    function scrollRail(amount) {
      /* feature-detect the smooth form: a browser without it wouldn't throw,
         it would coerce the options object to NaN and quietly do nothing */
      if ("scrollBehavior" in document.documentElement.style && !reducedMotion()) {
        var before = rail.scrollLeft;
        rail.scrollBy({ left: amount, behavior: "smooth" });
        /* some embedded viewers advertise smooth scrolling but never run
           the animation — if nothing has moved shortly after, just jump.
           120ms is long enough that a real smooth scroll has certainly
           started moving by then, and short enough that the jump still
           reads as an answer to the press rather than a glitch. */
        setTimeout(function () {
          if (rail.scrollLeft === before) rail.scrollLeft = before + amount;
        }, 120);
      } else {
        rail.scrollLeft += amount; /* reduced motion (or old browser): jump */
      }
      /* the scroll listener updates the arrows as the rail moves; this
         late pass is for the odd viewer that swallows scroll events. 500ms
         is comfortably past the end of a smooth scroll of one page, so it
         reads the rail where it came to rest, not mid-flight. */
      setTimeout(update, 500);
    }

    /* each arrow steps aside at its own end of the rail — an arrow that
       can't do anything is worse than no arrow at all */
    function update() {
      var max = rail.scrollWidth - rail.clientWidth;
      var active = document.activeElement;
      prev.hidden = rail.scrollLeft <= 1;
      next.hidden = rail.scrollLeft >= max - 1;
      /* hiding the focused arrow would drop keyboard focus on the floor —
         hand it to the opposite arrow, or the rail when both are gone */
      if (prev.hidden && active === prev) (next.hidden ? rail : next).focus();
      if (next.hidden && active === next) (prev.hidden ? rail : prev).focus();
    }

    prev.addEventListener("click", function () { scrollRail(-pageStep()); });
    next.addEventListener("click", function () { scrollRail(pageStep()); });
    rail.addEventListener("scroll", update, { passive: true });
    rollUpdaters.push(update);
  }

  /* how many columns a row of cards should use so the last row isn't left
     with an empty gap: 2 normally, 3 when that fills the rows better
     (featured cards span the whole row, so they don't count) */
  function bestColumns(count) {
    if (count <= 1) return 2;
    var holesWith2 = (2 - (count % 2)) % 2;
    var holesWith3 = (3 - (count % 3)) % 3;
    if (holesWith3 < holesWith2) return 3;
    if (holesWith3 === holesWith2 && holesWith2 > 0) return 3;
    return 2;
  }

  function balanceColumns(grid) {
    var plain = grid.querySelectorAll(".work-card:not(.work-feature)").length;
    grid.style.setProperty("--cols", bestColumns(plain));
  }

  /* fills a section: every work becomes a full card — featured ones render
     big — unless the owner marked it roll: true, which moves it to the
     client roll, a quiet strip of credits below the cards. featured: wins
     over roll:, so a work marked BIG is never demoted into the strip.
     Whether the item has a link makes no difference to where it lands; it
     only decides what the card (or the tile) shows.
     Returns how many entries were rendered in total. */
  function fillGrid(grid, items, roll) {
    var count = 0;
    asArray(items).forEach(function (item) {
      var mode = featureMode(item);
      if (roll && !mode && rollMode(item)) {
        var tile = buildClientTile(item);
        if (tile) {
          roll.appendChild(tile);
          count += 1;
          return;
        }
        /* no name and no picture to make a tile out of — fall through to a
           card rather than let the block quietly vanish */
      }

      var card = buildCard(item);
      if (!card) return;
      card.classList.add("reveal");
      if (mode) {
        card.classList.add("work-feature");
        if (mode === "left") card.classList.add("feature-flip");
        if (mode === "center") card.classList.add("feature-center");
      }
      grid.appendChild(card);
      count++;
    });
    return count;
  }
  /* pre-claim ids already used by the page so a section named "About",
     "Music" or "Contact" can never hijack the built-in navigation */
  var usedSlugs = { work: true, music: true, about: true, contact: true, top: true, "mobile-menu": true };
  var firstSlug = "";

  var sections = asArray(content.sections).filter(function (s) {
    return s && typeof s === "object" && asArray(s.items).length;
  });

  sections.forEach(function (sectionData, index) {
    var title = asText(sectionData.title) || "Work " + (index + 1);

    var grid = el("div", "work-grid");
    var roll = el("div", "client-roll reveal");
    var count = fillGrid(grid, sectionData.items, roll);
    /* nothing rendered (every item empty/broken) → no section, no menu entry */
    if (!count) return;
    balanceColumns(grid);

    var slug = slugify(title, usedSlugs);
    if (!firstSlug) firstSlug = slug;

    var section = el("section", "section work-section");
    section.id = slug;

    var label = el("h2", "section-label reveal", title.toUpperCase() + " ");
    var countMark = el(
      "span", "section-count", "· " + (count < 10 ? "0" : "") + count
    );
    countMark.setAttribute("aria-hidden", "true"); /* decoration, not name */
    label.appendChild(countMark);
    section.appendChild(label);
    if (grid.childNodes.length) section.appendChild(grid);
    if (roll.childNodes.length) {
      /* no cards above it → no divider needed */
      if (!grid.childNodes.length) roll.classList.add("client-roll-alone");
      makeRollScrollable(roll, title);
      section.appendChild(roll);
    }

    if (sectionsWrap) sectionsWrap.appendChild(section);

    /* hero category list */
    if (categoriesList) {
      var li = el("li");
      var a = el("a", null, title.toUpperCase());
      a.href = "#" + slug;
      addPillRing(a);
      li.appendChild(a);
      categoriesList.appendChild(li);
    }

    /* mobile menu */
    if (mobileNav) {
      var navLink = el("a", null, title.toUpperCase());
      navLink.href = "#" + slug;
      mobileNav.appendChild(navLink);
    }
  });

  if (categoriesList && !sections.length) categoriesList.hidden = true;

  /* ---------- music (own releases, its own zone next to the work) ---------- */

  var musicData = content.music;
  if (Array.isArray(musicData)) musicData = { items: musicData };
  var musicItems =
    musicData && typeof musicData === "object" ? asArray(musicData.items) : [];
  var musicWrap = $('[data-slot="music"]');
  var musicName = (musicData && asText(musicData.title)) || "Music";
  var musicTitle = musicName.toUpperCase();

  /* build the grid first — the section and its menu entries only appear
     when at least one item actually renders */
  var musicGrid = el("div", "work-grid");
  var musicRoll = el("div", "client-roll reveal");
  var musicCount = fillGrid(musicGrid, musicItems, musicRoll);
  balanceColumns(musicGrid);

  if (musicCount && musicWrap) {
    var musicSection = el("section", "section music-section");
    musicSection.id = "music";
    musicSection.appendChild(el("h2", "giant-label reveal", musicTitle));
    if (musicGrid.childNodes.length) musicSection.appendChild(musicGrid);
    if (musicRoll.childNodes.length) {
      if (!musicGrid.childNodes.length) musicRoll.classList.add("client-roll-alone");
      makeRollScrollable(musicRoll, musicName);
      musicSection.appendChild(musicRoll);
    }
    musicWrap.appendChild(musicSection);

    $all('[data-slot="music-link"]').forEach(function (a) {
      a.textContent = musicTitle;
    });
    if (mobileNav) {
      var musicNavLink = el("a", null, musicTitle);
      musicNavLink.href = "#music";
      mobileNav.appendChild(musicNavLink);
    }
  } else {
    /* no music content → no menu entry */
    $all('[data-slot="music-link"]').forEach(function (a) {
      a.hidden = true;
    });
  }

  /* finish the mobile menu with About + Contact */
  if (mobileNav) {
    var aboutLink = el("a", null, "ABOUT");
    aboutLink.href = "#about";
    mobileNav.appendChild(aboutLink);
    var contactLink = el("a", null, "CONTACT");
    contactLink.href = "#contact";
    mobileNav.appendChild(contactLink);
  }

  renderSocialIcons("mobile-socials");

  /* point the header WORK link at the first section */
  if (firstSlug) {
    $all('a[href="#work"]').forEach(function (a) {
      a.href = "#" + firstSlug;
    });
  }

  /* ---------- sliding client rolls: switch their arrows on ---------- */

  /* a rail can only tell how far it scrolls once it's part of the page, so
     the first check happens here, and again on resize — a phone turned
     sideways goes from two tiles across to four */
  function updateRolls() {
    rollUpdaters.forEach(function (update) {
      update();
    });
  }
  updateRolls();
  /* the pills exist and are laid out now — draw their rings */
  updatePillRings();

  /* ---------- one measured pass, whenever the layout could have moved ----------

     Three things on this page measure the layout and write a size back into
     it: the rails (how far they scroll), the category pills (the ring is
     drawn from the pill's own box) and the hero name (scaled to span the
     column). They all answer to the same two events — the window changing
     shape, and the web fonts finally arriving — so they run as one pass.
     One rAF latch for all three means a resize storm costs one reflow per
     frame instead of one per handler, and there is a single place to add
     the next measured thing to. */

  function layoutPass() {
    updateRolls();
    updatePillRings();
    fitHeroName();
  }

  var layoutPassQueued = false;
  function scheduleLayoutPass() {
    if (layoutPassQueued) return; /* one pass per frame, however fast the drag */
    layoutPassQueued = true;
    requestAnimationFrame(function () {
      layoutPassQueued = false;
      layoutPass();
    });
  }

  /* the categories are in place, so the name's vertical budget is known */
  fitHeroName();
  window.addEventListener("resize", scheduleLayoutPass);

  /* the first measure can still be the FALLBACK font — both faces load with
     font-display: swap — so measure again the moment the real ones are in.
     The pills used to be left out of this hook and sat a few pixels narrow,
     with their rings drawn to match, until the visitor happened to resize. */
  if (document.fonts && document.fonts.ready && document.fonts.ready.then) {
    /* a failed remeasure just leaves the CSS sizes — never an error screen */
    document.fonts.ready.then(layoutPass).catch(function () {});
  }

  /* ---------- header behaviour ---------- */

  var header = $(".site-header");
  function updateHeader() {
    /* every other $() result in this file is checked before it is used;
       this one is too, so an index.html without a header still renders the
       work instead of throwing into the error screen */
    if (header) header.classList.toggle("scrolled", window.scrollY > 10);
  }
  window.addEventListener("scroll", updateHeader, { passive: true });
  /* run once now and again after first paint / full load / hash jumps —
     deep links like /#contact can scroll the page without a scroll event */
  updateHeader();
  requestAnimationFrame(updateHeader);
  window.addEventListener("load", updateHeader);
  window.addEventListener("hashchange", updateHeader);

  /* ---------- mobile menu ---------- */

  var menuToggle = $(".menu-toggle");
  var mobileMenu = $("#mobile-menu");

  if (menuToggle && mobileMenu) {
    var setMenu = function (open) {
      if (!open && mobileMenu.contains(document.activeElement)) {
        menuToggle.focus();
      }
      menuToggle.setAttribute("aria-expanded", String(open));
      menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      mobileMenu.hidden = !open;
      document.body.style.overflow = open ? "hidden" : "";
      /* keep keyboard/screen-reader focus inside the open menu */
      $all("main, .site-footer").forEach(function (region) {
        region.inert = open;
      });
    };

    setMenu(false);
    menuToggle.addEventListener("click", function () {
      setMenu(mobileMenu.hidden);
    });
    $all("a", mobileMenu).forEach(function (link) {
      link.addEventListener("click", function () {
        setMenu(false);
      });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !mobileMenu.hidden) setMenu(false);
    });
    /* the header name and skip link sit above the overlay — following them
       while the menu is open must close it, or the overlay would linger over
       a scroll-locked page */
    $all(".header-name, .skip-link").forEach(function (link) {
      link.addEventListener("click", function () {
        if (!mobileMenu.hidden) setMenu(false);
      });
    });

    /* rotating/resizing past the desktop breakpoint closes the menu,
       otherwise the overlay would be stranded with no burger to close it.
       721 here is the other side of the two `@media (max-width: 720px)`
       blocks in css/style.css — the ones that show the burger and hide the
       nav. If that boundary ever moves, this has to move with it, or the
       burger disappears while its overlay is still open. */
    var desktopQuery = window.matchMedia("(min-width: 721px)");
    var onDesktop = function (e) {
      if (e.matches && !mobileMenu.hidden) setMenu(false);
    };
    if (desktopQuery.addEventListener) desktopQuery.addEventListener("change", onDesktop);
    else if (desktopQuery.addListener) desktopQuery.addListener(onDesktop);
  }

  /* ---------- scroll reveal ---------- */

  var revealNodes = $all(".reveal");
  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        /* stagger per batch: elements revealed together cascade, an element
           revealed alone starts immediately (no dead waiting time) */
        var batch = 0;
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.style.transitionDelay = Math.min(batch, 5) * 70 + "ms";
            batch += 1;
            entry.target.classList.add("in-view");
            /* the card is arriving — a Spotify player inside it may now
               fetch itself */
            loadLazyFrames(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px" }
    );
    /* elements already on screen at load reveal immediately with the
       stagger — the observer's bottom margin would otherwise leave
       anything in the lowest 10% of the first screen (like the peeking
       section label) invisible until the first scroll */
    var initialBatch = 0;
    revealNodes.forEach(function (node) {
      var isHidden = node.offsetParent === null;
      if (!isHidden && node.getBoundingClientRect().top < window.innerHeight) {
        node.style.transitionDelay = Math.min(initialBatch, 5) * 70 + "ms";
        initialBatch += 1;
        node.classList.add("in-view");
        loadLazyFrames(node);
      } else {
        observer.observe(node);
      }
    });
  } else {
    revealNodes.forEach(function (node) {
      node.classList.add("in-view");
    });
    /* nothing here can tell what's on screen — everything loads at once,
       exactly as it did before the players learned to wait */
    loadLazyFrames();
  }

  } catch (err) {
    renderError(
      "<p>The site could read <code>content.js</code>, but part of it has an " +
      "unexpected shape — often a list that lost its <code>[ ]</code> brackets " +
      "or text missing its <code>\"</code> quotes.</p>"
    );
    if (window.console && console.error) console.error(err);
  }
})();
