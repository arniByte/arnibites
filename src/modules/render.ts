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
      <div class="dir__items">
        ${d.items
          .map(
            (it, i) => `
          <button class="item-row" data-group="${d.key}" data-seed="${it.seed}" data-cursor="Open" data-reveal style="--reveal-delay: ${(i * 0.06).toFixed(2)}s" aria-haspopup="dialog">
            <span class="item-row__title">${it.title}</span>
            <span class="item-row__meta">${it.meta}</span>
            <span class="item-row__arrow" aria-hidden="true">↗</span>
          </button>`,
          )
          .join('')}
      </div>
    </section>`,
    )
    .join('');
}

export function renderSocials(): void {
  const list = document.getElementById('contact-socials');
  if (list) {
    list.innerHTML = identity.socials
      .map((s) => `<li><a href="${s.href}">${s.label} ↗</a></li>`)
      .join('');
  }
  const footerName = document.getElementById('footer-name');
  if (footerName) footerName.textContent = identity.name;
}
