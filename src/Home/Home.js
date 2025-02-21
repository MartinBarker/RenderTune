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

  const createTooltip = (event) => {
    let tooltip = document.createElement('div');
    tooltip.style.position = 'fixed';
    tooltip.style.maxWidth = '200px';
    tooltip.style.overflowY = 'auto';
    tooltip.style.maxHeight = '80px';
    tooltip.style.padding = '5px';
    tooltip.style.borderRadius = '3px';
    tooltip.style.backgroundColor = '#333';
    tooltip.style.color = '#fff';
    tooltip.style.fontSize = '1em'; // Increase font size
    tooltip.style.fontFamily = 'Segoe UI, sans-serif'; // Match project font style
    tooltip.style.zIndex = '9999';
    tooltip.style.boxShadow = '0 0 5px rgba(0, 0, 0, 0.3)';
    tooltip.textContent = event.target.getAttribute('data-tooltip');
    document.body.appendChild(tooltip);

    const linkRect = event.target.getBoundingClientRect();
    const topPos = linkRect.top - tooltip.offsetHeight - 5;
    const leftPos = linkRect.left + (linkRect.width / 2) - (tooltip.offsetWidth / 2);

    tooltip.style.top = `${topPos > 0 ? topPos : 0}px`;
    tooltip.style.left = `${leftPos > 0 ? leftPos : 0}px`;

    const removeTooltip = () => {
      tooltip.remove();
      event.target.removeEventListener('mouseout', removeTooltip);
      window.removeEventListener('scroll', removeTooltip);
    };

    event.target.addEventListener('mouseout', removeTooltip);
    window.addEventListener('scroll', removeTooltip);
  };

  const supporters = [
    "merko",
    "Danny Marks (Redface Radio)",
    "Richard Munro"
  ];

  // Shuffle the supporters array
  const shuffledSupporters = supporters.sort(() => Math.random() - 0.5);

  const changelog = [
    "Fixed filedrop transition from home page to new project page",
    "Added auto-update feature",
    "Changed formatting of Home page text"
  ];

  const feedbackLinks = [
    { text: 'Send Email', url: 'mailto:martinbarker99@gmail.com', tooltip: 'Send an email' },
    { text: 'Report a Bug', url: 'https://github.com/MartinBarker/RenderTune/issues', tooltip: 'Report a bug on GitHub' },
    { text: 'Suggest a Feature', url: 'https://github.com/MartinBarker/RenderTune/issues', tooltip: 'Suggest a feature on GitHub' }
  ];

  return (
    <div className={styles.homeContainer}>
      <h1>Welcome to RenderTune!</h1>
      <h2 className={styles.subtitle}>
        A free open-source program to create video fiels by combining audio + image files, created by<a href="#" className={styles.creatorLink} data-tooltip="Visit Martin Barker's website" onClick={(event) => handleLinkClick('https://www.martinbarker.me', event)} onMouseOver={createTooltip}>Martin Barker</a>
      </h2>
      <div>
        <p>
          View all code and contribute on <a href="#" className={styles.githubLink} data-tooltip="Open RenderTune GitHub page" onClick={(event) => handleLinkClick('https://github.com/MartinBarker/RenderTune', event)} onMouseOver={createTooltip}>GitHub</a>, or visit <a href="#" className={styles.infoLink} data-tooltip="Open RenderTune website" onClick={(event) => handleLinkClick('https://rendertune.com', event)} onMouseOver={createTooltip}>rendertune.com</a> for additional info
        </p>
      </div>
      <FileUploader onFilesMetadata={handleFilesMetadata} />
      <br></br>
      <div className={styles.changelogSection}>
        <h2>Changelog</h2>
        <p>Current Version: <a href="#" data-tooltip="View release notes on GitHub" onClick={(event) => handleLinkClick(`https://github.com/MartinBarker/RenderTune/releases/tag/v${appVersion}`, event)} onMouseOver={createTooltip} target="_blank" rel="noopener noreferrer">{appVersion}</a></p>
        <ul>
          {changelog.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>
      <hr className={styles.sectionDivider} />
      <div className={styles.supportersSection}>
        <h2>Thank You to Our Supporters!</h2>
        <p className={styles.supportersNames}>{shuffledSupporters.join(', ')}</p>
        
        {/* 
        <p className={styles.donationLinks}>
          <a href="#" data-tooltip="Open Ko-fi page" onClick={(event) => handleLinkClick('https://ko-fi.com/martinradio', event)} onMouseOver={createTooltip} target="_blank" rel="noopener noreferrer">Ko-fi</a> /
          <a href="#" data-tooltip="Open Patreon page" onClick={(event) => handleLinkClick('https://www.patreon.com/c/martinradio', event)} onMouseOver={createTooltip} target="_blank" rel="noopener noreferrer">Patreon</a> /
          <a href="#" data-tooltip="Open GitHub Sponsors page" onClick={(event) => handleLinkClick('https://github.com/sponsors/MartinBarker', event)} onMouseOver={createTooltip} target="_blank" rel="noopener noreferrer">GitHub Sponsors</a>
        </p>
        */}
        
      </div>
      <div className={styles.feedbackSection}>
        <h2>Feedback</h2>
        <ul>
          {feedbackLinks.map((link, index) => (
            <li key={index}>
              <a href="#" data-tooltip={link.tooltip} onClick={(event) => handleLinkClick(link.url, event)} onMouseOver={createTooltip} target="_blank" rel="noopener noreferrer" className={styles.feedbackLink}>
                {link.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default Home;
