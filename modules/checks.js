const crtsh = require('./checks/crtsh')
const cryptcheck = require('./checks/cryptcheck')
const hstspreload = require('./checks/hstspreload')
const httpobservatory = require('./checks/httpobservatory')
const lighthouse = require('./checks/lighthouse')
const psi = require('./checks/psi')
const securityheaders = require('./checks/securityheaders')
const ssldecoder = require('./checks/ssldecoder')
const ssllabs = require('./checks/ssllabs')
const webbkoll = require('./checks/webbkoll')
const webhint = require('./checks/webhint')

module.exports = {
    crtsh,
    cryptcheck,
    hstspreload,
    httpobservatory,
    lighthouse,
    psi,
    securityheaders,
    ssldecoder,
    ssllabs,
    webbkoll,
    webhint,
}