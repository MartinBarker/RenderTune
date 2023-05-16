import React, { useState } from "react";
const { ipcRenderer, shell } = window.require('electron');

const YouTube = () => {

  const beginYt = async () => {
    console.log('beginYt()')

    //get apiServerPort
    var apiServerPort = null;
    try {
      apiServerPort = await ipcRenderer.invoke('get-api-server-port');
    } catch (err) {
      console.log('apiServerPort err=', err)
    }
    console.log('apiServerPort=', apiServerPort)

    //get auth signin url
    var authSigninUrl = null;
    const url = `https://martinbarker.me/getYtUrl?port=${apiServerPort}`;
    await fetch(url)
      .then(response => response.json())
      .then(data => {
        authSigninUrl = data.url; // set authSigninUrl to data.url
        console.log('got rsp:', authSigninUrl);
      })
      .catch(error => console.error('caught err=', error));

    console.log('authSigninUrl=', authSigninUrl);
    //open url in your browser
    let urlRsp = null;
    try {
      console.log('pass: ', authSigninUrl)
      urlRsp = await ipcRenderer.invoke('open-url', `${authSigninUrl}`);
    } catch (err) {
      console.log(err)
    }

  }

  function openURL(url) {
    shell.openPath(url)
      .then(() => {
        console.log('URL opened successfully');
      })
      .catch((err) => {
        console.error('Failed to open URL:', err);
      });
  }

  return (
    <>
      <button onClick={beginYt} >begin yt</button>
    </>
  );
};

export default YouTube;
