<p align="center"><img src="./buildAssets/header.png" title="RenderTune" width="700"></p> 

<h1 align="center">RenderTune</h1>
<p align="center">A free open-source program for macOS, Windows, and Linux to combine audio and image files into video files that can be uploaded to YouTube.</p>

<p align="center">
  <a href="https://apps.apple.com/us/app/rendertune/id1552674375"><img src="./buildAssets/mac-app-store-badge.svg" alt="Mac App Store" height="50"/></a> 
  <a href="https://www.microsoft.com/store/apps/9n5710msppf1"><img src="./buildAssets/ms-store-badge.svg" alt="MS badge" height="50"/></a> 
  <a href="https://snapcraft.io/rendertune"><img src="./buildAssets/snap-store-black.svg" alt="Snapcraft" height="50"/></a>
</p>

<p align="center">
  <a href="https://github.com/MartinBarker/RenderTune/stargazers"><img src="https://img.shields.io/github/stars/MartinBarker/RenderTune?style=social" alt="GitHub stars"></a>
  <a href="https://github.com/MartinBarker/RenderTune/fork"><img src="https://img.shields.io/github/forks/MartinBarker/RenderTune?style=social" alt="GitHub forks"></a>
  <a href="https://github.com/MartinBarker/RenderTune/releases/latest"><img src="https://img.shields.io/github/v/release/MartinBarker/RenderTune" alt="Current version"></a>
</p>

<p align="center">
  <a href="https://github.com/MartinBarker/RenderTune/releases/latest/download/RenderTune-mac.dmg">Download for macOS</a> |
  <a href="https://github.com/MartinBarker/RenderTune/releases/latest/download/RenderTune-Web-Setup.exe">Download for Windows</a> |
  <a href="https://github.com/MartinBarker/RenderTune/releases/latest/download/RenderTune.AppImage">Download for Linux</a>
</p>

## Tutorial Video (Click To Watch):
<a target="_blank" href="https://www.youtube.com/watch?v=LVnacPxquT4"><img target="_blank" src="https://i.imgur.com/Hr2ThFG.png" width="400" height="400" style="float:left" alt="RenderTune Tutorial Video" /></a>

## Download
RenderTune is available for free on the Mac Apple Store, Windows Store, and Linux Snap Store. Click any of the below badges to view the store page.

<a href="https://apps.apple.com/us/app/rendertune/id1552674375"><img src="./buildAssets/mac-app-store-badge.svg" alt="Mac App Store" height="50"/></a> 
<a href="https://www.microsoft.com/store/apps/9n5710msppf1"><img src="./buildAssets/ms-store-badge.svg" alt="MS badge" height="50"/></a> 
<a href="https://snapcraft.io/rendertune"><img src="./buildAssets/snap-store-black.svg" alt="Snapcraft" height="50"/></a>

If you want to download RenderTune without using the above stores, you can download RenderTune from the [most recent Github Release](https://github.com/martinbarker/rendertune/releases/latest/).

- [Mac OS X Installer (auto-updates): RenderTune-mac.dmg](https://github.com/martinbarker/rendertune/releases/latest/)
- [Windows Installer (auto-updates): RenderTune-Web-Setup-#.#.#.exe](https://github.com/martinbarker/rendertune/releases/latest)
- [Windows Portable: RenderTune-#.#.#.exe](https://github.com/martinbarker/rendertune/releases/latest)
- [Linux AppImage: RenderTune-#.#.#.AppImage](https://github.com/martinbarker/rendertune/releases/latest)
- [More releases](https://github.com/martinbarker/rendertune/releases/latest)


## Features:
- Use the Tracklist Table to reorder your songs by sorting the columns or dragging each song manually.
    <img src="./buildAssets/RenderTune-table.gif" style="float:left" alt="screenshot" />
- Concatenate multiple audio files to play one after another in a single outputted video file.  
    <img src="./buildAssets/RenderTune-screenshot-concat.PNG" >
- Batch render multiple videos at once and customize options for each video.
    <img src="./buildAssets/RenderTune-screenshot-batch.PNG" style="float:left" alt="screenshot">
- Video Render Options:
        <img src="./buildAssets/RenderTune-screenshot-options.PNG" style="float:left" alt="screenshot">
    - Image: Change which image to render your video with.
    - Padding: Add white or black padding to the outputted video frame.
        <img src="./buildAssets/RenderTune-screenshot-padding.png" style="float:left" alt="screenshot">
    - Resolution: Change outputted video resolution.
    - Output Dir: Change outputted video location.

- Use the "Renders" popup to track the progress of your video renders.
    <img src="./buildAssets/RenderTune-screenshot-renders.png" style="float:left" alt="screenshot">
- Supported audio formats: mp3, flac, wav, m4a, oog, wma, aiff. Supported image formats: png, jpeg, jpg, webp.
- Outputted video format: mp4. 


## How to setup and run RenderTune locally:

Clone the repo and change directory to be inside of it:

`git clone https://github.com/MartinBarker/RenderTune.git`

`cd RenderTune`

Install NVM (node package manager) and set it to download and use Node v20.9.0:

`nvm install 20.9.0`

`nvm use 20.9.0`

Download necessary packages and run:

`npm i -g yarn cross-env wait-on concurrently`

`yarn install`

`npm start`

Run one of these commands to build/install ffmpeg locally:

* `npm run download-ffmpeg-darwin-arm64`

* `npm run download-ffmpeg-darwin-x64`

* `npm run download-ffmpeg-linux-x64`

* `npm run download-ffmpeg-win32-x64`
- For windows you will need to install 7zip and set a PATH env var for "C:\Program Files\7-Zip" so that `7z` works from the command line.

## How to build locally:

`npm i -g electron-builder`

`electron-builder --windows`

## How to release a new version of RenderTune:

1. Change version number in package.json

2. Tag a new version: `git tag v1.0.8`

3. Push the tag to GitHub: `git push origin v1.0.8`

4. Edit release so that `.appx` and `.pkg` include text 'DO-NOT-DOWNLOAD'

5. Download .appx and submit it to the Microsoft store


## How to setup Mac Apple Store signing:

- Need to set the following GitHub actions secret values:
```
APPLE_API_KEY_ID
APPLE_API_ISSUER
APPLE_API_KEY
MAC_CERTS
MAC_CERTS_PASSWORD
PROVISIONING_PROFILE_BASE64
SNAPCRAFT_TOKEN
```
- Usefull links for getting MAS/Mac credentials:
    - https://github.com/marketplace/actions/electron-builder-action
    - https://samuelmeuli.com/blog/2019-12-28-notarizing-your-electron-app/
    - https://mifi.no/blog/automated-electron-build-with-release-to-mac-app-store-microsoft-store-snapcraft/

## How to set the following requirered Mac Apple Store credentials in GitHub Actions -> Repository Secrets

- APPLE_API_KEY_ID
    - Navigate to Apple App Store Connect (https://appstoreconnect.apple.com/) -> Users and Access -> Click the 'integrations' tab at the top of the page, click on 'App Store Connect API' on the left, and under 'Team Keys' click the blue plus icon to generate a new key with App Manager access (https://appstoreconnect.apple.com/access/integrations/api).
    - I generated a key with the name 'RenderTune_2025_app_manager'
    - Copy the API Key ID, and save that as the secret value. 

- APPLE_API_KEY 
    - Download the key we just made, save it as a .p8 file
    - Open that file in vscode, copy the contents, and save that as the secret value.

- PROVISIONING_PROFILE_BASE64
    - Go to certificates: Certificates, Identifiers & Profiles - Apple Developer 
    - Create and download the following certs: 
        - Developer ID Installer (downloaded) 
        - Developer ID Application (downloaded) 
        - Mac Installer Distribution (downloaded) 
        - Mac App Distribution (downloaded) 
        - Mac Development (downloaded) 
    - Drag & drop them into "login" keychain access 

    - Go to provisioning profiles: 
        - Re-generate "App Store" and "Development" provisioning profiles 
        - macOS_app_development 
        - Com.martinbarker.digifyunique 
        - Check all certificates & devices 
        - Download: macOS_app_development_digifyunique.provisionprofile 

    - App store development 
        - Com.martinbarker.digifyunique 
        - Check the newly generated "Mac App Distribution" certificate's radio box 
        - Download: mac_app_store_connect.provisionprofile 

    - Run command to get contents 
        - base64 < mac_app_store_connect.provisionprofile | pbcopy 
        - Make sure this file is the same on that is located in the root of the repo and used by package.json / electron-builder

    - Paste clipboard contents into PROVISIONING_PROFILE_BASE64 
- MAC_CERTS_PASSWORD
- MAC_CERTS
    - In keychain access, select the following, export save locally with strong password:
        - Developer ID Application: *
        - Developer ID Installer: *
        - 3rd Party Mac Developer Installer: *
        - 3rd Party Mac Developer Application: *

Add the following GH Actions secrets:
- MAC_CERTS_PASSWORD with the generated password
- MAC_CERTS to the output of this command: `base64 -i Certificates.p12 -o - | pbcopy`

- SNAPCRAFT_TOKEN
    [here](https://github.com/samuelmeuli/action-snapcraft)