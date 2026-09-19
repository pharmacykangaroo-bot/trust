/* Trot & Thrive — one small vanilla script. No dependencies.
   Everything here is progressive: the page is fully usable without it. */
(() => {
  'use strict';

  // The inline fail-safe drops .js after 3s if we haven't booted; a late boot restores it.
  document.documentElement.classList.add('js');

  /* ---- Single source of truth for contact details (also mirrored in index.html for no-JS) ---- */
  const CONTACT = {
    brand: 'Trot & Thrive',
    phoneE164: '18286906688',          // digits only, used for wa.me + tel:
    phoneDisplay: '+1 828 690 6688',
  };
  const THEME_COLOR = { saddle: '#F4E9DC', wellness: '#EEF7F1' };

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const html = document.documentElement;
  const body = document.body;

  const waUrl = (text) => `https://wa.me/${CONTACT.phoneE164}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
  const telUrl = `tel:+${CONTACT.phoneE164}`;

  /* ---- Contact wiring ---- */
  $$('[data-tel-link]').forEach((a) => { a.href = telUrl; });
  $$('[data-phone-display]').forEach((el) => { el.textContent = CONTACT.phoneDisplay; });
  $$('[data-wa-link]').forEach((a) => {
    try { a.href = waUrl(new URL(a.href).searchParams.get('text') || ''); } catch (_) { /* keep the HTML href */ }
  });
  $$('form[data-form]').forEach((f) => { f.action = waUrl(''); });

  /* ---- Headline word split (keeps the highlighted pill as one unit) ---- */
  $$('[data-split]').forEach((h) => {
    const label = h.textContent.replace(/\s+/g, ' ').trim();
    const frag = document.createDocumentFragment();
    let i = 0;
    const word = (node) => {
      const w = document.createElement('span');
      w.className = 'w';
      w.style.setProperty('--i', i++);
      w.setAttribute('aria-hidden', 'true');
      w.appendChild(node);
      return w;
    };
    Array.from(h.childNodes).forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        node.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          frag.appendChild(/^\s+$/.test(part) ? document.createTextNode(' ') : word(document.createTextNode(part)));
        });
      } else {
        frag.appendChild(word(node.cloneNode(true)));
      }
    });
    h.textContent = '';
    h.setAttribute('aria-label', label);
    h.appendChild(frag);
  });

  /* ---- Scroll reveals ---- */
  const revealEls = $$('[data-reveal]');
  if ('IntersectionObserver' in window && !reduced.matches) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('in'));
  }

  /* ---- Theme: flips when the switch band's midpoint crosses mid-viewport ---- */
  const switchBand = $('#switch');
  const steps = $('.steps');
  const stepItems = $$('[data-step]');
  const waFloat = $('.wa-float');
  const metaTheme = $('meta[name="theme-color"]');
  const worldBtns = $$('[data-world-btn]');
  const navCta = $('[data-cta-enquire]');
  const parallaxEls = $$('[data-parallax]');
  let theme = 'saddle';

  const setTheme = (next) => {
    if (next === theme) return;
    theme = next;
    html.dataset.theme = next;
    body.dataset.theme = next;
    if (metaTheme) metaTheme.content = THEME_COLOR[next];
    worldBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.worldBtn === next)));
    if (navCta) navCta.href = next === 'wellness' ? '#wellness-enquiry' : '#saddle-enquiry';
  };

  const onScroll = () => {
    const vh = window.innerHeight;

    if (switchBand) {
      const r = switchBand.getBoundingClientRect();
      setTheme(r.top + r.height / 2 < vh / 2 ? 'wellness' : 'saddle');
      const p = clamp((vh - r.top) / (vh + r.height), 0, 1);
      switchBand.style.setProperty('--p', p.toFixed(3));
    }

    if (steps) {
      const r = steps.getBoundingClientRect();
      const prog = clamp((vh * 0.72 - r.top) / r.height, 0, 1);
      steps.style.setProperty('--prog', prog.toFixed(3));
      const n = stepItems.length;
      stepItems.forEach((s, i) => s.classList.toggle('is-done', prog >= (n > 1 ? i / (n - 1) : 0) - 0.02 && prog > 0));
    }

    if (!reduced.matches) {
      parallaxEls.forEach((el) => {
        const host = el.closest('section') || el.parentElement;
        const r = host.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        const offset = (r.top + r.height / 2 - vh / 2) * parseFloat(el.dataset.parallax || '0');
        el.style.translate = `0 ${offset.toFixed(1)}px`;
      });
    }

    if (waFloat) waFloat.classList.toggle('is-on', window.scrollY > vh * 0.6 && !busy.size);

    if (menu && menu.open && Math.abs(window.scrollY - menuOpenedAt) > 40) menu.open = false;
  };

  // The floating bubble hides wherever it would sit on fields or duplicate a WhatsApp CTA.
  const busy = new Set();
  if ('IntersectionObserver' in window) {
    const fio = new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? busy.add(e.target) : busy.delete(e.target)));
      requestTick();
    });
    $$('.form, .faq__list, #contact, .footer').forEach((el) => fio.observe(el));
  }

  const menu = $('.menu');
  let menuOpenedAt = 0;

  let ticking = false;
  const requestTick = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; onScroll(); });
  };
  window.addEventListener('scroll', requestTick, { passive: true });
  window.addEventListener('resize', requestTick);
  onScroll();

  worldBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = $(btn.dataset.worldBtn === 'wellness' ? '#wellness' : '#saddle');
      if (target) target.scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth', block: 'start' });
    });
  });

  /* ---- Mobile menu: close on link, outside click, Escape, tabbing out or scrolling away ---- */
  if (menu) {
    menu.addEventListener('toggle', () => { if (menu.open) menuOpenedAt = window.scrollY; });
    menu.addEventListener('focusout', (e) => { if (e.relatedTarget && !menu.contains(e.relatedTarget)) menu.open = false; });
    menu.addEventListener('click', (e) => { if (e.target.closest('a')) menu.open = false; });
    document.addEventListener('click', (e) => { if (menu.open && !menu.contains(e.target)) menu.open = false; });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.open) { menu.open = false; $('summary', menu).focus(); }
    });
  }

  /* ---- Colourway picker ---- */
  const cwSection = $('#colorways');
  const cwNames = { noir: 'Noir Gold', blaze: 'Blaze' };
  const colourSelect = $('#s-colour');
  $$('[data-cw-btn]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.cwBtn;
      if (!cwSection || cwSection.dataset.cw === key) return;
      cwSection.dataset.cw = key;
      $$('[data-cw-btn]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      $$('[data-cw-img]').forEach((img) => {
        img.classList.toggle('is-active', img.dataset.cwImg === key);
        img.setAttribute('aria-hidden', String(img.dataset.cwImg !== key));
      });
      $$('[data-cw-panel]').forEach((p) => { p.hidden = p.dataset.cwPanel !== key; });
      const tag = $('[data-cw-tag]');
      if (tag) tag.textContent = cwNames[key];
      const cta = $('[data-cw-cta]');
      if (cta) cta.textContent = `Enquire about ${cwNames[key]}`;
      if (colourSelect) colourSelect.value = cwNames[key];
    });
  });

  /* ---- Build-your-kit: card toggles <-> form chips (checkboxes are the source of truth) ---- */
  const kitCount = $('[data-kit-count]');
  const chips = $$('[data-kit-chip]');
  const kitButtons = $$('[data-kit]');
  const syncKits = () => {
    const picked = chips.filter((c) => c.checked).map((c) => c.value);
    kitButtons.forEach((b) => {
      const on = picked.includes(b.dataset.kit);
      b.setAttribute('aria-pressed', String(on));
      $('.kit__label', b).textContent = on ? 'added to my kit' : 'add to my kit';
      b.closest('.kit').classList.toggle('is-picked', on);
    });
    if (kitCount) {
      kitCount.textContent = picked.length
        ? `In your kit: ${picked.join(', ')}. It's already in the form below.`
        : 'Your kit is empty. Tap a card to start.';
    }
  };
  kitButtons.forEach((b) => {
    b.addEventListener('click', () => {
      const chip = chips.find((c) => c.value === b.dataset.kit);
      if (!chip) return;
      chip.checked = !chip.checked;
      syncKits();
    });
  });
  chips.forEach((c) => c.addEventListener('change', syncKits));
  syncKits();

  /* ---- Enquiry forms -> validated WhatsApp message ---- */
  const PHONE_CHARS = /^[+\d\s().-]+$/;
  const validators = {
    name: (v) => (v.trim().length >= 2 ? '' : 'Please add your name (at least 2 letters).'),
    phone: (v) => {
      const digits = v.replace(/\D/g, '');
      if (!v.trim()) return 'We need a phone or WhatsApp number to reply.';
      if (!PHONE_CHARS.test(v) || digits.length < 7 || digits.length > 15) return 'That number looks off. Include your country code, e.g. +91 98765 43210.';
      return '';
    },
    qty: (v, input) => {
      if (input && input.validity && input.validity.badInput) return 'Quantity should be a whole number from 1 to 99.';
      if (v === '') return '';
      const n = Number(v);
      return Number.isInteger(n) && n >= 1 && n <= 99 ? '' : 'Quantity should be a whole number from 1 to 99.';
    },
  };

  const showError = (input, msg) => {
    const err = document.getElementById(`${input.id}-err`);
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (err) err.textContent = msg;
  };

  const lines = (title, pairs) => [title, ...pairs.filter(([, v]) => v).map(([k, v]) => `• ${k}: ${v}`)].join('\n');

  const composers = {
    saddle: (f) => lines(`Hi ${CONTACT.brand}! I'd like a quote for a saddle bag.`, [
      ['Name', f.name], ['Phone/WhatsApp', f.phone], ['City & country', f.city],
      ['Colourway', f.colour], ['Saddle type', f.type], ['Quantity', f.qty || '1'], ['Message', f.msg],
    ]),
    wellness: (f) => lines(`Hi ${CONTACT.brand}! I'm interested in your wellness kits.`, [
      ['Name', f.name], ['Phone/WhatsApp', f.phone], ['City & country', f.city],
      ['Kits', f.kits || 'Not sure yet, help me choose'], ['Message', f.msg],
    ]),
  };

  const openWhatsApp = (url) => {
    const w = window.open(url, '_blank');
    if (w) { try { w.opener = null; } catch (_) { /* cross-origin, fine */ } } else { window.location.href = url; }
  };

  const renderStatus = (panel, message, url) => {
    panel.textContent = '';
    const title = document.createElement('p');
    title.className = 'status__title';
    title.textContent = 'Opening WhatsApp…';
    const text = document.createElement('p');
    text.textContent = 'Your message is ready. Just hit send and we will reply there.';
    const actions = document.createElement('div');
    actions.className = 'status__actions';

    const retry = document.createElement('a');
    retry.className = 'btn btn--primary btn--sm';
    retry.href = url; retry.target = '_blank'; retry.rel = 'noopener';
    retry.textContent = 'Open WhatsApp again';

    const call = document.createElement('a');
    call.className = 'btn btn--ghost btn--sm';
    call.href = telUrl;
    call.textContent = `Didn't open? Call us`;

    const copy = document.createElement('button');
    copy.type = 'button';
    copy.className = 'btn btn--ghost btn--sm';
    copy.textContent = 'Copy message';
    copy.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(message);
        copy.textContent = 'Copied ✓';
      } catch (_) {
        let box = $('textarea', panel);
        if (!box) {
          box = document.createElement('textarea');
          box.readOnly = true;
          box.setAttribute('aria-label', 'Your enquiry message');
          box.value = message;
          panel.appendChild(box);
        }
        box.focus(); box.select();
        copy.textContent = 'Select all and copy below';
      }
    });

    actions.append(retry, call, copy);
    panel.append(title, text, actions);
    // The panel sits under the submit button; bring the call/copy fallbacks on screen.
    panel.scrollIntoView({ block: 'nearest', behavior: reduced.matches ? 'auto' : 'smooth' });
  };

  $$('form[data-form]').forEach((form) => {
    form.noValidate = true;
    const kind = form.dataset.form;
    const prefix = kind === 'saddle' ? 's' : 'w';
    const get = (id) => document.getElementById(`${prefix}-${id}`);
    const nameIn = get('name');
    const phoneIn = get('phone');
    const qtyIn = get('qty');
    const panel = $('.status', form);
    let attempted = false;

    const validate = () => {
      const checks = [[nameIn, validators.name], [phoneIn, validators.phone]];
      if (qtyIn) checks.push([qtyIn, validators.qty]);
      let firstBad = null;
      checks.forEach(([input, fn]) => {
        const msg = fn(input.value, input);
        showError(input, msg);
        if (msg && !firstBad) firstBad = input;
      });
      return firstBad;
    };

    [nameIn, phoneIn, qtyIn].filter(Boolean).forEach((input) => {
      input.addEventListener('blur', () => { if (attempted) validate(); });
      input.addEventListener('input', () => { if (attempted) validate(); });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      attempted = true;
      const bad = validate();
      if (bad) { bad.focus(); return; }

      const fields = {
        name: nameIn.value.trim(),
        phone: phoneIn.value.trim(),
        city: (get('city')?.value || '').trim(),
        colour: get('colour')?.value,
        type: get('type')?.value,
        qty: qtyIn?.value.trim(),
        kits: chips.filter((c) => c.checked).map((c) => c.value).join(', '),
        msg: (get('msg')?.value || '').trim(),
      };
      const message = composers[kind](fields);
      const url = waUrl(message);
      renderStatus(panel, message, url);
      openWhatsApp(url);
    });
  });

  /* ---- Pointer-only flourishes: 3D tilt + cursor blob ---- */
  if (finePointer.matches && !reduced.matches) {
    $$('[data-tilt]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        const mag = Math.min(1, Math.hypot(x, y) * 2);
        el.style.rotate = `${(-y).toFixed(3)} ${x.toFixed(3)} 0 ${(mag * 6).toFixed(2)}deg`;
      });
      el.addEventListener('pointerleave', () => { el.style.rotate = ''; });
    });

    const blob = $('.cursor-blob');
    if (blob) {
      let tx = 0; let ty = 0; let cx = 0; let cy = 0; let running = false;
      const loop = () => {
        cx += (tx - cx) * 0.18; cy += (ty - cy) * 0.18;
        blob.style.transform = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0)`;
        running = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.3;
        if (running) requestAnimationFrame(loop);
      };
      window.addEventListener('pointermove', (e) => {
        tx = e.clientX; ty = e.clientY;
        blob.classList.add('is-on');
        blob.classList.toggle('is-big', !!e.target.closest('a, button, summary, label, select'));
        if (!running) { running = true; requestAnimationFrame(loop); }
      }, { passive: true });
      document.addEventListener('pointerleave', () => blob.classList.remove('is-on'));
    }
  }

  window.TT_READY = true;
})();
