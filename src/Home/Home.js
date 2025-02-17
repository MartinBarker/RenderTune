import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FileUploader from '../FileUploader/FileUploader.js';
import styles from './Home.module.css';

function Home() {
  const navigate = useNavigate();
  const [appVersion, setAppVersion] = useState('');

  useEffect(() => {
    const handleAppVersion = (version) => {
      setAppVersion(version.version); // Assuming the object has a property 'version'
    };

    window.api.send('app_version');
    window.api.receive('app_version', handleAppVersion);

    return () => {
      window.api.removeAllListeners('app_version');
    };
  }, []);

  const handleFilesMetadata = (filesMetadata) => {
    navigate('/project', { state: { filesMetadata } });
  };

  const handleLinkClick = (url, event) => {
    event.preventDefault();
    console.log(`Link clicked: ${url}`);
    window.api.send('open-url', url);
  };

  const supporters = [
    "Merko",
    "Danny Marks (Redface Radio)",
    "Richard Munro"
  ];

  // Shuffle the supporters array
  const shuffledSupporters = supporters.sort(() => Math.random() - 0.5);

  const changelog = [
    "Added new file uploader feature",
    "Improved performance",
    "Fixed bugs in the rendering engine"
  ];

  return (
    <div className={styles.homeContainer}>
      <h1>Welcome to RenderTune!</h1>
      <h2 className={styles.subtitle}>A free open-source video rendering app</h2>
      <div>
      <p>
        View all code and contribute on <a href="#" className={styles.githubLink} onClick={(event) => handleLinkClick('https://github.com/MartinBarker/RenderTune', event)}>GitHub</a>
      </p>
      </div>
      <FileUploader onFilesMetadata={handleFilesMetadata} />
      <div className={styles.supportersSection}>
        <h2>Thank You to Our Supporters!</h2>
        <p className={styles.supportersNames}>{shuffledSupporters.join(', ')}</p>
        <p>
          Become a supporter by making a one-time $5 donation to have your name featured in the app forever!
        </p>
        <p className={styles.donationLinks}>
          <a href="#" onClick={(event) => handleLinkClick('https://ko-fi.com/martinradio', event)} target="_blank" rel="noopener noreferrer">Ko-fi</a> / 
          <a href="#" onClick={(event) => handleLinkClick('https://www.patreon.com/c/martinradio', event)} target="_blank" rel="noopener noreferrer">Patreon</a> / 
          <a href="#" onClick={(event) => handleLinkClick('https://github.com/sponsors/MartinBarker', event)} target="_blank" rel="noopener noreferrer">GitHub Sponsors</a>
        </p>
      </div>
      <hr className={styles.sectionDivider} /> 
      <div className={styles.changelogSection}>
        <h2>Changelog!</h2>
        <p>Current Version: <a href="#" onClick={(event) => handleLinkClick(`https://github.com/MartinBarker/RenderTune/releases/tag/v${appVersion}`, event)} target="_blank" rel="noopener noreferrer">{appVersion}</a></p>
        <ul>
          {changelog.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>
     {/**/}
    </div>
  );
}

export default Home;
