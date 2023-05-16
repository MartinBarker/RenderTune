import React, { useState, useEffect } from "react";
const { ipcRenderer, shell } = window.require('electron');

const YouTube = () => {

  const [YouTubeAuthCode, setYouTubeAuthCode] = useState('');

  const beginYt = async () => {

    //get apiServerPort
    var apiServerPort = null;
    try {
      apiServerPort = await ipcRenderer.invoke('get-api-server-port');
    } catch (err) {
      console.log('apiServerPort err=', err)
    }

    //get auth signin url from martinbarker.me
    var authSigninUrl = null;
    const url = `https://martinbarker.me/getYtUrl?port=${apiServerPort}`;
    await fetch(url)
      .then(response => response.json())
      .then(data => {
        authSigninUrl = data.url;
      })
      .catch(error => console.error('caught err=', error));

    //open url in your browser
    try {
      await ipcRenderer.invoke('open-url', `${authSigninUrl}`);
    } catch (err) {
      console.log(err)
    }
  }

  async function getYouTubeToken() {
    if (YouTubeAuthCode != "" && YouTubeAuthCode != null) {
      try {
        console.log('getYouTubeToken() YouTubeAuthCode=',YouTubeAuthCode)
        const encodedYouTubeAuthCode = encodeURIComponent(YouTubeAuthCode);
        //const url = `https://martinbarker.me/getYtToken?code=${encodedYouTubeAuthCode}`;
        const url = `http://localhost:8080/getYtToken?code=${encodedYouTubeAuthCode}`;

        
        await fetch(url)
          .then(response => response.json())
          .then(data => {
            console.log(`getYouTubeToken() data=`, data)
          })
          .catch(error => console.error('getYouTubeToken() err=', error));
      } catch (err) {
        console.error('getYouTubeToken() err=', err)
      }
    }
  }

  useEffect(() => {
    const handleYouTubeCode = (event, arg) => {
      console.log('YouTubeCode Received: ', arg)
      setYouTubeAuthCode(arg.code)
    }
    ipcRenderer.on('YouTubeCode', handleYouTubeCode);
    return () => {
      ipcRenderer.removeListener('YouTubeCode', handleYouTubeCode);
    }
  }, []);

  useEffect(() => {
    // Function to call when YouTubeAuthCode changes
    const myFunction = () => {
      console.log('YouTubeAuthCode changed:', YouTubeAuthCode);
      getYouTubeToken()
    }
    myFunction();
  }, [YouTubeAuthCode]);


  return (
    <>
      <button onClick={beginYt} >begin yt</button>
    </>
  );
};

export default YouTube;
