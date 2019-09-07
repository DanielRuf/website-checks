const path = require('path')
const checkFunction = require('../check-function')

module.exports = async () => {
  if (no_cli_flags || options_keys.includes('--ssldecoder') || options_keys.includes('--ssldecoder-fast')) {
    const fastcheck = (no_cli_flags || options_keys.includes('--ssldecoder-fast'))
    const name = 'SSL Decoder' + (fastcheck ? ' (fast)' : '')
    async function tryBlock(page) {
      await page._client.send('Emulation.clearDeviceMetricsOverride')
      await page.goto('https://ssldecoder.org/?host=' + url + '&fastcheck=' + (fastcheck ? '1' : '0'), { timeout: 240000 })
      const links = await page.evaluate(() => [...document.querySelectorAll('#choose_endpoint a')].map(link => link.href))
      const linksLength = links.length
      if (linksLength) {
        for (let i = 0; i < linksLength; i++) {
          await page.goto(links[i], { timeout: 120000 })
          await page.emulateMedia('screen')
          await page.pdf({ path: path.resolve(output_path, './ssldecoder-' + (fastcheck ? 'fast-' : '') + i + '.pdf'), format: 'A4', printBackground: true })
        }
      } else {
        await page.emulateMedia('screen')
        await page.pdf({ path: path.resolve(output_path, './ssldecoder' + (fastcheck ? 'fast-' : '') + '.pdf'), format: 'A4', printBackground: true })
      }
    }
    await checkFunction(name, tryBlock)
  }
}