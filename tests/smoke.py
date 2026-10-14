"""Browser checks for the scroll journey, product dialogs, and recovery paths.

Run server.py first, then: python3 tests/smoke.py
Requires Python Playwright and Chromium. MOONVIT_TEST_URL may point to a preview.
"""
import os
from playwright.sync_api import sync_playwright

URL = os.environ.get('MOONVIT_TEST_URL', 'http://127.0.0.1:3000/')
NAMES = ['Luna', 'Saturn', 'Venus', 'Mars', 'Earth', 'Neptune']


def open_site(browser, errors, **options):
    page = browser.new_page(**options)
    page.route('https://fonts.googleapis.com/**', lambda route: route.abort())
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.on('console', lambda message: errors.append(message.text)
            if message.type == 'error' and ('THREE' in message.text or 'shader' in message.text.lower()) else None)
    page.goto(URL, wait_until='networkidle')
    return page


def go_to_phase(page, cursor):
    page.evaluate('''cursor => {
      const journey = document.querySelector('#journey');
      const stage = document.querySelector('.cinema-stage');
      const start = journey.getBoundingClientRect().top + scrollY;
      const step = (journey.offsetHeight - stage.offsetHeight) / 6;
      scrollTo({top:start + cursor * step, behavior:'instant'});
    }''', cursor)
    page.wait_for_function('''cursor => {
      const expected = Math.min(5, Math.floor(cursor));
      return document.querySelectorAll('[data-scene]')[expected].getAttribute('aria-pressed') === 'true';
    }''', arg=cursor)
    page.wait_for_function('''cursor => {
      const chapter = document.querySelectorAll('[data-chapter]')[Math.min(5, Math.floor(cursor))];
      return cursor % 1 < .49 || getComputedStyle(chapter.querySelector('.chapter-copy')).opacity === '1';
    }''', arg=cursor)


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(executable_path='/usr/bin/chromium', headless=True, args=['--no-sandbox'])
    errors = []
    page = open_site(browser, errors, viewport={'width':1280, 'height':720})
    page.wait_for_selector('.flight-ready')
    page.locator('[data-begin-flight]').first.click()
    page.wait_for_function("document.querySelector('#flight-intro').inert")

    for index, name in enumerate(NAMES):
        go_to_phase(page, index + .65)
        page.wait_for_function('z => Math.abs(Number(document.querySelector(".cinema-stage").dataset.cameraZ)-z)<.05', arg=-100*index-2)
        trigger = page.locator(f'[data-chapter="{index}"] [data-product]')
        trigger.click()
        assert page.locator('#detail-name').inner_text() == name
        page.locator('#detail-photo').evaluate('image => image.decode()')
        assert page.locator('#detail-wb').get_attribute('href').startswith('https://www.wildberries.ru/catalog/')
        assert page.locator('#detail-ozon').get_attribute('href').startswith('https://www.ozon.ru/product/')
        page.keyboard.press('Escape')
        assert not page.locator('#product-dialog').evaluate('dialog => dialog.open')
        assert trigger.evaluate('element => element === document.activeElement')

    # The last product must stay readable through the end of the pinned journey.
    go_to_phase(page, 5.98)
    assert page.locator('[data-chapter="5"]').evaluate("element => Number(element.style.getPropertyValue('--jar-opacity')) === 1")
    assert page.locator('.cinema-stage').get_attribute('data-flight-phase') == 'hold'
    assert not page.locator('[data-chapter="5"] .chapter-copy').evaluate('element => element.inert')

    go_to_phase(page, 1.08)
    page.wait_for_function("document.querySelector('.cinema-stage').dataset.flightPhase === 'approach'")
    assert page.locator('[data-chapter="1"] .chapter-copy').evaluate('element => element.inert')
    page.locator('#catalog').scroll_into_view_if_needed()
    page.locator('[data-filter="beauty"]').click()
    assert page.locator('.catalog-card:visible h3').all_text_contents() == ['Earth', 'Neptune']
    page.locator('[data-filter="all"]').click()
    assert page.locator('.catalog-card:visible').count() == 6

    for width, height in [(320,900), (375,667), (390,844), (768,1024), (1024,768)]:
        page.set_viewport_size({'width':width, 'height':height})
        page.locator('[data-scene="1"]').click(force=True)
        page.wait_for_function('Math.abs(Number(document.querySelector(".cinema-stage").dataset.cameraZ)+102)<.05')
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        assert page.locator('.flight-canvas').evaluate('canvas => canvas.width > 0 && canvas.height > 0')

    # A temporary GPU context loss should show the same-model fallback, then recover.
    page.locator('.flight-canvas').evaluate('''canvas => {
      window.testContextLoss = canvas.getContext('webgl2').getExtension('WEBGL_lose_context');
      window.testContextLoss.loseContext();
    }''')
    page.wait_for_function("!document.querySelector('.cinema-stage').classList.contains('flight-ready')")
    go_to_phase(page, 5.65)
    page.wait_for_timeout(150)
    page.evaluate('window.testContextLoss.restoreContext()')
    page.wait_for_selector('.flight-ready')
    page.wait_for_function('Math.abs(Number(document.querySelector(".cinema-stage").dataset.cameraZ)+502)<.05')
    page.emulate_media(reduced_motion='reduce')
    page.wait_for_function("!document.querySelector('.flight-canvas')")
    go_to_phase(page, 5.98)
    assert not page.locator('[data-chapter="5"] .chapter-copy').evaluate('element => element.inert')
    assert not errors, errors
    browser.close()

    for failure in ['no-webgl', 'texture-failure']:
        args = ['--no-sandbox'] + (['--disable-webgl'] if failure == 'no-webgl' else [])
        browser = playwright.chromium.launch(executable_path='/usr/bin/chromium', headless=True, args=args)
        page = browser.new_page(viewport={'width':390, 'height':844})
        page.route('https://fonts.googleapis.com/**', lambda route: route.abort())
        if failure == 'texture-failure':
            page.route('**/assets/flight/moon.jpg', lambda route: route.abort())
        page.goto(URL, wait_until='networkidle')
        assert page.locator('.flight-ready').count() == 0
        page.evaluate('''async () => {
          const products = JSON.parse(document.querySelector('#product-data').textContent);
          await Promise.all(products.flatMap(product => [product.world, product.world.replace('.jpg','-approach.jpg')]).map(async source => {
            const image = new Image(); image.src = source; await image.decode();
          }));
        }''')
        for index, name in enumerate(NAMES):
            go_to_phase(page, index + .65)
            world = page.locator(f'[data-chapter="{index}"]').evaluate("element => element.style.getPropertyValue('--world')")
            assert '.jpg' in world and '/worlds/' in world
            page.locator(f'[data-chapter="{index}"] [data-product]').click()
            assert page.locator('#detail-name').inner_text() == name
            page.keyboard.press('Escape')
        go_to_phase(page, 5.98)
        assert page.locator('[data-chapter="5"]').evaluate("element => Number(element.style.getPropertyValue('--jar-opacity')) === 1")
        browser.close()

print('PASS: six scenes and dialogs, reverse scroll, final Neptune hold, filters, five viewport sizes, GPU recovery, reduced motion, no-WebGL and failed-texture fallback.')
