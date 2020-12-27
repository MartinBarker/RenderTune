# digify

Download for windows:
- Download the installer.exe for auto-updating
- or download the portable .exe (no auto-update)

Download for windows:
- Download the .dmg installer for auto-updating

Download for Linux:
- Download the .appImage files
- Make it an executable by running this command on the file:
`$ chmod a+x digify-0.0.6.AppImage`
Note: When running this command, make sure the filename is correct.

Developing for this app:
- need a .env file
- run `npm run deploy` and publish the release


Mac MAS commands:
sudo rm -rf dist/
electron-builder build --mac
sudo codesign --deep --force --verbose --sign "C~~~~~~3" dist/mas/Digify-mac.app
