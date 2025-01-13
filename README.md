## How to setup and run locally:
`nvm install 20.9.0`
`nvm use 20.9.0`
`npm i -g yarn cross-env wait-on concurrently`
`yarn install`
`npm start`

## How to test build locally
`npm i -g electron-builder`
`electron-builder --windows`

### How to trigger a release build:
`git tag v1.0.8 && git push --tags`

# Common Errors:

## [win10 command prompt] `npm run build`:
- Error: `app-builder.exe process failed ERR_ELECTRON_BUILDER_CANNOT_EXECUTE Exit code: 1` / `downloaded url=https://github.com/electron-userland/electron-builder-binaries/releases/download/winCodeSign-2.6.0/winCodeSign-2.6.0.7z duration=1.695s ⨯ exit status 2`
- Fix: Run terminal / command prompt as admin.

```
# Windows Debugging
rmdir /s /q dist
rmdir /s /q node_modules
npm cache clean --force
yarn install
```

### How to setup Mac Apple Store signing:

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
    - Navigate to Apple App Store Connect (https://appstoreconnect.apple.com/) -> Users and Access -> Click the 'integrations' tab at the top of the page, click on 'App Store Connect API' on the left, and under 'Team Keys' click the blue plus icon to generate a new key with ADMIN access (https://appstoreconnect.apple.com/access/integrations/api).
    - I generated a key with the name 'RenderTune_2025'
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
    - tbd