import React, { useState, useEffect } from 'react';
import './Frame.css';
import RenderTuneLogo from './icons/rendertuneLogo.svg';

const { ipcRenderer } = window.require('electron');

function Frame() {
  const [appVersion, setAppVersion] = useState();
  const [appUpdateStatus, setAppUpdateStatus] = useState(null);
  const [windowStatus, setWindowStatus] = useState('init');

  useEffect(() => {
    ipcRenderer.send('app_version');
    ipcRenderer.on('app_version', handleAppVersion);
    return () => {
      ipcRenderer.removeAllListeners('app_version');
    };
  }, []);

  function handleAppVersion(event, arg) {
    setAppVersion(arg.version);
  }

  function minimizeWindow() {
    ipcRenderer.send('minimize-window');
  }

  function maximizeWindow() {
    ipcRenderer.send('maximize-window');
    setWindowStatus('maximized');
  }

  function unmaximizeWindow() {
    ipcRenderer.send('unmaximize-window');
    setWindowStatus('init');
  }

  function maxUnmaxWindow() {
    ipcRenderer.send('max-unmax-window');
    setWindowStatus('maximized');
  }

  function closeWindow() {
    ipcRenderer.send('close-window');
  }

  function dragEventHandler() {
    console.log('dragEventHandler()');
  }

  ipcRenderer.on('update_available', () => {
    setAppUpdateStatus('downloading');
  });

  ipcRenderer.on('update_downloaded', () => {
    setAppUpdateStatus('downloaded');
  });

  function closeNotification() {
    // notification.classList.add('hidden');
  }

  function restartApp() {
    ipcRenderer.send('restart_app');
  }

  return (<>
        <div>
            {/* Frame */}
            <div onDragStart={dragEventHandler} id='frameWrapper'>
                {/* Titlebar */}
                <header draggable="true" id="titlebar" >
                    <div className="dragRegion">
                        {/* rendertune logo square */}
                        <div><img className='titlebarLogo' src={RenderTuneLogo} /> </div>

                        {/* rendertune logo, title, and version */}
                        <div id="windowTitle"> <span className='titlebarText'>RenderTune v{appVersion}</span></div>

                        {/* window control buttons */}
                        <div id="window-controls">

                            <div className="button" onClick={minimizeWindow}>
                                <svg className="windowButtonIcon" viewBox="0 0 512 512">
                                    <path d="M0 456C0 442.7 10.75 432 24 432H488C501.3 432 512 442.7 512 456C512 469.3 501.3 480 488 480H24C10.75 480 0 469.3 0 456z" />
                                </svg>
                            </div>

                            {windowStatus === 'init' &&
                                <div className="button" onClick={maximizeWindow}>
                                    <svg className="windowButtonIcon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                                        <path d="M7.724 65.49C13.36 55.11 21.79 46.47 32 40.56C39.63 36.15 48.25 33.26 57.46 32.33C59.61 32.11 61.79 32 64 32H448C483.3 32 512 60.65 512 96V416C512 451.3 483.3 480 448 480H64C28.65 480 0 451.3 0 416V96C0 93.79 .112 91.61 .3306 89.46C1.204 80.85 3.784 72.75 7.724 65.49V65.49zM48 416C48 424.8 55.16 432 64 432H448C456.8 432 464 424.8 464 416V224H48V416z" />
                                    </svg>
                                </div>
                            }

                            {windowStatus === 'maximized' &&
                                <div className="button" onClick={unmaximizeWindow}>
                                    <svg className="windowButtonIcon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                                        <path d="M432 48H208C190.3 48 176 62.33 176 80V96H128V80C128 35.82 163.8 0 208 0H432C476.2 0 512 35.82 512 80V304C512 348.2 476.2 384 432 384H416V336H432C449.7 336 464 321.7 464 304V80C464 62.33 449.7 48 432 48zM320 128C355.3 128 384 156.7 384 192V448C384 483.3 355.3 512 320 512H64C28.65 512 0 483.3 0 448V192C0 156.7 28.65 128 64 128H320zM64 464H320C328.8 464 336 456.8 336 448V256H48V448C48 456.8 55.16 464 64 464z" />
                                    </svg>
                                </div>
                            }

                            <div id="closeButton" className="button" onClick={closeWindow}>
                                <svg className="windowButtonIcon" viewBox="0 0 50 50" width="50px" height="50px">
                                    <path d="M 7.71875 6.28125 L 6.28125 7.71875 L 23.5625 25 L 6.28125 42.28125 L 7.71875 43.71875 L 25 26.4375 L 42.28125 43.71875 L 43.71875 42.28125 L 26.4375 25 L 43.71875 7.71875 L 42.28125 6.28125 L 25 23.5625 Z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </header>
                {/* Sidebar */}
                <div class="sidenav">
                  <div style={{ background: '#254053', height: '100%', width:'52px', position: 'fixed'}}>


                  </div>
              </div>
            </div>
            {/* Update Popup Notification */}
            <div id="updateNotificationPopup" className="hidden">
                <p id="message">Update status: {appUpdateStatus}</p>
                <button id="close-button" onClick={closeNotification}>Close</button>
                <button id="restart-button" onClick={restartApp} className={restartApp = 'restart' ? "" : "hidden"}>Restart</button>
            </div>
        </div>
    </>);
}
export default Frame;