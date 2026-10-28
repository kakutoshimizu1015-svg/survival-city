"""Package the original engine and the separate presentation adapter."""
from pathlib import Path
import argparse,shutil,subprocess
parser=argparse.ArgumentParser();parser.add_argument('--destination',required=True);args=parser.parse_args()
root=Path(__file__).resolve().parents[1];site=Path(args.destination).resolve();dist=site/'dist'
subprocess.run(['python3',str(root/'scripts/build-card-balance.py')],check=True)
subprocess.run(['python3',str(root/'scripts/build-gold-engine.py')],check=True)
subprocess.run(['python3',str(root/'scripts/build-original-runtime.py')],check=True)
for name in ['index.html','classic.html','quick.html','favicon.svg','icons.svg']:
 shutil.copy2(root/name,dist/name)
shutil.copytree(root/'src',dist/'src',dirs_exist_ok=True)
shutil.copytree(root/'assets',dist/'assets',dirs_exist_ok=True,ignore=shutil.ignore_patterns('street-dusk-pixel.png'))
# Keep the previous self-contained prototype clearly named as the quick version.
shutil.copy2(root/'survival-city-offline.html',dist/'quick-offline.html')
if (dist/'survival-city-offline.html').exists():(dist/'survival-city-offline.html').unlink()
if (dist/'assets/street-dusk-pixel.png').exists():(dist/'assets/street-dusk-pixel.png').unlink()
shutil.copy2(root/'README.md',site/'README.md')
(site/'scripts').mkdir(exist_ok=True)
for file in ['build-presentation-hooks.py','build-card-balance.py','verify-mobile-repairs.cjs','verify-card-balance.cjs','build-original-runtime.py','build-gold-engine.py','verify-gold-cans.cjs','verify-city-readability.cjs','verify-npc-readability.cjs','package-original-preview.py','verify-original-rules.cjs','verify-original-interactions.cjs','verify-district-board.cjs','verify-npc-models.cjs','verify-player-items.cjs','preview-player-items.cjs','verify-pixel-scenes.cjs','verify-mobile-ui.cjs','verify-mobile-portraits.cjs','verify-mobile-map-controls.cjs','verify-mobile-flow.cjs']:
 shutil.copy2(root/'scripts'/file,site/'scripts'/file)
(site/'tests').mkdir(exist_ok=True)
for name in ['city-presentation.test.js','city-notices.test.js','combat-effects.test.js','easy-rulebook.test.js']:
 shutil.copy2(root/'tests'/name,site/'tests'/name)
shutil.copy2(root/'tests/shop-rules.test.js',site/'tests/shop-rules.test.js')
shutil.copy2(root/'tests/card-balance.test.js',site/'tests/card-balance.test.js')
shutil.copytree(root/'scripts/vendor',site/'scripts/vendor',dirs_exist_ok=True)
shutil.copy2(root/'tests/npc-impact.test.js',site/'tests/npc-impact.test.js')
shutil.copy2(root/'tests/city-random.test.js',site/'tests/city-random.test.js')
shutil.copy2(root/'tests/gold-rules.test.js',site/'tests/gold-rules.test.js')
shutil.copy2(root/'tests/city-board-map.test.js',site/'tests/city-board-map.test.js')
print('Packaged original engine, 15 characters, 15 minigames, original assets and 3D presentation.')
