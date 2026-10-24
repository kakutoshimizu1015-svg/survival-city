"""Package the original engine and the separate presentation adapter."""
from pathlib import Path
import argparse,shutil,subprocess
parser=argparse.ArgumentParser();parser.add_argument('--destination',required=True);args=parser.parse_args()
root=Path(__file__).resolve().parents[1];site=Path(args.destination).resolve();dist=site/'dist'
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
for file in ['build-original-runtime.py','package-original-preview.py','verify-original-rules.cjs','verify-original-interactions.cjs','verify-district-board.cjs','verify-npc-models.cjs','verify-player-items.cjs','preview-player-items.cjs','verify-pixel-scenes.cjs','verify-mobile-ui.cjs','verify-mobile-portraits.cjs']:
 shutil.copy2(root/'scripts'/file,site/'scripts'/file)
(site/'tests').mkdir(exist_ok=True)
shutil.copy2(root/'tests/city-board-map.test.js',site/'tests/city-board-map.test.js')
print('Packaged original engine, 15 characters, 15 minigames, original assets and 3D presentation.')
