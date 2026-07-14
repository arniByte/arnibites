/**
 * Renders content.ts into the DOM: ME copy, DIRECTIONS groups, socials.
 * Content and design stay decoupled.
 */
import { directions, identity, me } from '../content';

export function renderMe(): void {
  const lead = document.getElementById('me-lead');
  const quote = document.getElementById('me-quote');
  const facts = document.getElementById('me-facts');
  if (lead) lead.textContent = me.lead;
  if (quote) quote.textContent = me.quote;
  if (facts) {
    facts.innerHTML = me.facts
      .map((f) => `<div><dt>${f.k}</dt><dd>${f.v}</dd></div>`)
      .join('');
  }
}

export function renderDirections(): void {
  const groups = document.getElementById('dir-groups');
  if (!groups) return;

  groups.innerHTML = directions
    .map(
      (d) => `
    <section class="dir__group" data-group="${d.key}">
      <div class="dir__group-cap" data-reveal>
        <h3 class="dir__group-name"><em>${d.label}</em></h3>
        <p class="dir__group-note">${d.caption}</p>
      </div>
      ${d.layout === 'gallery' ? renderGallery(d.items) : d.layout === 'play' ? renderPlay(d.items) : renderList(d.key, d.items)}
    </section>`,
    )
    .join('');
}

function renderList(key: string, items: typeof directions[number]['items']): string {
  return `<div class="dir__items">
    ${items
      .map(
        (it, i) => `
      <button class="item-row" data-group="${key}" data-seed="${it.seed}" data-cursor="Open" data-reveal style="--reveal-delay: ${(i * 0.06).toFixed(2)}s" aria-haspopup="dialog">
        <span class="item-row__title">${it.title}</span>
        <span class="item-row__meta">${it.meta}</span>
        <span class="item-row__arrow" aria-hidden="true">↗</span>
      </button>`,
      )
      .join('')}
  </div>`;
}

function renderGallery(items: typeof directions[number]['items']): string {
  return `<div class="dir__gallery">
    ${items
      .map(
        (it, i) => `
      <button class="art-tile" data-seed="${it.seed}" data-cursor="View" data-reveal style="--reveal-delay: ${(i * 0.07).toFixed(2)}s" aria-haspopup="dialog" aria-label="${it.title}, ${it.meta}">
        <span class="art-tile__frame"${it.ratio ? ` style="aspect-ratio: ${it.ratio}"` : ''}><img src="${it.image}" alt="${it.title}" loading="lazy" decoding="async" /></span>
        <span class="art-tile__cap">
          <span class="art-tile__title">${it.title}</span>
          <span class="art-tile__meta">${it.meta}</span>
        </span>
      </button>`,
      )
      .join('')}
  </div>`;
}

function renderPlay(items: typeof directions[number]['items']): string {
  return `<div class="dir__gallery dir__gallery--play">
    ${items
      .map(
        (it, i) => `
      <button class="art-tile play-tile" data-game="${it.game}" data-seed="${it.seed}" data-cursor="Play" data-reveal style="--reveal-delay: ${(i * 0.07).toFixed(2)}s" aria-haspopup="dialog" aria-label="Play ${it.title} — ${it.note}">
        <span class="art-tile__frame play-tile__frame">
          <canvas class="play-tile__canvas" width="440" height="440" aria-hidden="true"></canvas>
        </span>
        <span class="art-tile__cap">
          <span class="art-tile__title">${it.title}</span>
          <span class="art-tile__meta">${it.meta}</span>
        </span>
      </button>`,
      )
      .join('')}
  </div>`;
}

export function renderSocials(): void {
  const list = document.getElementById('contact-socials');
  if (list) {
    list.innerHTML = identity.socials
      .map((s) => `<li><a href="${s.href}" data-magnetic="0.3">${s.label} ↗</a></li>`)
      .join('');
  }
  const footerName = document.getElementById('footer-name');
  if (footerName) footerName.textContent = identity.name;
}
