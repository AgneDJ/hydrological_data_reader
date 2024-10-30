const puppeteer = require('puppeteer')

(async ()=> {
    const browser = await puppeteer.launch({headless: false})
    const page = await browser.newPage()
    await page.goto('http://hymer.meteo.lt')

    // Wait for the elements with class 'gm-style-iw-d' to load
    await page.waitForSelector('.gm-style-iw-d', {timeout: 60000})

    // Extract text from elements with the target class
    const data = await page.evaluate(() = > {
        const elements = document.querySelectorAll('.gm-style-iw-d')
        return Array.from (elements).map(el=> el.textContent.trim())
    })

    console.log("Extracted Data:", data)

    await browser.close()
})();
