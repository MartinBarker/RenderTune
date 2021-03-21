# RenderTune
RenderTune is a free, open-source electron app that can combine audio + image file(s) into video files. You can render videos from a single audio file or combine multiple audio files into one video. RenderTune offers ordering options if you want to include multiple songs in a single video so you can make sure they appear in the order you wish. You can also specify the output video location, resolution, and aspects such as wheather or not to add padding to the video, and what color to make the background padding.

## How to run RenderTune locally:
- clone this repo and cd into the folder
- If you are on windows I suggest using command prompt, as that can launch electron apps fine, where as Windows Linux Subsystem has troubles launching electron apps. If you are on a mac, download brew and use your mac terminal.
- run `npm i` and `npm i -g electron` if you haven't already installed electron globally.
- if you are on mac; run `sh buildffmpeg.sh` to staticlly build a version of ffmpeg that can be sandboxed and distributed to the mac apple store (mas)
- run `electron .` to start the program

## Releasing a new version for electron auto-update:
- Change version number in package.json
- Make sure you have local vars for GH_TOKEN (win) and APPLEID/APPLEIDPASS (mac)
- (win) run `electron-builder build --win --publish always` or `npm run build-win-publish` to generate `RenderTune-Setup-#.#.#.exe`

## Releasing new build on Mac Apple Store (mas):
- compile and build the sandboxed ffmpeg binaries by running the buildffmpeg.sh script with this command: `sh buildffmpeg.sh ` which will create the ffmpeg-mac/ folder.
- verify your local ffmpeg-mac/ folder has no dynamic libraries by running this command: `otool -L ffmpeg-mac/ffmpeg | grep /usr/local`
- if any files show up after running this command, delete or move those files, rebuild ffmpeg, and run the command again to verify there are no dynamic libraries in your local ffmpeg-mac/ folder
- build the mas package with `electron-builder build --mac`
- sign the mas package by running the mas-sign-script with this command: `sh signmasscript.sh`
- take the outputted .pkg file and use transporter to upload it to the mac apple store review process

## Releasing new build on Windows App Store:
- Build the dist/win-unpacked folder by running the command `electron-builder build --win`
- Once the windows build has finished, run the following powershell command to tag and create an .appx file:
```
electron-windows-store --input-directory C:\Users\marti\Documents\projects\RenderTune\dist\win-unpacked --output-directory C:\Users\marti\Documents\projects\RenderTuneAppx --package-version 0.2.1.0 --package-name RenderTune --package-display-name 'RenderTune' --publisher-display-name 'martinbarker' --identity-name 1845martinbarker.digify -a C:\Users\marti\Documents\projects\RenderTune-cleanbuild\Resources\
```
- Take the outputted .appx file and submit it to the Windows Store (make sure to include app tile images in the submission)
