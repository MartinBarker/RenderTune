import React, { useState, useEffect } from "react";
const { ipcRenderer } = window.require('electron');
const { google } = window.require('googleapis');
const OAuth2 = google.auth.OAuth2;

var oauth2Client = null;

const YouTube2 = () => {
    const [inputValue, setInputValue] = useState('');
    const [YouTubeAuthCode, setYouTubeAuthCode] = useState('');

    //recieve callback url YouTubeCode from backend 
    useEffect(() => {
        const handleYouTubeCode = (event, arg) => {
          console.log('YouTube2.js Code Received: ', arg)
          setYouTubeAuthCode(arg.code)
        }
        ipcRenderer.on('YouTubeCode', handleYouTubeCode);
        return () => {
          ipcRenderer.removeListener('YouTubeCode', handleYouTubeCode);
        }
      }, []);

      /*
      //call when YouTubeAuthCode state var changes
      useEffect(() => {
        // Function to call when YouTubeAuthCode changes
        const myFunction = () => {
          console.log('YouTubeAuthCode changed:', YouTubeAuthCode);
          YouTubeAuthCodeChanged();
        }
      
        // Check if YouTubeAuthCode is not empty before calling myFunction
        if (YouTubeAuthCode !== '') {
          myFunction();
        }
      }, [YouTubeAuthCode]);
      */

    //-------------------------------------
    // backend auth code begin:

    //create url
    const backendAuth_createClient = async () => {
        console.log('backendAuth_createClient()')
        let createOauth2ClientResponse = await ipcRenderer.invoke('create-oauth2client');
        console.log('createOauth2ClientResponse=', createOauth2ClientResponse)
    }

    //get url 
    const backend_getURL = async () => {
        console.log('backend_getURL()')
        let authUrl = await ipcRenderer.invoke('get-url');
        //open url in your browser
        try {
            await ipcRenderer.invoke('open-url', `${authUrl}`);
        } catch (err) {
            console.log(err)
        }
    }

    //send user auth code to backend in order to authenticate with oauth2client
    const backend_sendCodeToAuthUser = async () => {
        console.log('backend_sendCodeToAuthUser()')
        let authUserRsp = await ipcRenderer.invoke('auth-user', YouTubeAuthCode );
        console.log('authUserRsp = ', authUserRsp)
    }

    //manually send code back
    const handleInputChange = (event) => {
        setInputValue(event.target.value);
    };

    const handleSubmit = async () => {
        console.log("Input value:", inputValue);
        let authUserRsp = await ipcRenderer.invoke('auth-user', inputValue );
        console.log('authUserRsp=',authUserRsp)
        // Here you can use the inputValue as needed, e.g., pass it to a function.
    };

    const backend_uploadVideo = async () => {
        console.log("backend_uploadVideo");
        let uploadVidRsp = await ipcRenderer.invoke('upload-video');
        console.log('uploadVidRsp=',uploadVidRsp)

    }

    // backend auth code end
    //-------------------------------------



    function YouTubeAuthCodeChanged(){
        console.log('YouTubeAuthCode changed: ', YouTubeAuthCode)
        oauth2Client.getToken(decodeURIComponent(YouTubeAuthCode), function (err, token) {
            if (err) {
                console.log('YouTubeAuthCodeChanged() Error trying to retrieve access token', err.data)
            }
            clientoauth2Client.credentials = token;
            console.log('YouTubeAuthCodeChanged() done. clientoauth2Client=\n',clientoauth2Client,'\n')
        })
    }

    const getYtUrl = async () => {
        console.log("getYtUrl()")

        //get electron apiServerPort
        var apiServerPort;
        try {
            apiServerPort = await ipcRenderer.invoke('get-api-server-port');
        } catch (err) {
            console.log('apiServerPort err=', err)
        }

        //get vars from client secret google api json file 
        let clientSecret, clientId, redirectUrl = "";
        try {
            let fileContents = await ipcRenderer.invoke('read-file', `auth.json`);
            clientSecret = fileContents.installed.client_secret;
            clientId = fileContents.installed.client_id;
            redirectUrl = fileContents.installed.redirect_uris[0];
            console.log(`clientSecret=${clientSecret}\nclientId=${clientId}\nredirectUrl=${redirectUrl}\n`)
        } catch (err) {
            console.log(err)
        }

        //create new OAuth2 object
        try {
            oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);
            tempOauth2Client=oauth2Client
        } catch (err) {
            console.log(err)
        }
        
        //generate auth url
        var callbackUrl = `http://localhost:${apiServerPort}/ytCode`
        const authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: ['https://www.googleapis.com/auth/youtube.upload'],
            redirect_uri: callbackUrl
        });

        //open url in your browser
        try {
            await ipcRenderer.invoke('open-url', `${authUrl}`);
        } catch (err) {
            console.log(err)
        }

        

        /*
        //get auth signin url from martinbarker.me
        var authSigninUrl = null;
        const url = `http://localhost:8080/getYtUrl?port=${apiServerPort}`;
        await fetch(url)
            .then(response => response.json())
            .then(data => {
                authSigninUrl = data.url;
            })
            .catch(error => console.error('caught err=', error));

        
        */
    }

    const getFileContents = async () => {
        console.log('getFileContents()')
        //get vars from client secret google api json file 
        try {
            let clientSecret, clientId, redirectUrl = "";

            let fileContents = await ipcRenderer.invoke('read-file', `auth.json`);

            clientSecret = fileContents.installed.client_secret;
            clientId = fileContents.installed.client_id;
            redirectUrl = fileContents.installed.redirect_uris[0];

            console.log(`clientSecret=${clientSecret}\nclientId=${clientId}\nredirectUrl=${redirectUrl}\n`)
        } catch (err) {
            console.log(err)
        }
    }

    return (
        <>
            <br></br>
            <button onClick={backendAuth_createClient}>backendAuth_createClient</button>
            <br></br>
            <button onClick={backend_getURL}>backend_getURL</button>
            <br></br>
            <button onClick={backend_sendCodeToAuthUser}>backend_sendCodeToAuthUser</button>
            <br></br>
            <div>
                <input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    placeholder="Enter YT Auth Code"
                />
                <br></br>
                <button onClick={handleSubmit}>Submit</button>
            </div>
            <br></br>
            <button onClick={backend_uploadVideo}>backend_uploadVideo</button>
            

            <hr></hr>
            
        </>
    );
};

export default YouTube2;