nvm install 20.9.0
nvm use 20.9.0
Windows: `del package-lock.json && rmdir /s /q node_modules`
## How to setup and run locally:
`yarn install`
`npm start`

## How to test build locally
`npm i -g electron-builder`
`electron-builder --windows`

### How to trigger a release build:
`git tag v1.0.8 && git push --tags`

### How to setup Mac Apple Store signing:

- Need to set the following GitHub actions secret values:
```
APPLE_API_ISSUER 
APPLE_API_KEY
APPLE_API_KEY_ID
MAC_CERTS
MAC_CERTS_PASSWORD
PROVISIONING_PROFILE_BASE64
SNAPCRAFT_STORE_CREDENTIALS
```
- Usefull links for getting MAS/Mac credentials:
    - https://github.com/marketplace/actions/electron-builder-action
    - https://samuelmeuli.com/blog/2019-12-28-notarizing-your-electron-app/
    - https://mifi.no/blog/automated-electron-build-with-release-to-mac-app-store-microsoft-store-snapcraft/


# Common Errors:

`app-builder.exe process failed ERR_ELECTRON_BUILDER_CANNOT_EXECUTE Exit code: 1`
- Reproduce: Run electron-builder on win10 command prompt
- Solution: Run terminal / command prompt as admin.


```
# Windows Debugging
rmdir /s /q dist
rmdir /s /q node_modules
npm cache clean --force
yarn install
```