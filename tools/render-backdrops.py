from pathlib import Path
import hashlib
import json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1280,'height':720},device_scale_factor=1)
 page.route('https://fonts.googleapis.com/**',lambda r:r.abort())
 def backdrop_module(route):
  code=(ROOT/'flight.js').read_text().replace('pack.visible = active && phase > .22 && departure < .1;', 'pack.visible = false;')
  route.fulfill(status=200,content_type='text/javascript',body=code)
 page.route('**/flight.js?*',backdrop_module)
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3000',wait_until='networkidle')
 page.wait_for_selector('.flight-ready')
 page.add_style_tag(content='.site-header,.cinema-stage>*:not(canvas),.skip-link{visibility:hidden!important}')
 geom=page.evaluate('({start:document.querySelector("#journey").getBoundingClientRect().top+scrollY,step:(document.querySelector("#journey").offsetHeight-document.querySelector(".cinema-stage").offsetHeight)/6})')
 for i,name in enumerate(['moon','saturn','venus','mars','earth','neptune']):
  for suffix,phase in [('-approach',.20),('',.65)]:
   page.evaluate('(y)=>scrollTo({top:y,behavior:"instant"})',geom['start']+(i+phase)*geom['step'])
   page.wait_for_timeout(200)
   page.locator('.cinema-stage').screenshot(path=str(ROOT/f'assets/worlds/{name}{suffix}.jpg'),type='jpeg',quality=90)
 assert not errors,errors
 manifest={'source':'Browser renders of the same Three.js scene used by flight.js; no text or product photographs baked into the backgrounds.', 'viewport':[1280,720], 'approach_phase':.20, 'hold_phase':.65, 'reproduce':'Start server.py, then run python3 tools/render-backdrops.py (requires Python Playwright and /usr/bin/chromium).', 'files':[{'file':str(path.relative_to(ROOT)), 'sha256':hashlib.sha256(path.read_bytes()).hexdigest()} for path in sorted((ROOT/'assets/worlds').glob('*.jpg'))]}
 (ROOT/'assets/worlds/sources.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
 print('Rendered twelve backgrounds from the live planet models',flush=True)
 b.close()
