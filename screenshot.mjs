import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({ headless: 'new' });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });

await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });

// Wait for page to fully load
await new Promise(r => setTimeout(r, 3000));

// Force-trigger the reveal in the page context (since autoplay may not work in headless)
await page.evaluate(() => {
  const vignette = document.querySelector('.hero-vignette');
  const overlay = document.getElementById('hero-cinematic-overlay');
  const content = document.getElementById('hero-content');
  const agency = document.getElementById('hero-agency');
  
  if (vignette) vignette.classList.add('active');
  if (overlay) overlay.classList.add('active');
  if (content) {
    content.classList.add('revealed');
    content.style.opacity = '1';
  }
  if (agency) agency.classList.add('revealed');
});

// Wait for animations to complete
await new Promise(r => setTimeout(r, 3000));

await page.screenshot({ 
  path: 'hero_screenshot.png', 
  fullPage: false 
});

console.log('Screenshot saved to hero_screenshot.png');
await browser.close();
