import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './Frame.module.css';

const Sidebar = ({ children }) => {
  const [appVersion, setAppVersion] = useState('');
  const [windowStatus, setWindowStatus] = useState('init');
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleAppVersion = (version) => {
        // Ensure you are setting a string, not an object
        setAppVersion(version.version);  // Assuming the object has a property 'version'
    };

    window.api.send('app_version');
    window.api.receive('app_version', handleAppVersion);

    return () => {
      window.api.removeAllListeners('app_version');
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

  return (
    <div className={`${styles.container} ${darkMode ? styles.darkMode : ''}`}>
      <div className={styles.sidenav}>
        <div className={styles.sidenavHeader}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="381.5823669433594 90.11702728271484 265.5900573730469 539.7635498046875"
            className={styles.appIcon}
          >
            <path fill="#FFF" d="M639.954 628.917c0-.862.009-1.813-.002-2.76-.238-19.604-3.581-38.553-9.717-56.868-3.243-9.677-7.301-18.912-12.462-27.529-9.234-15.412-21.677-25.949-37.386-31.691-7.462-2.731-15.084-4.724-22.734-6.62-6.575-1.632-13.117-3.398-19.495-5.854-1.312-.505-2.578-1.168-4.16-1.894.718-.674 1.197-1.152 1.699-1.597 7.667-6.739 15.357-13.438 23.002-20.213 13.949-12.362 26.353-26.499 37.797-41.738 7.924-10.55 15.103-21.663 20.857-33.886 6.317-13.43 10.756-27.592 12.662-42.661 2.592-20.535.739-40.51-6.553-59.671-4.466-11.739-11.044-21.85-19.262-30.642-5.346-5.721-11.32-10.507-17.49-15.014-10.14-7.404-20.863-13.587-31.924-19.021-9.471-4.654-19.045-9.048-28.576-13.56-.554-.263-1.092-.573-1.886-.991-.175 1.877-.488 3.636-.48 5.395.058 17.271.164 34.542.27 51.813.112 17.753.24 35.505.362 53.255l.467 68.946c.095 13.968.204 27.935.282 41.902.125 22.571.238 45.141.341 67.709a254.27 254.27 0 0 1-.979 23.701c-1.099 12.356-4.216 24.13-8.282 35.609-4.16 11.745-9.962 22.384-17.578 31.704-8.932 10.938-19.188 19.8-31.695 25.042-7.478 3.133-15.193 5.295-23.034 6.833-17.008 3.331-33.086-.026-48.384-8.801-5.573-3.194-9.283-8.18-11.615-14.576-2.451-6.731-3.141-13.56-1.592-20.776 3.784-17.63 11.203-33.088 21.585-46.829 13.311-17.616 29.331-31.108 48.508-39.644 9.227-4.104 18.883-6.131 28.768-6.994 8.956-.778 17.705.562 26.403 2.73.656.166 1.312.362 1.979.445 1.292.16 1.954-.398 2.18-1.861.115-.739.126-1.508.122-2.262-.093-14.655-.203-29.312-.293-43.969-.062-9.907-.084-19.816-.147-29.723-.143-22.434-.296-44.866-.45-67.297-.11-15.96-.229-31.925-.339-47.889-.141-20.711-.274-41.421-.413-62.133-.114-16.857-.256-33.714-.339-50.572a52598.61 52598.61 0 0 1-.299-74.315c-.023-6.677.003-13.35.04-20.027.007-1.292.169-2.583.259-3.876.125-.044.25-.088.376-.13.275.61.568 1.211.822 1.831 2.747 6.679 5.382 13.42 8.259 20.029a616.31 616.31 0 0 0 9.573 20.904c3.81 7.924 7.699 15.804 11.749 23.578 7.468 14.347 16.146 27.736 25.793 40.344 14.289 18.678 28.48 37.455 42.771 56.133 2.672 3.492 5.572 6.766 8.428 10.076 7.315 8.471 12.531 18.417 16.577 29.239 4.255 11.372 6.799 23.245 8.354 35.403 1.204 9.419 1.651 18.877 1.243 28.406-.873 20.262-6.927 38.241-18.263 54.033-6.279 8.747-13.139 16.854-20.341 24.647-10.511 11.377-21.577 22.018-33.041 32.136-8.572 7.567-17.412 14.729-26.747 21.09-.783.534-1.538 1.124-2.303 1.694-.151.114-.275.264-.583.565.51.288.881.592 1.299.711 4.501 1.297 8.986 2.66 13.52 3.819 8.943 2.286 17.998 4.061 26.725 7.377 16.085 6.113 28.668 17.299 37.99 33.168 8.238 14.022 13.818 29.388 17.955 45.468 2.212 8.6 4.062 17.289 5.309 26.135.985 7.007 1.623 14.054 1.735 21.15.01.537-.039 1.077-.059 1.589-1.638.335-4.897.013-7.158-.725z" />
          </svg>
        </div>

        <div className={styles.sidenavContent}>
          {/* Home Icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className={`${styles.icon} ${styles.sidebarIcon} ${
              location.pathname === '/' ? styles.active : ''
            }`}
            onClick={() => navigate('/')}
          >
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>

          {/* YouTube Icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 461.001 461.001"
            className={`${styles.icon} ${styles.sidebarIcon} ${
              location.pathname === '/youtube' ? styles.active : ''
            }`}
            onClick={() => navigate('/youtube')}
            height="40px"
            width="40px"
          >
            <path d="M365.257,67.393H95.744C42.866,67.393,0,110.259,0,163.137v134.728
              c0,52.878,42.866,95.744,95.744,95.744h269.513c52.878,0,95.744-42.866,95.744-95.744V163.137
              C461.001,110.259,418.135,67.393,365.257,67.393z M300.506,237.056l-126.06,60.123c-3.359,1.602-7.239-0.847-7.239-4.568V168.607
              c0-3.774,3.982-6.22,7.348-4.514l126.06,63.881C304.363,229.873,304.298,235.248,300.506,237.056z"/>
          </svg>

          {/* Add New Project Icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className={`${styles.icon} ${styles.sidebarIcon} ${
              location.pathname === '/settings' ? styles.active : ''
            }`}
            onClick={() => navigate('/settings')}
          >
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </svg>

          {/* View Projects Library Icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className={`${styles.icon} ${styles.sidebarIcon} ${
              location.pathname === '/library' ? styles.active : ''
            }`}
          >
            <path d="M4 6h18V4H4c-1.1 0-2 .9-2 2v11H0v3h14v-3H4V6zm19 2h-8c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h8c.55 0 1-.45 1-1V9c0-.55-.45-1-1-1zm-1 9h-6v-7h6v7z" />
          </svg>

          {/* Dark Mode Toggle */}
          <div className={styles.darkModeToggle}>
            <label htmlFor="darkModeToggle">Dark Mode</label>
            <input
              type="checkbox"
              id="darkModeToggle"
              checked={darkMode}
              onChange={toggleDarkMode}
            />
          </div>

          {/* Projects List */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 168.000000 149.000000"
            className={`${styles.icon} ${styles.sidebarIcon} ${
              location.pathname === '/settings' ? styles.active : ''
            }`}
            onClick={() => navigate('/settings')}
          >
            <g className="custom-svg" transform="translate(0.000000,149.000000) scale(0.100000,-0.100000)" fill="#818181" stroke="none">
              <path d="M1045 1433 c-88 -29 -168 -56 -177 -59 -16 -5 -18 2 -18 45 l0 51 -190 0 -190 0 0 -730 0 -730 190 0 190 0 0 677 c0 373 4 673 9 668 4 -6 42 -111 84 -235 91 -273 379 -1114 381 -1117 1 -1 81 23 178 54 l176 56 -135 396 c-74 218 -177 522 -230 676 -52 154 -98 285 -102 291 -4 8 -58 -6 -166 -43z"></path>
              <path d="M0 740 l0 -730 190 0 190 0 0 730 0 730 -190 0 -190 0 0 -730z"></path>
            </g>
          </svg>
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
      </div>
    </div>
  );
};

export default Sidebar;
