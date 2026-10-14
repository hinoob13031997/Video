const products = JSON.parse(document.querySelector('#product-data').textContent);
const journey = document.querySelector('#journey');
const stage = document.querySelector('.cinema-stage');
const chapters = [...document.querySelectorAll('[data-chapter]')];
const navigation = [...document.querySelectorAll('[data-scene]')];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const header = document.querySelector('.site-header');
const dialog = document.querySelector('#product-dialog');
let frameRequested = false;
let activeChapter = -1;
let chapterDistance = 1;
let journeyStart = 0;
let lastFocused;
let flightScene = null;
let flightLoading = false;
const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const smooth = value => value * value * (3 - 2 * value);
const worldPreloads = new Map();
function preloadWorld(index) {
  if (index < 0 || index >= products.length || worldPreloads.has(index)) return;
  const image = new Image();
  image.src = products[index].world;
  worldPreloads.set(index, image);
}

function measure() {
  journeyStart = journey.getBoundingClientRect().top + scrollY;
  chapterDistance = (journey.offsetHeight - stage.offsetHeight) / chapters.length;
  requestFrame();
}

function draw() {
  frameRequested = false;
  header.classList.toggle('scrolled', scrollY > 50);
  const progress = clamp((scrollY - journeyStart) / (chapterDistance * chapters.length));
  const cursor = Math.min(progress * chapters.length, chapters.length - 0.001);
  const index = Math.floor(cursor);
  const fraction = cursor - index;
  const blend = reducedMotion.matches ? 0 : smooth(clamp((fraction - 0.78) / 0.22));
  const visibleIndex = blend > 0.5 && index < chapters.length - 1 ? index + 1 : index;
  preloadWorld(index);
  preloadWorld(index + 1);

  chapters.forEach((chapter, i) => {
    const incoming = i === index + 1 && index < chapters.length - 1;
    const opacity = i === index ? (index === chapters.length - 1 ? 1 : 1 - blend) : incoming ? blend : 0;
    chapter.style.opacity = opacity;
    chapter.style.visibility = opacity > 0 ? 'visible' : 'hidden';
    if (opacity > 0) {
      const phase = i === index ? fraction : 0;
      const entrance = reducedMotion.matches ? 1 : smooth(clamp((phase - 0.22) / 0.33));
      const copy = i === 0 && cursor < .18 ? 0 : reducedMotion.matches ? 1 : smooth(clamp((phase - 0.49) / 0.1)) * (1 - smooth(clamp((phase - 0.76) / 0.05)));
      const approach = smooth(clamp(phase / 0.55));
      const cameraDepth = 15 - 17 * approach;
      const productDepth = -24 + 18 * entrance;
      const perspectiveScale = Math.min(1.05, 4 / Math.max(.1, cameraDepth - productDepth));
      chapter.style.setProperty('--world', `url("${products[i].world}")`);
      chapter.style.setProperty('--planet-scale', reducedMotion.matches ? 1 : 1.01 + approach * .55);
      chapter.style.setProperty('--world-x', `${reducedMotion.matches ? 0 : -phase * 24}px`);
      chapter.style.setProperty('--jar-scale', reducedMotion.matches ? 1 : perspectiveScale);
      chapter.style.setProperty('--jar-y', `${reducedMotion.matches ? 0 : 35 * (1 - entrance)}px`);
      chapter.style.setProperty('--jar-opacity', reducedMotion.matches ? 1 : smooth(clamp((phase - .22) / .12)) * (1 - smooth(clamp((phase - .76) / .07))));
      chapter.style.setProperty('--copy-opacity', copy);
      chapter.style.setProperty('--copy-y', `${reducedMotion.matches ? 0 : 18 * (1 - copy)}px`);
      chapter.style.setProperty('--approach-opacity', reducedMotion.matches || (i === 0 && cursor < .18) ? 0 : 1 - smooth(clamp((phase - .19) / .12)));
      chapter.style.setProperty('--flyby-opacity', Math.sin(clamp((phase - 0.72) / 0.28) * Math.PI));
      chapter.style.setProperty('--flyby-x', `${-35 + clamp((phase - 0.72) / 0.28) * 130}vw`);
      chapter.querySelector('.chapter-copy').inert = copy < 0.05;
    }
  });

  if (visibleIndex !== activeChapter) {
    activeChapter = visibleIndex;
    chapters.forEach((chapter, i) => {
      chapter.inert = i !== visibleIndex;
      chapter.setAttribute('aria-hidden', String(i !== visibleIndex));
    });
    navigation.forEach((button, i) => {
      button.classList.toggle('active', i === visibleIndex);
      button.setAttribute('aria-pressed', String(i === visibleIndex));
    });
    document.querySelector('#chapter-count').textContent = `0${visibleIndex + 1} / 06`;
  }
  document.querySelector('#journey-progress').style.transform = `scaleX(${progress})`;
  if (flightScene && !reducedMotion.matches) flightScene.render(cursor);
  const heroProgress = clamp(cursor / .18);
  const intro = document.querySelector('#flight-intro');
  const introOpacity = reducedMotion.matches ? (cursor < .18 ? 1 : 0) : 1 - smooth(heroProgress);
  intro.style.opacity = introOpacity;
  intro.style.visibility = introOpacity > 0 ? 'visible' : 'hidden';
  intro.inert = introOpacity < .05;
  intro.setAttribute('aria-hidden', String(introOpacity < .05));
  if (!reducedMotion.matches) {
    document.querySelector('.opening-background').style.transform = `scale(${1.01 + heroProgress * 0.15})`;
    document.querySelector('.opening-copy').style.transform = `translateY(${-heroProgress * 60}px)`;
    document.querySelector('.opening-copy').style.opacity = 1 - smooth(clamp(heroProgress * 1.5));
  }
}

function requestFrame() {
  if (!frameRequested) { frameRequested = true; requestAnimationFrame(draw); }
}
addEventListener('scroll', requestFrame, {passive: true});
addEventListener('resize', measure);
async function startFlight() {
  if (flightScene || flightLoading || reducedMotion.matches) return;
  flightLoading = true;
  try {
    const module = await import('./flight.js?v=flight-20261014');
    const created = await module.createFlight(stage, products);
    if (reducedMotion.matches) created?.dispose();
    else flightScene = created;
  } catch {
    // The complete CSS journey remains available if WebGL cannot start.
  } finally { flightLoading = false; requestFrame(); }
}
reducedMotion.addEventListener('change', () => {
  if (reducedMotion.matches && flightScene) { flightScene.dispose(); flightScene = null; }
  else startFlight();
  requestFrame();
});
navigation.forEach(button => button.addEventListener('click', () => {
  scrollTo({top: journeyStart + (Number(button.dataset.scene) + 0.64) * chapterDistance, behavior: reducedMotion.matches ? 'instant' : 'smooth'});
}));
document.querySelectorAll('[data-begin-flight]').forEach(link => link.addEventListener('click', event => {
  event.preventDefault();
  scrollTo({top:journeyStart + .64 * chapterDistance, behavior:reducedMotion.matches ? 'instant' : 'smooth'});
}));

document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-filter]').forEach(other => {
    const selected = other === button;
    other.classList.toggle('selected', selected);
    other.setAttribute('aria-pressed', String(selected));
  });
  let count = 0;
  document.querySelectorAll('[data-group]').forEach(card => {
    card.hidden = button.dataset.filter !== 'all' && card.dataset.group !== button.dataset.filter;
    if (!card.hidden) count++;
  });
  document.querySelector('#filter-status').textContent = `Показано ${count} серий`;
}));

function openProduct(index, trigger) {
  const product = products[index];
  lastFocused = trigger;
  document.querySelector('#detail-name').textContent = product.name;
  document.querySelector('#detail-title').textContent = product.title;
  document.querySelector('#detail-description').textContent = product.description;
  document.querySelector('#detail-flavor').textContent = `Вкус / ${product.flavor}`;
  const jar = document.querySelector('#detail-jar');
  jar.style.cssText = product.photoStyle;
  const photo = document.querySelector('#detail-photo');
  photo.src = product.photo;
  photo.alt = `Оригинальная упаковка Moonvit — ${product.title}`;
  document.querySelector('.detail-art').style.setProperty('--accent', product.accent);
  const ingredients = product.ingredients.map(ingredient => {
    const item = document.createElement('li'); item.textContent = ingredient; return item;
  });
  document.querySelector('#detail-ingredients').replaceChildren(...ingredients);
  document.querySelector('#detail-wb').href = product.wb;
  document.querySelector('#detail-ozon').href = product.ozon;
  dialog.showModal();
  document.body.classList.add('dialog-open');
}
document.querySelectorAll('[data-product]').forEach(button => button.addEventListener('click', () => openProduct(Number(button.dataset.product), button)));
document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
dialog.addEventListener('close', () => {
  document.body.classList.remove('dialog-open');
  if (lastFocused?.isConnected && !lastFocused.closest('[inert]')) lastFocused.focus({preventScroll:true});
});

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); } });
}, {threshold:0.12});
document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
measure();
startFlight();
