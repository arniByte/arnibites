/**
 * Renders data from content.ts into the DOM — works index and
 * capabilities grid. Design and content stay decoupled.
 */
import { capabilities, works } from '../content';

export function renderWorksList(): void {
  const list = document.getElementById('works-list');
  if (!list) return;

  list.innerHTML = works
    .map(
      (w, i) => `
    <li>
      <button class="work-row" data-work="${i}" data-cursor="OPEN" aria-haspopup="dialog">
        <span class="work-row__index">${w.index}</span>
        <span class="work-row__title">${w.title}</span>
        <span class="work-row__cat">${w.category}</span>
        <span class="work-row__year">${w.year}</span>
        <span class="work-row__arrow" aria-hidden="true">↗</span>
      </button>
    </li>`,
    )
    .join('');
}

export function renderCapsGrid(): void {
  const grid = document.getElementById('caps-grid');
  if (!grid) return;

  grid.innerHTML = capabilities
    .map(
      (c) => `
    <li class="caps__cell">
      <span class="caps__num">${c.num}</span>
      <span class="caps__name">${c.name}</span>
      <span class="caps__detail">${c.detail}</span>
    </li>`,
    )
    .join('');
}
