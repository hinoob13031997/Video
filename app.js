const video = document.querySelector('#journey-video');
const intro = document.querySelector('#intro');
const planets = [...document.querySelectorAll('[data-time]')];
const toggle = document.querySelector('#play-toggle');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reducedMotion) { video.autoplay = false; video.pause(); }
function updatePlayback() {
  toggle.textContent = video.paused ? '▶' : 'Ⅱ';
  toggle.setAttribute('aria-label', video.paused ? 'Воспроизвести видео' : 'Приостановить видео');
}
video.addEventListener('play', updatePlayback);
video.addEventListener('pause', updatePlayback);
toggle.addEventListener('click', () => video.paused ? video.play().catch(() => {}) : video.pause());
function selectPlanet(button) {
  video.currentTime = Number(button.dataset.time);
  intro.classList.add('hidden');
  video.play().catch(() => {});
}
planets.forEach(button => button.addEventListener('click', () => selectPlanet(button)));
document.querySelector('#explore').addEventListener('click', () => selectPlanet(planets[0]));
video.addEventListener('timeupdate', () => {
  intro.classList.toggle('hidden', video.currentTime > 5);
  const index = Math.max(0, planets.findLastIndex(button => video.currentTime >= Number(button.dataset.time)));
  planets.forEach((button, i) => { button.classList.toggle('active', i === index); button.setAttribute('aria-pressed', String(i === index)); });
  document.querySelector('#scene-number').textContent = `0${index + 1} / 06`;
  document.querySelector('#scene-name').textContent = planets[index].dataset.name;
  document.querySelector('#progress-fill').style.width = `${video.currentTime / video.duration * 100}%`;
});
video.addEventListener('ended', () => { video.currentTime = 0; video.play().catch(() => {}); });
const products = [
  ['Moon', 'Сон и расслабление', 'balance', 'moon'],
  ['Saturn', 'Энергия и иммунитет', 'energy', 'saturn'],
  ['Venus', 'Женский мультикомплекс', 'balance', 'venus'],
  ['Mars', 'Мужской мультикомплекс', 'energy', 'mars'],
  ['Earth', 'Кожа, волосы, ногти', 'beauty', 'earth'],
  ['Neptune', 'Коллаген + биотин', 'beauty', 'neptune']
];
function renderProducts(filter = 'all') {
  document.querySelector('#products').innerHTML = products.filter(p => filter === 'all' || p[2] === filter).map(p => `<article class="product"><img src="assets/${p[3]}.jpg" alt="${p[0]} — кадр из презентации Moonvit" loading="lazy"><div class="product-info"><div class="product-top"><h3>${p[0]}</h3><span>MOONVIT</span></div><p>${p[1]}</p><a href="https://moonvit.space/catalog" target="_blank" rel="noopener">Посмотреть продукт <span>↗</span></a></div></article>`).join('');
}
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-filter]').forEach(b => b.classList.toggle('selected', b === button));
  renderProducts(button.dataset.filter);
}));
renderProducts();
updatePlayback();
