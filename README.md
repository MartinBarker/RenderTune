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

## Releasing new build on Mac Apple Store (mas)
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
electron-windows-store --input-directory C:\Users\marti\Documents\projects\RenderTune\dist\win-unpacked --output-directory C:\Users\marti\Documents\projects\RenderTuneAppx --package-version 0.0.2.0 --package-name RenderTune --package-display-name 'RenderTune' --publisher-display-name `martinbarker' --identity-name 1845martinbarker.digify -a C:\Users\marti\Documents\projects\RenderTune\Resources\
```
- Take the outputted .appx file and submit it to the Windows Store (make sure to include app tile images in the submission)
