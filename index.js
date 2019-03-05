const fs = require('fs')
const path = require('path')
const puppeteer = require('puppeteer')
const { red, green, yellow } = require('kleur')
const devices = require('puppeteer/DeviceDescriptors')
const pkg = require('./package.json')

console.log(pkg.name + ' ' + pkg.version)

const url = process.argv[2]
let output_path = '.';

let options = process.argv.slice(3) || []
const options_len = options.length;

let options_processed = {}
let options_processed_last = ''

for (let i = 0; i < options_len; i++) {
    if(!options[i].startsWith('-')){
        options_processed[options_processed_last] = options[i];
    } else {
        let argument_kv = options[i].split('=');
        options_processed[argument_kv[0]] = argument_kv[1] ? argument_kv[1] : '';
        options_processed_last = options[i];
    }
}

options = options_processed
const options_keys = Object.keys(options)

if (typeof options['--output'] !== 'undefined' && typeof options['-o']) {
  const dir = typeof options['--output'] !== 'undefined' ? path.resolve(options['--output']) : path.resolve(options['-o']);
  if (fs.existsSync(dir) && fs.lstatSync(dir).isDirectory()) {
    output_path = dir;
  } else {
    console.warn(yellow('Path ' + dir + ' can not be resolved, falling back to ' + path.resolve(output_path)))
  }
}

if(!process.argv[2]) {
  console.log(red('No website was provided.'))
  process.exit(1)
  return
}

async function crtsh(){
  const name = 'crt.sh'
  console.log(green('[started] ' + name))
  const browser = await puppeteer.launch({headless: true})
  const page = await browser.newPage()
  await page._client.send('Emulation.clearDeviceMetricsOverride')
  await page.goto('https://crt.sh/?q=' + url)
  await page.waitFor(1000)
  await page.pdf({path: path.resolve(output_path, './crtsh.pdf'), format: 'A4', printBackground: true})
  await browser.close()
  console.log(green('[done] ' + name))
}

async function cryptcheck() {
  const name = 'CryptCheck'
  console.log(green('[started] ' + name))
  const browser = await puppeteer.launch({headless: true, args: ['--lang=en']})
  const page = await browser.newPage()
  await page._client.send('Emulation.clearDeviceMetricsOverride')
  await page.goto('https://tls.imirhil.fr/https/' + url)
  try {
    await page.waitForFunction('!document.querySelector("meta[http-equiv=\'refresh\']")',{timeout:30000})
  } catch(err){
    await browser.close()
    console.log(red('[error] ' + name), red(err))
    return
  }
  await page.evaluate(() => document.querySelector('header').style.display = 'none')
  await page.emulateMedia('screen')
  await page.pdf({path: path.resolve(output_path, './cryptcheck.pdf'), format: 'A4', printBackground: true})
  await browser.close()
  console.log(green('[done] ' + name))
}

async function hstspreload() {
  const name = 'HSTS Preload List'
  console.log(green('[started] ' + name))
  const browser = await puppeteer.launch({headless: true})
  const page = await browser.newPage()
  await page._client.send('Emulation.clearDeviceMetricsOverride')
  await page.goto('https://hstspreload.org/?domain=' + url)
  try {
    await page.waitForSelector('#result',{timeout:30000,visible:true})
  } catch(err){
    await browser.close()
    console.log(red('[error] ' + name), red(err))
    return
  }
  await page.pdf({path: path.resolve(output_path, './hstspreload.pdf'), format: 'A4', printBackground: true})
  await browser.close()
  console.log(green('[done] ' + name))
}

async function httpobservatory() {
  const name = 'HTTP Observatory'
  console.log(green('[started] ' + name))
  const browser = await puppeteer.launch({headless: true})
  const page = await browser.newPage()
  await page._client.send('Emulation.clearDeviceMetricsOverride')
  await page.goto('https://observatory.mozilla.org/analyze/' + url + '&third-party=false', {waitUntil: 'networkidle0'})
  try {
    await page.waitForFunction('!document.querySelector("#scan-progress-bar")',{timeout:240000})
  } catch(err){
    await browser.close()
    console.log(red('[error] ' + name), red(err))
    return
  }
  await page.emulateMedia('screen')
  await page.pdf({path: path.resolve(output_path, './httpobservatory.pdf'), scale: 0.75, format: 'A4', printBackground: true})
  await browser.close()
  console.log(green('[done] ' + name))
}

async function lighthouse(){
  const name = 'Lighthouse'
  console.log(green('[started] ' + name))
  const browser = await puppeteer.launch({headless: true})
  const page = await browser.newPage()
  await page._client.send('Emulation.clearDeviceMetricsOverride')
  await page.goto('https://lighthouse-ci.appspot.com/try')
  await page.type('#url', url)
  await page.click('.url-section .search-arrow')
  try {
    await page.waitForSelector('body.done',{timeout:60000})
  } catch(err){
    await browser.close()
    console.log(red('[error] ' + name), red(err))
    return
  }
  const link = await page.evaluate(() => document.querySelector('#reportLink').href)
  await page.goto(link)
  await page.pdf({path: path.resolve(output_path, './lighthouse.pdf'), format: 'A4', printBackground: true})
  await browser.close()
  console.log(green('[done] ' + name))
}

async function psi(){
  const name = 'PageSpeed Insights'
  console.log(green('[started] ' + name))
  const browser = await puppeteer.launch({headless: true})
  const page = await browser.newPage()
  await page._client.send('Emulation.clearDeviceMetricsOverride')
  await page.goto('https://developers.google.com/speed/pagespeed/insights/?url=' + url + '&tab=mobile')
  try {
    await page.waitForSelector('#page-speed-insights .pagespeed-results .result-tabs',{timeout:60000})
  } catch(err){
    await browser.close()
    console.log(red('[error] ' + name), red(err))
    return
  }
  await page.click('#page-speed-insights .pagespeed-results .result-tabs .goog-tab:nth-child(1)')
  await page.pdf({path: path.resolve(output_path, './psi-mobile.pdf'), format: 'A4', printBackground: true})
  await page.click('#page-speed-insights .pagespeed-results .result-tabs .goog-tab:nth-child(2)')
  await page.pdf({path: path.resolve(output_path, './psi-desktop.pdf'), format: 'A4', printBackground: true})
  await browser.close()
  console.log(green('[done] ' + name))
}

async function securityheaders(){
  const name = 'SecurityHeaders'
  console.log(green('[started] ' + name))
  const browser = await puppeteer.launch({headless: true})
  const page = await browser.newPage()
  await page._client.send('Emulation.clearDeviceMetricsOverride')
  await page.goto('https://securityheaders.com/?q=' + url + '&hide=on&followRedirects=on')
  await page.pdf({path: path.resolve(output_path, './securityheaders.pdf'), format: 'A4', printBackground: true})
  await browser.close()
  console.log(green('[done] ' + name))
}

async function ssldecoder() {
  const name = 'SSL Decoder'
  console.log(green('[started] ' + name))
  const browser = await puppeteer.launch({headless: true})
  const page = await browser.newPage()
  await page._client.send('Emulation.clearDeviceMetricsOverride')
  await page.goto('https://ssldecoder.org/?host=' + url,{timeout:240000})
  const links = await page.evaluate(() => [...document.querySelectorAll('#choose_endpoint a')].map(link => link.href))
  const linksLength = links.length
  if(linksLength){
    for(let i = 0; i < linksLength; i++){
      await page.goto(links[i], {timeout: 60000})
      await page.emulateMedia('screen')
      await page.pdf({path: path.resolve(output_path, './ssldecoder-'+i+'.pdf'), format: 'A4', printBackground: true})
    }
    await browser.close()
    console.log(green('[done] ' + name))
    return
  }
  await page.emulateMedia('screen')
  await page.pdf({path: path.resolve(output_path, './ssldecoder.pdf'), format: 'A4', printBackground: true})
  await browser.close()
  console.log(green('[done] ' + name))
}

async function ssllabs() {
  const name = 'SSLLabs'
  console.log(green('[started] ' + name))
  const browser = await puppeteer.launch({headless: true})
  const page = await browser.newPage()
  await page._client.send('Emulation.clearDeviceMetricsOverride')
  await page.goto('https://www.ssllabs.com/ssltest/analyze.html?d='+url+'&hideResults=on&ignoreMismatch=on&clearCache=on')
  try {
    await page.waitForFunction('!document.querySelector("#refreshUrl")',{timeout:340000})
  } catch(err){
    await browser.close()
    console.log(red('[error] ' + name), red(err))
    return
  }
  const links = await page.evaluate(() => [...document.querySelectorAll('#multiTable a')].map(link => link.href))
  const linksLength = links.length
  if(linksLength){
    for(let i = 0; i < linksLength; i++){
      await page.goto(links[i])
      await page.waitFor(1000)
      await page.pdf({path: path.resolve(output_path, './ssllabs-'+i+'.pdf'), format: 'A4', printBackground: true})
    }
  } else {
    await page.waitFor(1000)
    await page.pdf({path: path.resolve(output_path, './ssllabs.pdf'), format: 'A4', printBackground: true})
  }
  await browser.close()
  console.log(green('[done] ' + name))
}

async function webbkoll() {
  const name = 'webbkoll'
  console.log(green('[started] ' + name))
  const browser = await puppeteer.launch({headless: true})
  const page = await browser.newPage()
  await page._client.send('Emulation.clearDeviceMetricsOverride')
  await page.goto('https://webbkoll.dataskydd.net/en/check?url='+url+'&refresh=on')
  try {
    await page.waitForFunction('window.location.href.startsWith("https://webbkoll.dataskydd.net/en/results")',{timeout:240000})
  } catch(err){
    await browser.close()
    console.log(red('[error] ' + name), red(err))
    return
  }
  await page.pdf({path: path.resolve(output_path, './webbkoll.pdf'), format: 'A4', printBackground: true})
  await browser.close()
  console.log(green('[done] ' + name))
}

async function webhint(){
  const name = 'webhint'
  console.log(green('[started] ' + name))
  const browser = await puppeteer.launch({headless: true})
  const page = await browser.newPage()
  await page._client.send('Emulation.clearDeviceMetricsOverride')
  await page.goto('https://webhint.io/scanner/')
  await page.type('#scanner-page-scan', url)
  await page.click('#scanner-page-scan + button[type="submit"]')
  await page.waitFor(1000)
  try {
    await page.waitForSelector('.scan-overview__status',{timeout:30000,visible:true})
  } catch(err){
    await browser.close()
    console.log(red('[error] ' + name), red(err))
    return
  }
  await page.waitFor(1000)
  try {
    await page.waitForFunction('document.querySelector(".scan-overview__progress-bar.end-animation")',{timeout:240000})
  } catch(err){
    await browser.close()
    console.log(red('[error] ' + name), red(err))
    return
  }
  await page.waitFor(1000)
  await page.evaluate(() => document.querySelectorAll('.button-expand-all').forEach((el) => el.click()))
  await page.pdf({path: path.resolve(output_path, './webhint.pdf'), format: 'A4', printBackground: true})
  await browser.close()
  console.log(green('[done] ' + name))
}

const no_cli_flags = !options_keys.length || ( options_keys.length === 1 && options_keys.includes('--output'));

if (no_cli_flags || options_keys.includes('--crtsh')) {
  try {
    crtsh()
  } catch(e) {
    console.error(red(e));
  }
}
if (no_cli_flags || options_keys.includes('--cryptcheck')) {
  try {
    cryptcheck()
  } catch(e) {
    console.error(red(e));
  }
}
if (no_cli_flags || options_keys.includes('--hstspreload')) {
  try {
    hstspreload()
  } catch(e) {
    console.error(red(e));
  }
}
if (no_cli_flags || options_keys.includes('--httpobservatory')) {
  try {
    httpobservatory()
  } catch(e) {
    console.error(red(e));
  }
}
if (no_cli_flags || options_keys.includes('--lighthouse')) {
  try {
    lighthouse()
  } catch(e) {
    console.error(red(e));
  }
}
if (no_cli_flags || options_keys.includes('--psi')) {
  try {
    psi()
  } catch(e) {
    console.error(red(e));
  }
}
if (no_cli_flags || options_keys.includes('--securityheaders')) {
  try {
    securityheaders()
  } catch(e) {
    console.error(red(e));
  }
}
if (no_cli_flags || options_keys.includes('--ssldecoder')) {
  try {
    ssldecoder()
  } catch(e) {
    console.error(red(e));
  }
}
if (no_cli_flags || options_keys.includes('--ssllabs')) {
  try {
    ssllabs()
  } catch(e) {
    console.error(red(e));
  }
}
if (no_cli_flags || options_keys.includes('--webbkoll')) {
  try {
    webbkoll()
  } catch(e) {
    console.error(red(e));
  }
}
if (no_cli_flags || options_keys.includes('--webhint')) {
  try {
    webhint()
  } catch(e) {
    console.error(red(e));
  }
}