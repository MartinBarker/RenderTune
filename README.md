# RenderTune
RenderTune is a free, open-source electron app that can combine audio + image file(s) into video files. You can render videos from a single audio file or combine multiple audio files into one video. RenderTune offers ordering options if you want to include multiple songs in a single video so you can make sure they appear in the order you wish. You can also specify the output video location, resolution, and aspects such as whether or not to add padding to the video, and what color to make the background padding.

## How to run RenderTune locally:
- Clone this repo and cd into the folder
- If you are on windows I suggest using command prompt, as that can launch electron apps fine, where as Windows Linux Subsystem has troubles launching electron apps. If you are on a mac, download brew and use your mac terminal.
- Run `npm i` and `npm i -g electron` if you haven't already installed electron globally.
- Download and setup ffmpeg-mac/ folder (instructions below).
- Run `electron .` to start the program

## Install ffmpeg locally for mac (ffmpeg-mac/)
- If you are on mac; run `sh buildffmpeg.sh` to create the "ffmpeg-mac/" folder and staticlly build a version of ffmpeg that can be sandboxed and distributed to the mac apple store (mas)
- Verify your local ffmpeg-mac/ folder has no dynamic libraries by running this command: `otool -L ffmpeg-mac/ffmpeg | grep /usr/local`
- If any files show up after running this command, delete or move those files, redownload the ffmpeg-mac/ folder, then run the 'otool' command again to verify there are no dynamic libraries in your local ffmpeg-mac/ folder. 

## Releasing a new version for mac-auto-update, mas, win-auto-update, win-portable, and win-store:
- Change version number in package.json, make sure that version does not have already have a drafted release in Github, make sure you have all env vars set locally and ffmpeg-mac/ folder if you are on mac.
- Mac Apple Store (mas): On Mac OS, change package.json to have mas target, build & sign with `npm run build-mas`, upload .app file for review.
- mac-auto-update: On Mac OS, change package.json to have dmg/zip targets, remove RenderTune.pkg we crated above if it exists since we don't want to package that inside our build, build & publish by running the command `npm run build-mac-publish`.
- win-auto-update / win-portable / win-store: On Windows, make sure env vars are set by running `echo %GH_TOKEN%` in command prompt terminal, build nsis-web/portable/appx targets with command `npm run build-win-publish`, sign nsis-web with powershell command and upload for review.

## Releasing a new version for electron apps with auto-update:
- Change version number in package.json (this is the bare minimum to change).
- Make sure you have local vars set for GH_TOKEN, APPLEID, and APPLEIDPASS.
- (win) Run `electron-builder build --win --publish always` or `npm run build-win-publish` to generate an win installer with auto-update (`dist/nsis-web/RenderTune-Setup-#.#.#.exe`), a portable exe with no auto-update (`dist/RenderTune #.#.#.exe`), and a win-unpacked folder, deploy to github.
- (mac) Make sure you have your ffmpeg-mac/ folder in your repo root directory. In package.json, change `"build":{"mac":{"target": ["dmg","zip"] }}` to  only include "dmg" and "zip" in the targets. Build the dmg and publish it to Github by running the command `electron-builder build --win --publish always`. The .dmg file will now be an installer for Mac that has auto-update enabled.

## Releasing new build on Mac Apple Store (mas):
- Download and setup ffmpeg-mac/ folder (instructions above).
- In package.json, change `"build":{"mac":{"target": ["mas"] }}` to only include "mas" in the targets, to build the mas file.
- Sign the mas package by running the mas-sign-script with this command: `sh signmasscript.sh`
- Take the signed and outputted .pkg file, use transporter to upload it to the mac apple store, and submit it to the mas review process.

## Releasing new build on Windows App Store:
- Build the dist/win-unpacked folder by running the command `electron-builder build --win`
- Once the windows build has finished, run the following powershell command to tag and create an .appx file:
```
electron-windows-store --input-directory C:\Users\marti\Documents\projects\RenderTune\dist\win-unpacked --output-directory C:\Users\marti\Documents\projects\RenderTuneAppx --package-version 0.2.1.0 --package-name RenderTune --package-display-name 'RenderTune' --publisher-display-name 'martinbarker' --identity-name 1845martinbarker.digify -a C:\Users\marti\Documents\projects\RenderTune-cleanbuild\Resources\
```
- Take the outputted .appx file and submit it to the Windows Store (make sure to include app tile images in the submission)
