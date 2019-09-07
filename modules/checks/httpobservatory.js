const path = require('path')
const checkFunction = require('../check-function')

module.exports = async () => {
  if (no_cli_flags || options_keys.includes('--httpobservatory')) {
    const name = 'HTTP Observatory'
    async function tryBlock(page) {
      await page._client.send('Emulation.clearDeviceMetricsOverride')
      await page.goto('https://observatory.mozilla.org/analyze/' + url + '&third-party=false', { waitUntil: 'networkidle0' })
      await page.waitForFunction('!document.querySelector("#scan-progress-bar")', { timeout: 240000 })
      await page.emulateMedia('screen')
      await page.pdf({ path: path.resolve(output_path, './httpobservatory.pdf'), scale: 0.75, format: 'A4', printBackground: true })
    }
    await checkFunction(name, tryBlock)
  }
}