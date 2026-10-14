const scenes = [
  {name:'Moon', title:'Сон и расслабление', eyebrow:'ВАША ВЕЧЕРНЯЯ ОРБИТА', description:'Маленькая пауза для себя.\nНовая планета в вашем вечернем ритуале.'},
  {name:'Saturn', title:'Энергия и иммунитет', eyebrow:'ВАША ДНЕВНАЯ ОРБИТА', description:'Свой ритм. Свой маршрут.\nЗабота о себе на каждый день.'},
  {name:'Venus', title:'Женский мультикомплекс', eyebrow:'ВСЕЛЕННАЯ ВНУТРЕННЕЙ ГАРМОНИИ', description:'Время, которое принадлежит вам.\nПриятная привычка заботиться о себе.'},
  {name:'Mars', title:'Мужской мультикомплекс', eyebrow:'НАВСТРЕЧУ НОВЫМ ГОРИЗОНТАМ', description:'Каждый день — новая орбита.\nНайдите свой ежедневный ритуал.'},
  {name:'Earth', title:'Кожа, волосы, ногти', eyebrow:'ВАША ОРБИТА КРАСОТЫ', description:'Забота, которая начинается с вас.\nМаленький шаг в привычном ритме.'},
  {name:'Neptune', title:'Коллаген + биотин', eyebrow:'ГЛУБИНА ЕЖЕДНЕВНОЙ ЗАБОТЫ', description:'Откройте свой мир Moonvit.\nКрасота в простых ежедневных привычках.'}
];
const backgrounds = [document.querySelector('#background-a'), document.querySelector('#background-b')];
const universe = document.querySelector('.universe');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
let selected = 0;
let foreground = 0;
let changing = false;
function position(index) { return `${(index % 3) * 50}% ${Math.floor(index / 3) * 100}%`; }
function updateContent(index) {
  const scene = scenes[index];
  document.querySelector('#planet-title').textContent = scene.name;
  document.querySelector('#planet-subtitle').textContent = scene.title;
  document.querySelector('#scene-eyebrow').textContent = scene.eyebrow;
  document.querySelector('#planet-description').replaceChildren(...scene.description.split('\n').flatMap((line, i) => i ? [document.createElement('br'), document.createTextNode(line)] : [document.createTextNode(line)]));
  const product = document.querySelector('#product-sprite');
  product.style.backgroundPosition = position(index);
  product.setAttribute('aria-label', `Концептуальная упаковка Moonvit ${scene.name}`);
  document.querySelector('#scene-count').innerHTML = `0${index + 1} <span>/ 06</span>`;
  document.querySelectorAll('[data-planet]').forEach(button => {
    const active = Number(button.dataset.planet) === index;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}
function selectScene(index) {
  index = (index + scenes.length) % scenes.length;
  if (changing || index === selected) return;
  changing = true;
  selected = index;
  universe.classList.add('changing');
  const next = 1 - foreground;
  backgrounds[next].style.backgroundPosition = position(index);
  backgrounds[next].style.opacity = '1';
  backgrounds[foreground].style.opacity = '0';
  foreground = next;
  window.setTimeout(() => { updateContent(index); universe.classList.remove('changing'); }, reduced ? 0 : 350);
  window.setTimeout(() => { changing = false; }, reduced ? 0 : 1000);
}
document.querySelectorAll('[data-planet]').forEach(button => button.addEventListener('click', () => selectScene(Number(button.dataset.planet))));
document.querySelector('#previous').addEventListener('click', () => selectScene(selected - 1));
document.querySelector('#next').addEventListener('click', () => selectScene(selected + 1));
document.querySelector('#world-toggle').addEventListener('click', () => document.querySelector(`[data-planet="${selected}"]`).focus());
document.addEventListener('keydown', event => {
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.key === 'ArrowRight') { event.preventDefault(); selectScene(selected + 1); }
  if (event.key === 'ArrowLeft') { event.preventDefault(); selectScene(selected - 1); }
});
let startX = 0;
universe.addEventListener('touchstart', event => { startX = event.changedTouches[0].screenX; }, {passive:true});
universe.addEventListener('touchend', event => {
  const delta = event.changedTouches[0].screenX - startX;
  if (Math.abs(delta) > 70) selectScene(selected + (delta < 0 ? 1 : -1));
}, {passive:true});
