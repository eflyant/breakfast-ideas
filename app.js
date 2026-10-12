let recipes = [], filter = 'all', favoritesOnly = false;
let favorites;
try { favorites = new Set(JSON.parse(localStorage.getItem('breakfast-favorites') || '[]')); } catch { favorites = new Set(); }
const checked = new Map();
const grid = document.querySelector('#recipes');
const dialog = document.querySelector('#recipe-dialog');
function recipeVisual(r, detail = false) {
  if (r.image) return `<div class="${detail ? 'detail-photo' : 'card-photo'}"><img src="${r.image}" alt="${r.imageAlt || r.title}" ${detail ? '' : 'loading="lazy"'}>${r.overnight ? '<span class="overnight">☾ Звечора</span>' : ''}</div>`;
  return `<div class="${detail ? 'detail-art ' : ''}food-placeholder ${r.color}"><span class="food-emoji" aria-hidden="true">${r.emoji}</span><span class="photo-note">тут буде фото страви</span>${r.overnight ? '<span class="overnight">☾ Звечора</span>' : ''}</div>`;
}
const timeText = r => r.overnight ? `${r.time} хв + ніч` : `≈ ${r.time} хв`;
function toggleFavorite(id) {
  favorites.has(id) ? favorites.delete(id) : favorites.add(id);
  try { localStorage.setItem('breakfast-favorites', JSON.stringify([...favorites])); } catch { /* Favorites remain available for this session. */ }
  render();
  const button = document.querySelector('#detail-favorite');
  if (button) updateHeart(button, button.dataset.id);
}
function updateHeart(button, id) {
  button.textContent = favorites.has(id) ? '❤️' : '🤍';
  button.setAttribute('aria-pressed', String(favorites.has(id)));
  button.setAttribute('aria-label', favorites.has(id) ? 'Видалити з улюблених' : 'Зберегти в улюблені');
}
function render() {
  const visible = recipes.filter(r => (!favoritesOnly || favorites.has(r.id)) && (filter === 'all' || (filter === 'quick' ? r.time <= 10 : filter === 'vegetables' ? r.vegetables : r.type === filter)));
  document.querySelector('#favorite-count').textContent = favorites.size;
  document.querySelector('#result-count').textContent = `${visible.length} / 10`;
  grid.replaceChildren();
  if (!visible.length) {
    const empty = document.createElement('div'); empty.className = 'empty';
    empty.innerHTML = '<span>🤍</span><h3>Тут поки тихо</h3><p>Збережи рецепт сердечком або обери інший фільтр.</p><button class="primary">Показати всі рецепти</button>';
    empty.querySelector('button').onclick = () => { favoritesOnly = false; filter = 'all'; syncFilters(); render(); };
    grid.append(empty);
  }
  visible.forEach(r => {
    const card = document.createElement('article'); card.className = 'card';
    card.innerHTML = `<button class="card-open" aria-label="Відкрити рецепт: ${r.title}">${recipeVisual(r)}<div class="card-copy"><span class="recipe-time">◷ ${timeText(r)}</span><h3>${r.title}</h3><span class="card-link">Готувати <span aria-hidden="true">↗</span></span></div></button><button class="heart"></button>`;
    card.querySelector('.card-open').onclick = () => openRecipe(r.id);
    const heart = card.querySelector('.heart'); updateHeart(heart, r.id); heart.onclick = () => toggleFavorite(r.id);
    grid.append(card);
  });
}
function syncFilters() {
  document.querySelectorAll('[data-filter]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.filter === filter)));
  document.querySelector('#favorites').setAttribute('aria-pressed', String(favoritesOnly));
  document.querySelector('#filter-note').textContent = filter === 'quick' ? 'До 10 хв активної підготовки. Рецепти «Звечора» потребують ночі в холодильнику.' : 'На 2 дорослих і 1 дитину · невеликі порції · ложки без гірки';
}
function openRecipe(id) {
  const r = recipes.find(r => r.id === id); if (!r) return;
  const selected = checked.get(id) || new Set(); checked.set(id, selected);
  const detail = document.querySelector('#recipe-detail');
  detail.innerHTML = `${recipeVisual(r, true)}<div class="detail-body"><div class="detail-heading"><h2 id="recipe-title">${r.title}</h2><button id="detail-favorite" class="detail-heart" data-id="${id}"></button></div><div class="metadata"><span>◷ ${timeText(r)}</span><span>2 дорослих + 1 дитина</span></div><p class="portion-note">Усі ложки без гірки, час приготування орієнтовний.</p><h3>Що знадобиться</h3><p class="ingredient-help">Відмічай те, що вже підготовано</p><div class="ingredients"></div><h3 class="steps-title">Готуємо</h3><ol class="steps">${r.steps.map(s => `<li>${s}</li>`).join('')}</ol>${r.note ? `<p class="recipe-note">${r.note}</p>` : ''}<button id="next-recipe" class="primary next">Наступний рецепт <span aria-hidden="true">→</span></button></div>`;
  const ingredients = detail.querySelector('.ingredients');
  r.ingredients.forEach((text, i) => {
    const label = document.createElement('label'); label.className = 'ingredient';
    const input = document.createElement('input'); input.type = 'checkbox'; input.checked = selected.has(i);
    input.onchange = () => input.checked ? selected.add(i) : selected.delete(i);
    const span = document.createElement('span'); span.textContent = text;
    label.append(input, span); ingredients.append(label);
  });
  const heart = detail.querySelector('#detail-favorite'); updateHeart(heart, id); heart.onclick = () => toggleFavorite(id);
  detail.querySelector('#next-recipe').onclick = () => openRecipe(recipes[(recipes.indexOf(r) + 1) % recipes.length].id);
  if (!dialog.open) dialog.showModal();
  dialog.scrollTop = 0; document.body.classList.add('modal-open'); document.querySelector('#close-dialog').focus();
}
document.querySelectorAll('[data-filter]').forEach(b => b.onclick = () => { filter = b.dataset.filter; syncFilters(); render(); });
document.querySelector('#favorites').onclick = () => { favoritesOnly = !favoritesOnly; syncFilters(); render(); };
document.querySelector('#random').onclick = () => { if (recipes.length) openRecipe(recipes[Math.floor(Math.random() * recipes.length)].id); };
document.querySelector('#close-dialog').onclick = () => dialog.close();
dialog.addEventListener('close', () => document.body.classList.remove('modal-open'));
dialog.addEventListener('click', e => { if (e.target === dialog) { const b = dialog.getBoundingClientRect(); if (e.clientX < b.left || e.clientX > b.right || e.clientY < b.top || e.clientY > b.bottom) dialog.close(); } });
fetch('recipes.json').then(r => { if (!r.ok) throw new Error('Recipe loading failed'); return r.json(); }).then(data => { recipes = data; render(); }).catch(() => { document.querySelector('#load-error').hidden = false; });
