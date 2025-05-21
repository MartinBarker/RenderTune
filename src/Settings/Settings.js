import React from 'react';
import styles from './Settings.module.css';

function Settings() {
  const handleDeleteLocalStorage = () => {
    localStorage.clear();
    alert('Local storage cleared!');
  };

  return (
    <div>
      <h1>Information</h1>
      
      <section>
        <h2>How to Report a Bug</h2>
        <p>If you encounter any issues, please report them by either:</p>
        <ul>
          <li>Emailing me at <a href="mailto:martinbarker99@gmail.com" className={styles.lightBlueLink}>martinbarker99@gmail.com</a></li>
          <li>Submitting an issue on my <a href="https://github.com/your-github-repo/issues" target="_blank" rel="noopener noreferrer" className={styles.lightBlueLink}>GitHub Issues Page</a></li>
        </ul>
        <form>
          <label htmlFor="email">Your Email:</label>
          <input type="email" id="email" name="email" required />
          <button type="submit">Submit</button>
        </form>
      </section>

      <section>
        <h2>Manage Data</h2>
        <button className={styles.deleteLocalStorageButton} onClick={handleDeleteLocalStorage}>
          Delete Local Storage
        </button>
      </section>
    </div>
  );
}

export default Settings;
