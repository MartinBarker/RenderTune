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

      BORDER {appVersion}

      <div id="notification" className="hidden">
        <p id="message">Update status: {appUpdateStatus}</p>
        <button id="close-button" onClick={closeNotification}>
          Close
        </button>
        <button id="restart-button" onClick={restartApp} className={ restartApp='restart' ? "" : "hidden"}>
          Restart
        </button>
      </div>

    </div>
  );
}

export default Border;




