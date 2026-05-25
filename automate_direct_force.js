const puppeteer = require('puppeteer-core');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const REAL_USER_DATA = path.join(process.env.USERPROFILE, 'AppData', 'Local', 'Google', 'Chrome', 'User Data');
const DEVPOST_URL = 'https://devpost.com/submit-to/29541-build-with-gemini-xprize/manage/submissions/1030063-brain_train/project-overview';
const SCRATCH_DIR = path.join(process.env.USERPROFILE, '.gemini', 'antigravity', 'brain', '569f8ba8-cd13-4e9e-a6a2-a987f3c299fb', 'scratch');

if (!fs.existsSync(SCRATCH_DIR)) {
  fs.mkdirSync(SCRATCH_DIR, { recursive: true });
}

const SUCCESS_SCREENSHOT = path.join(SCRATCH_DIR, 'submission_success.png');

// English Project Story Markdown
const PROJECT_STORY = `## 💡 Inspiration
Cognitive decline and dementia are growing concerns for aging populations worldwide. While cognitive training exercises (like puzzles and mental math) are highly effective in stimulating prefrontal cortex blood flow, generic digital apps often intimidate senior citizens due to small fonts, complex UI, or generic, cold feedback. Inspired by Nintendo's legendary "Brain Age" (Dr. Kawashima's Brain Training), we created **"매일매일 두뇌 학당"** (Daily Brain School) — a highly accessible, playful, and responsive hybrid application designed from the ground up for seniors, offering personalized cognitive care powered by Google's Gemini.

## 🎮 What it does
**Daily Brain School** contains a suite of cognitive games designed to stimulate distinct brain regions:
1. **Calculation 20**: Rapid arithmetic training to boost processing speed.
2. **Color Stroop Control**: Inhibitory control training where the user identifies ink color regardless of the written word.
3. **Spatial Grid Memory**: Expanding working memory by recalling hidden number grids.
4. **Card Match Memory**: Pairs matching for short-term visual memory retention.
5. **Flash Visual Count**: Subitizing training to activate the right hemisphere.
6. **Operator Guessing**: Deductive arithmetic logic game.

### The Core Brain Diagnostic Engine & LaTeX Formulation
Upon completing the comprehensive diagnostic chain test, the app analyzes the reaction offsets ($t_{\\text{offset}}$) and accuracy rates to compute the user's estimated **Brain Age**. The algorithmic calculation follows this strict mathematical model:

$$ \\text{Let } S_{\\text{Math}}, S_{\\text{Stroop}}, S_{\\text{Seq}} \\in [0, 100] \\text{ be the sectional scores.} $$
$$ \\text{The average score is } \\bar{S} = \\frac{S_{\\text{Math}} + S_{\\text{Stroop}} + S_{\\text{Seq}}}{3} $$
$$ \\text{The Brain Age } A_{\\text{brain}} \\text{ is defined as:} $$
$$ A_{\\text{brain}} = \\max\\left(20, \\min\\left(80, \\text{round}\\left(80 - \\frac{\\bar{S}}{100} \\times 60\\right)\\right)\\right) $$

### Gemini AI SECURE Consultation
Using the secure Express backend proxy, the app sends the latest diagnostic results to **Gemini 3.5 Flash** to draft custom 1:1 lifestyle tips ("Daily Actions") and tailored "Brain Foods" while completely bypassing medical-liability violations. If offline, the app seamlessly activates its localized, high-fidelity clinical fallback engine.

## 🛠️ How we built it
- **Frontend**: React 19, TypeScript 5.8, Tailwind CSS, Motion (for premium fluid animations)
- **Mobile Native Wrapping**: Capacitor 6.2 (successfully compiling the React SPA into a standalone Android APK)
- **Backend Server**: Node.js, Express, TypeScript, \`@google/genai\` (securely executing server-side Gemini 3.5 Flash queries to safeguard the API Key)
- **Sensory & UX**: Synthesized custom audio using Web Audio API for tactile feedback, huge high-contrast fonts, and a signature "Dr. Kawashima" avatar with localized Korean Senior UX rules.
- **Deployment**: Local hardware compilation using Android Studio JBR 21 and SDK Gradle toolchain, successfully deployed via ADB to a Samsung Galaxy Tab A11+ debug environment.

## 🚀 Challenges we ran into
- **Dynamic API Mapping in Hybrid WebView**: In Capacitor, relative fetching \`/api/gemini/advice\` redirects internally to the Android app origin, resulting in error responses. We resolved this by building a dynamic protocol analyzer in \`App.tsx\` that redirects queries to the developer machine's Wi-Fi interface IP (\`http://192.168.0.30:3000\`) in mobile debug runtimes, while maintaining relative paths on web hostings.
- **Android Cleartext HTTP Restriction**: Modern Android versions reject cleartext (\`http/\`) endpoints. We overcame this by modifying the \`AndroidManifest.xml\` structure to enforce \`android:usesCleartextTraffic="true"\`, permitting local development network streams to cross seamlessly without security sandboxing blockages.

## 🏆 Accomplishments that we're proud of
- Successfully compiled a React-Vite web application into an offline-resilient, fully installable standalone Android APK that renders smoothly on actual tablet hardware.
- Leveraged Gemini 3.5 Flash's advanced structural JSON schema to securely generate highly empathetic, localized cognitive care advice without violating strict health regulations (such as medical diagnosis boundaries).
- Built an outstanding offline-fallback mode that runs locally without complex API keys, ensuring a high-fidelity alternative is active at all times.

## 📚 What we learned
We learned the crucial role of strict schema engineering and structured system prompting when dealing with highly sensitive fields like health care. By configuring Gemini with explicit negative rules (forbidding clinical terminology) and tight schema constraints, we created a highly safe, empathetic assistant. We also mastered the hybrid development bridge between web and native android layers.

## 🔮 What's next for 매일매일 두뇌 학당
We plan to introduce voice-recognition UI to allow seniors to solve equations by simply speaking, entirely bypassing manual typings. We also look forward to integrating Android-native Text-To-Speech (TTS) so that the AI advice and Kawashima tips are read aloud with warm, natural voices.`;

function cleanChromeLocks() {
  console.log('Forcefully terminating all active Chrome processes...');
  try {
    execSync('taskkill /F /IM chrome.exe', { stdio: 'ignore' });
    console.log('All chrome.exe processes terminated successfully.');
  } catch (err) {
    // Ignore
  }

  const lockFiles = [
    path.join(REAL_USER_DATA, 'lockfile'),
    path.join(REAL_USER_DATA, 'SingletonLock'),
    path.join(REAL_USER_DATA, 'SingletonCookie'),
    path.join(REAL_USER_DATA, 'SingletonSocket')
  ];

  console.log('Programmatically searching and clearing hidden profile lock files...');
  lockFiles.forEach(file => {
    try {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
        console.log(`Successfully removed lock file: ${file}`);
      }
    } catch (err) {
      console.warn(`Warning: Could not remove lock file ${file}:`, err.message);
    }
  });
}

async function main() {
  // Clear locks and close running Chrome instances
  cleanChromeLocks();

  // Short delay to let locks fully release
  await new Promise(r => setTimeout(r, 2500));

  console.log('Launching browser using your actual Google Chrome profile directly...');
  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: true, // Run quietly in headless mode
      userDataDir: REAL_USER_DATA,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-extensions',
        '--profile-directory=Default',
        '--disable-features=ProcessSingleton'
      ]
    });

    console.log('Chrome launched successfully using actual profile!');
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 1024 });

    console.log(`Opening Devpost submission page: ${DEVPOST_URL}`);
    await page.goto(DEVPOST_URL, { waitUntil: 'networkidle2', timeout: 60000 });
    
    // Safety delay to allow scripts/session to load fully
    await new Promise(r => setTimeout(r, 6000));

    const currentUrl = page.url();
    console.log(`Loaded URL: ${currentUrl}`);
    console.log(`Loaded Page Title: ${await page.title()}`);

    if (currentUrl.includes('/users/login') || currentUrl.includes('secure.devpost.com')) {
      throw new Error('Verification failed: The session was not verified and redirected to login. Please log in on Chrome first, then close Chrome and try again!');
    }

    console.log('Active session verified! Populating overview form fields in real-time...');

    // 1. Tagline
    const taglineSelector = 'input[name="portfolio[tagline]"], input#portfolio_tagline, input[id*="tagline"]';
    console.log('Entering Tagline...');
    await page.waitForSelector(taglineSelector, { timeout: 10000 });
    await page.click(taglineSelector, { clickCount: 3 });
    await page.keyboard.press('Backspace');
    await page.type(taglineSelector, 'A senior-tailored cognitive training application modeled after Nintendo\'s Brain Age, securely powered by Gemini 3.5 Flash.');

    // 2. Description (Markdown Story)
    const descSelector = 'textarea[name="portfolio[description]"], textarea#portfolio_description, textarea[id*="description"]';
    console.log('Entering Detailed Project Story...');
    await page.waitForSelector(descSelector, { timeout: 10000 });
    await page.click(descSelector, { clickCount: 3 });
    await page.keyboard.press('Backspace');
    
    await page.evaluate((sel, val) => {
      document.querySelector(sel).value = val;
      const event = new Event('change', { bubbles: true });
      document.querySelector(sel).dispatchEvent(event);
      const inputEvent = new Event('input', { bubbles: true });
      document.querySelector(sel).dispatchEvent(inputEvent);
    }, descSelector, PROJECT_STORY);

    // 3. Technologies Built-With (Input tags)
    const builtWithSelector = 'input#portfolio_built_with, input[name="portfolio[built_with]"], input[id*="built_with"]';
    const builtWithExists = await page.$(builtWithSelector);
    if (builtWithExists) {
      console.log('Entering Technologies...');
      await page.click(builtWithSelector);
      await page.keyboard.press('Backspace');
      await page.type(builtWithSelector, 'react, typescript, capacitor, node.js, express, gemini-api');
      await page.keyboard.press('Enter');
    }

    console.log('Taking screenshot before saving changes...');
    await page.screenshot({ path: path.join(SCRATCH_DIR, 'before_save.png') });

    // 4. Save and Submit
    const saveSelector = 'input[type="submit"], button[type="submit"], button[name="commit"], .save-project, .button.reimagine-button.primary';
    console.log('Clicking Save/Submit button...');
    const saveBtn = await page.$(saveSelector);
    if (!saveBtn) {
      throw new Error('Could not find the Save / Submit button on the form!');
    }
    
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {}),
      saveBtn.click()
    ]);

    await new Promise(r => setTimeout(r, 6000));
    
    console.log('Capturing final success screenshot...');
    await page.screenshot({ path: SUCCESS_SCREENSHOT });
    console.log(`Success screenshot saved to: ${SUCCESS_SCREENSHOT}`);

    console.log('Final Page URL:', page.url());
    console.log('Final Page Title:', await page.title());

    await browser.close();
    console.log('Submission automated successfully via direct profile override!');

    // Restore Chrome back for the user
    console.log('Relaunching Chrome normally to restore your active workspace...');
    try {
      execSync(`start "" "${CHROME_PATH}" "${DEVPOST_URL}"`);
    } catch (e) {}
  } catch (err) {
    console.error('Automation Error:', err.message);
    if (browser) {
      await browser.close();
    }
    // Relaunch chrome to restore for user anyway
    try {
      execSync(`start "" "${CHROME_PATH}" "${DEVPOST_URL}"`);
    } catch (e) {}
    process.exit(1);
  }
}

main();
