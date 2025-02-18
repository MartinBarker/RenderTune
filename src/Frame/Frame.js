import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './Frame.module.css';

const Sidebar = ({ children }) => {
  const [appVersion, setAppVersion] = useState('');
  const [windowStatus, setWindowStatus] = useState('init');
  const [darkMode, setDarkMode] = useState(false);
  const [showUpdateNotification, setShowUpdateNotification] = useState(false); // Add state to control visibility
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleAppVersion = (version) => {
      // Ensure you are setting a string, not an object
      setAppVersion(version.version);  // Assuming the object has a property 'version'
    };

    window.api.send('app_version');
    window.api.receive('app_version', handleAppVersion);

    window.api.receive('update_available', () => {
      console.log('update_available received ')
      setShowUpdateNotification(true); // Show notification when update is available
      displayUpdateNotification('A new update is available. Downloading now...');
    });

    window.api.receive('update_downloaded', () => {
      setShowUpdateNotification(true); // Show notification when update is downloaded
      displayUpdateNotification('Update Downloaded. It will be installed on restart. Restart now?', true);
    });

    return () => {
      window.api.removeAllListeners('app_version');
      window.api.removeAllListeners('update_available');
      window.api.removeAllListeners('update_downloaded');
    };
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle(styles.darkMode, !darkMode);
  };

  const windowControls = {
    minimize: () => window.api.send('minimize-window'),
    maximize: () => {
      window.api.send('maximize-window');
      setWindowStatus('maximized');
    },
    unmaximize: () => {
      window.api.send('unmaximize-window');
      setWindowStatus('init');
    },
    close: () => window.api.send('close-window'),
  };

  const displayUpdateNotification = (message, showRestartButton = false) => {
    const notification = document.getElementById('update-notification');
    const messageElement = document.getElementById('update-message');
    const restartButton = document.getElementById('restart-button');

    messageElement.innerText = message;
    notification.classList.remove('hidden');

    if (showRestartButton) {
      restartButton.classList.remove('hidden');
    } else {
      restartButton.classList.add('hidden');
    }
  };

  const toggleNotificationVisibility = () => {
    const notification = document.getElementById('update-notification');
    notification.classList.toggle('hidden');
  };

  const closeNotification = (event) => {
    console.log("Closing notification"); // This will log to the console when the function is triggered
    event.stopPropagation();
    const notification = document.getElementById('update-notification');
    notification.classList.add('hidden');
  };

  const restartApp = () => {
    window.api.send('restart_app');
  };

  return (
    <div className={`${styles.container} ${darkMode ? styles.darkMode : ''}`}>
      <div className={styles.sidenav}>

        {/* Sidebar App Icon */}
        <div className={styles.sidenavHeader}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="381.5823669433594 90.11702728271484 265.5900573730469 539.7635498046875"
            className={styles.appIcon}
          >
            <path fill="#FFF" d="M639.954 628.917c0-.862.009-1.813-.002-2.76-.238-19.604-3.581-38.553-9.717-56.868-3.243-9.677-7.301-18.912-12.462-27.529-9.234-15.412-21.677-25.949-37.386-31.691-7.462-2.731-15.084-4.724-22.734-6.62-6.575-1.632-13.117-3.398-19.495-5.854-1.312-.505-2.578-1.168-4.16-1.894.718-.674 1.197-1.152 1.699-1.597 7.667-6.739 15.357-13.438 23.002-20.213 13.949-12.362 26.353-26.499 37.797-41.738 7.924-10.55 15.103-21.663 20.857-33.886 6.317-13.43 10.756-27.592 12.662-42.661 2.592-20.535.739-40.51-6.553-59.671-4.466-11.739-11.044-21.85-19.262-30.642-5.346-5.721-11.32-10.507-17.49-15.014-10.14-7.404-20.863-13.587-31.924-19.021-9.471-4.654-19.045-9.048-28.576-13.56-.554-.263-1.092-.573-1.886-.991-.175 1.877-.488 3.636-.48 5.395.058 17.271.164 34.542.27 51.813.112 17.753.24 35.505.362 53.255l.467 68.946c.095 13.968.204 27.935.282 41.902.125 22.571.238 45.141.341 67.709a254.27 254.27 0 0 1-.979 23.701c-1.099 12.356-4.216 24.13-8.282 35.609-4.16 11.745-9.962 22.384-17.578 31.704-8.932 10.938-19.188 19.8-31.695 25.042-7.478 3.133-15.193 5.295-23.034 6.833-17.008 3.331-33.086-.026-48.384-8.801-5.573-3.194-9.283-8.18-11.615-14.576-2.451-6.731-3.141-13.56-1.592-20.776 3.784-17.63 11.203-33.088 21.585-46.829 13.311-17.616 29.331-31.108 48.508-39.644 9.227-4.104 18.883-6.131 28.768-6.994 8.956-.778 17.705.562 26.403 2.73.656.166 1.312.362 1.979.445 1.292.16 1.954-.398 2.18-1.861.115-.739.126-1.508.122-2.262-.093-14.655-.203-29.312-.293-43.969-.062-9.907-.084-19.816-.147-29.723-.143-22.434-.296-44.866-.45-67.297-.11-15.96-.229-31.925-.339-47.889-.141-20.711-.274-41.421-.413-62.133-.114-16.857-.256-33.714-.339-50.572a52598.61 52598.61 0 0 1-.299-74.315c-.023-6.677.003-13.35.04-20.027.007-1.292.169-2.583.259-3.876.125-.044.25-.088.376-.13.275.61.568 1.211.822 1.831 2.747 6.679 5.382 13.42 8.259 20.029a616.31 616.31 0 0 0 9.573 20.904c3.81 7.924 7.699 15.804 11.749 23.578 7.468 14.347 16.146 27.736 25.793 40.344 14.289 18.678 28.48 37.455 42.771 56.133 2.672 3.492 5.572 6.766 8.428 10.076 7.315 8.471 12.531 18.417 16.577 29.239 4.255 11.372 6.799 23.245 8.354 35.403 1.204 9.419 1.651 18.877 1.243 28.406-.873 20.262-6.927 38.241-18.263 54.033-6.279 8.747-13.139 16.854-20.341 24.647-10.511 11.377-21.577 22.018-33.041 32.136-8.572 7.567-17.412 14.729-26.747 21.09-.783.534-1.538 1.124-2.303 1.694-.151.114-.275.264-.583.565.51.288.881.592 1.299.711 4.501 1.297 8.986 2.66 13.52 3.819 8.943 2.286 17.998 4.061 26.725 7.377 16.085 6.113 28.668 17.299 37.99 33.168 8.238 14.022 13.818 29.388 17.955 45.468 2.212 8.6 4.062 17.289 5.309 26.135.985 7.007 1.623 14.054 1.735 21.15.01.537-.039 1.077-.059 1.589-1.638.335-4.897.013-7.158-.725z" />
          </svg>
        </div>

        {/* Sidebar Content */}
        <div className={styles.sidenavContent}>
          {/* Home Icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className={`${styles.icon} ${styles.sidebarIcon} ${location.pathname === '/' ? styles.active : ''}`}
            onClick={() => navigate('/')}
            title="Home"
          >
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
          </svg>

          {/* New Project Icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className={`${styles.icon} ${styles.sidebarIcon} ${location.pathname === '/project' ? styles.active : ''}`}
            onClick={() => navigate('/project')}
            title="New Project"
          >
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </svg>

          {/* YouTube Icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 461.001 461.001"
            className={`${styles.icon} ${styles.sidebarIcon} ${location.pathname === '/youtube' ? styles.active : ''
              }`}
            onClick={() => navigate('/youtube')}
            title="YouTube"
            height="40px"
            width="40px"
          >
            <path d="M365.257,67.393H95.744C42.866,67.393,0,110.259,0,163.137v134.728
              c0,52.878,42.866,95.744,95.744,95.744h269.513c52.878,0,95.744-42.866,95.744-95.744V163.137
              C461.001,110.259,418.135,67.393,365.257,67.393z M300.506,237.056l-126.06,60.123c-3.359,1.602-7.239-0.847-7.239-4.568V168.607
              c0-3.774,3.982-6.22,7.348-4.514l126.06,63.881C304.363,229.873,304.298,235.248,300.506,237.056z"/>
          </svg>

          {/* Settings Icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className={`${styles.icon} ${styles.sidebarIcon} ${location.pathname === '/settings' ? styles.active : ''}`}
            onClick={() => navigate('/settings')}
            title="Settings"
          >
            <g data-name="Layer 2">
              <g data-name="menu-arrow-circle">
                <rect width="24" height="24" transform="rotate(180 12 12)" opacity="0"/>
                <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/>
                <path d="M12 6a3.5 3.5 0 0 0-3.5 3.5 1 1 0 0 0 2 0A1.5 1.5 0 1 1 12 11a1 1 0 0 0-1 1v2a1 1 0 0 0 2 0v-1.16A3.49 3.49 0 0 0 12 6z"/>
                <circle cx="12" cy="17" r="1"/>
              </g>
            </g>
          </svg>

          {/* Translate Icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            className={`${styles.icon} ${styles.sidebarIcon} ${location.pathname === '/translate' ? styles.active : ''}`}
            onClick={() => navigate('/translate')}
            title="Translate"
          >
            <path d="M4.545 6.714 4.11 8H3l1.862-5h1.284L8 8H6.833l-.435-1.286H4.545zm1.634-.736L5.5 3.956h-.049l-.679 2.022H6.18z"/>
            <path d="M0 2a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v3h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-3H2a2 2 0 0 1-2-2V2zm2-1a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H2zm7.138 9.995c.193.301.402.583.63.846-.748.575-1.673 1.001-2.768 1.292.178.217.451.635.555.867 1.125-.359 2.08-.844 2.886-1.494.777.665 1.739 1.165 2.93 1.472.133-.254.414-.673.629-.89-1.125-.253-2.057-.694-2.82-1.284.681-.747 1.222-1.651 1.621-2.757H14V8h-3v1.047h.765c-.318.844-.74 1.546-1.272 2.13a6.066 6.066 0 0 1-.415-.492 1.988 1.988 0 0 1-.94.31z"/>
          </svg>

          {/* Home Icon 
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className={`${styles.icon} ${styles.sidebarIcon} ${location.pathname === '/' ? styles.active : ''}`}
            onClick={() => navigate('/')}
            title="Home"
          >
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
          </svg>
          */}

          {/* Bug Icon 
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 -0.06 33.834 33.834"
            className={`${styles.icon} ${styles.sidebarIcon} ${location.pathname === '/bug' ? styles.active : ''}`}
            onClick={() => navigate('/bug')}
            title="Bug Report"
            height="40px"
            width="40px"
          >
            <g transform="translate(-95.748 -577)">
              <path d="M110.965,592.309a2.38,2.38,0,0,1,.489-1.434,9.29,9.29,0,0,1,1.443-1.482,10.139,10.139,0,0,0,1.321-1.372,1.985,1.985,0,0,0,.368-1.2,1.956,1.956,0,0,0-1.983-2,2.073,2.073,0,0,0-1.419.543,3.575,3.575,0,0,0-.954 1.582l-2.152-.939a5.029,5.029,0,0,1,1.724-2.656,4.626,4.626,0,0,1,2.9-.927,4.968,4.968,0,0,1,2.287.531,4.168,4.168,0,0,1,1.651 1.495,3.974,3.974,0,0,1,.612 2.175,3.688,3.688,0,0,1-.538 1.965,8.8,8.8,0,0,1-1.639 1.865,13.862,13.862,0,0,0-1.358 1.322,1.536,1.536,0,0,0-.379 1,2.85,2.85,0,0,0,.1.667h-2.2A2.737,2.737,0,0,1,110.965,592.309Zm1.467,6.968a1.851,1.851,0,0,1-1.357-.543,1.831,1.831,0,0,1-.551-1.359,1.875,1.875,0,0,1,.551-1.372,1.835,1.835,0,0,1,1.357-.556,1.87,1.87,0,0,1,1.909,1.928,1.834,1.834,0,0,1-.55 1.359A1.857,1.857,0,0,1,112.432,599.277Z"/>
              <path d="M97.222,610.717a1.475,1.475,0,0,1-.626-.14,1.459,1.459,0,0,1-.848-1.333V580.572A3.576,3.576,0,0,1,99.32,577h26.69a3.576,3.576,0,0,1,3.572,3.572v20.416a3.576,3.576,0,0,1-3.572,3.571H106.038a2.555,2.555,0,0,0-1.637.594l-6.24,5.22A1.467,1.467,0,0,1,97.222,610.717ZM99.32,579a1.574,1.574,0,0,0-1.572,1.572V608.11l5.37-4.491a4.561,4.561,0,0,1,2.92-1.06H126.01a1.573,1.573,0,0,0,1.572-1.571V580.572A1.574,1.574,0,0,0,126.01,579Z"/>
            </g>
          </svg> */}
        </div>
      </div>

      <div id="frameWrapper">
        <header className={styles.titlebar} draggable>
          <div className={styles.dragRegion}>
            <div className={styles.windowTitle}>
              <span className={styles.titlebarText}>RenderTune v{appVersion}</span>
            </div>

            <div className={styles.windowControls}>
              {/* Minimize button */}
              <button className={styles.button} onClick={windowControls.minimize}>
                <svg className={styles.windowButtonIcon} viewBox="0 0 10 1">
                  <rect width="10" height="1" />
                </svg>
              </button>

              {/* Maximize/Unmaximize button */}
              {windowStatus === 'init' ? (
                <button className={styles.button} onClick={windowControls.maximize}>
                  <svg className={styles.windowButtonIcon} viewBox="0 0 10 10">
                    <rect x="1" y="1" width="8" height="8" fill="none" stroke="white" strokeWidth="1.5" />
                  </svg>
                </button>
              ) : (
                <button className={styles.button} onClick={windowControls.unmaximize}>
                  <svg className={styles.windowButtonIcon} viewBox="0 0 10 10">
                    <rect x="1" y="1" width="8" height="8" fill="none" stroke="white" strokeWidth="1.5" />
                  </svg>
                </button>
              )}

              {/* Close button */}
              <button className={`${styles.button} ${styles.closeButton}`} onClick={windowControls.close}>
                <svg className={styles.windowButtonIcon} viewBox="0 0 10 10">
                  <path d="M0,0 L10,10 M0,10 L10,0" stroke="white" strokeWidth="1.5" />
                </svg>
              </button>
            </div>
          </div>
        </header>
      </div>
      <div className={styles.contentWrapper}>
        {children}
        {/* Notification div for update messages */}
        {showUpdateNotification && ( // Conditionally render the notification
          <div id="update-notification" className={styles.updateNotification}>
            <button className={styles.closeButton} onClick={closeNotification}>✖</button>
            <p id="update-message" style={{ color: 'black' }}></p>
            <div className={styles.notificationButtons}>
              <button onClick={closeNotification}>Close</button>
              <button id="restart-button" onClick={restartApp} className="hidden">Restart</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
