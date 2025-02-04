import React from 'react';
import styles from './Settings.module.css';

function Settings() {
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
        <h2>Support RenderTune</h2>
        <p>If you would like to support RenderTune, you can make a one-time donation of $5. Your name will be added to the application's Thank You page.</p>
        <ul>
          <li><a href="https://ko-fi.com/your-kofi-page" target="_blank" rel="noopener noreferrer" className={styles.lightBlueLink}>Ko-fi</a></li>
          <li><a href="https://patreon.com/your-patreon-page" target="_blank" rel="noopener noreferrer" className={styles.lightBlueLink}>Patreon</a></li>
        </ul>
      </section>

      <section>
        <h2>Thank You</h2>
        <p>Special thanks to our supporters:</p>
        <ul>
          <li>John Doe</li>
          <li>Jane Smith</li>
          <li>Michael Johnson</li>
          <li>Emily Davis</li>
        </ul>
      </section>
    </div>
  );
}

export default Settings;
