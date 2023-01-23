import React, { useState, useEffect } from 'react';
import "./Border.css"
const { ipcRenderer } = window.require("electron");

function Border() {

  const [appVersion, setAppVersion] = useState();
  const [appUpdateStatus, setAppUpdateStatus] = useState(null);

  useEffect(() => {
    getAppVersion()
  }, []);

  //make request to main.js to get app version
  function getAppVersion() {
    ipcRenderer.send('app_version');
    ipcRenderer.on('app_version', (event, arg) => {
      ipcRenderer.removeAllListeners('app_version');
      setAppVersion(arg.version)
    });
  }

  ipcRenderer.on('update_available', () => {
    ipcRenderer.removeAllListeners('update_available');
    setAppUpdateStatus('downloading')
    //message.innerText = 'A new update is available. Downloading now...';
    //notification.classList.remove('hidden');
  });

  ipcRenderer.on('update_downloaded', () => {
    ipcRenderer.removeAllListeners('update_downloaded');
    setAppUpdateStatus('downloaded')
    //message.innerText = 'Update Downloaded. It will be installed on restart. Restart now?';
    //restartButton.classList.remove('hidden');
    //notification.classList.remove('hidden');
  });

  function closeNotification() {
    //notification.classList.add('hidden');
  }
  function restartApp() {
    ipcRenderer.send('restart_app');
  }

  return (
    <div>


      <div id='frameWrapper'>
        <header id="titlebar">
          <div id="drag-region">
            <span>RenderTune v{appVersion}</span>
            <div id="window-controls">

              <div className="button" id="min-button">
              
                <svg draggable="false" className="" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1472 992v480q0 26-19 45t-45 19h-384v-384h-256v384h-384q-26 0-45-19t-19-45v-480q0-1 .5-3t.5-3l575-474 575 474q1 2 1 6zm223-69l-62 74q-8 9-21 11h-3q-13 0-21-7l-692-577-692 577q-12 8-24 7-13-2-21-11l-62-74q-8-10-7-23.5t11-21.5l719-599q32-26 76-26t76 26l244 204v-195q0-14 9-23t23-9h192q14 0 23 9t9 23v408l219 182q10 8 11 21.5t-7 23.5z" />
                </svg>

              </div>

              <div className="button" id="max-button">
                <img className="icon" srcSet="./icons/max-w-10.png 1x, ./icons/max-w-12.png 1.25x, ./icons/max-w-15.png 1.5x, ./icons/max-w-15.png 1.75x, ./icons/max-w-20.png 2x, ./icons/max-w-20.png 2.25x, ./icons/max-w-24.png 2.5x, ./icons/max-w-30.png 3x, ./icons/max-w-30.png 3.5x" draggable="false" />
              </div>

              <div className="button" id="restore-button">
                <img className="icon" srcSet="./icons/restore-w-10.png 1x, ./icons/restore-w-12.png 1.25x, ./icons/restore-w-15.png 1.5x, ./icons/restore-w-15.png 1.75x, ./icons/restore-w-20.png 2x, ./icons/restore-w-20.png 2.25x, ./icons/restore-w-24.png 2.5x, ./icons/restore-w-30.png 3x, ./icons/restore-w-30.png 3.5x" draggable="false" />
              </div>

              <div className="button" id="close-button">
                <img className="icon" srcSet="./icons/close-w-10.png 1x, ./icons/close-w-12.png 1.25x, ./icons/close-w-15.png 1.5x, ./icons/close-w-15.png 1.75x, ./icons/close-w-20.png 2x, ./icons/close-w-20.png 2.25x, ./icons/close-w-24.png 2.5x, ./icons/close-w-30.png 3x, ./icons/close-w-30.png 3.5x" draggable="false" />
              </div>

            </div>
          </div>
        </header>
        <div id="main">
          <h1>Hello World!</h1>
          <p>Lorem ipsum dolor sit amet...</p>
          <p>Lorem ipsum dolor sit amet...</p>
          <p>Lorem ipsum dolor sit amet...</p>
          <p>Lorem ipsum dolor sit amet...</p>
        </div>
      </div >

      <div id="notification" className="hidden">
        <p id="message">Update status: {appUpdateStatus}</p>
        <button id="close-button" onClick={closeNotification}>
          Close
        </button>
        <button id="restart-button" onClick={restartApp} className={restartApp = 'restart' ? "" : "hidden"}>
          Restart
        </button>
      </div>

    </div>
  );
}

export default Border;




