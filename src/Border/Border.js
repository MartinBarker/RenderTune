import React, { useState, useEffect } from 'react';
import "./Border.css"

const { ipcRenderer } = window.require("electron");

//const { remote } = window.require("electron").remote;


function Border() {

  const [appVersion, setAppVersion] = useState();
  const [appUpdateStatus, setAppUpdateStatus] = useState(null);
  const [windowStatus, setwindowStatus] = useState('init')

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

  //
  // Electron App frameless window controls (min/max/close)
  //
  function minimizeWindow() {
    ipcRenderer.send(`minimize-window`);
  }

  function maximizeWindow() {
    ipcRenderer.send(`maximize-window`);
    setwindowStatus('maximized')
    console.log('maximizeWindow() windowStatus=', windowStatus)
  }
  function unmaximizeWindow() {
    ipcRenderer.send(`unmaximize-window`);
    setwindowStatus('init')
    console.log('unmaximizeWindow() windowStatus=', windowStatus)
  }

  function maxUnmaxWindow() {
    ipcRenderer.send(`max-unmax-window`);
    setwindowStatus('maximized')
  }
  function closeWindow() {
    ipcRenderer.send(`close-window`)
  }
  function dragEventHandler(){
    console.log('dragEventHandler()')
  }

  //
  //  Electron App Auto-Update logic 
  //
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



  //
  // Render component UI DOM content
  //
  return (
    <div>


      <div draggable="true" onDragStart={dragEventHandler} id='frameWrapper'>
        <header  id="titlebar" >
          <div id="drag-region">
            <span><a>windowStatus={windowStatus} unmax={}</a></span>
            <div id="window-controls">

              <div className="button" onClick={minimizeWindow}>
                MIN
              </div>

              {windowStatus==='init' &&
                <div className="button" onClick={maximizeWindow}>
                MAX
              </div>
              }

              {windowStatus==='maximized' &&
                <div className="button" onClick={unmaximizeWindow}>RST</div>
              }

              <div className="button" onClick={closeWindow}>
                CLOSE
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

/*

module.exports = {
 getCurrentWindow,
  openMenu,
  minimizeWindow,
  maximizeWindow,
  unmaximizeWindow,
  maxUnmaxWindow,
  isWindowMaximized,
  closeWindow
  closeWindow,
}
*/




