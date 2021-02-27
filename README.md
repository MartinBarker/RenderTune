# digify

Developing for this app:
- clone this repo
- cd into the folder
- run `npm i` to install dependencies
- if you are on mac; run `npm run download-ffmpeg` to staticlly build a version of ffmpeg that can be sandboxed and distributed to the mac apple store (mas)
- run `electron .` to start the program
- to build the app for the mac apple store, run `npm run build-mas`
- once it has finished, sign the built app by running `sh mas-sign-script.sh` (make sure filepaths are correct for your computer)

Run `otool -L ffmpeg-mac/ffmpeg | grep /usr/local` to view fffmpeg dependencies, before building&signing app, move any dylib files to diff location

## old stuff below:

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