/* eslint-env node */

const { configure } = require('quasar/wrappers');

module.exports = configure(function (/* ctx */) {
  return {
    boot: [
      'pinia'
    ],

    css: [
      'app.css'
    ],

    extras: [
      'roboto-font',
      'material-icons',
    ],

    build: {
      target: {
        browser: ['es2019', 'edge88', 'firefox78', 'chrome87', 'safari13.1'],
        node: 'node20'
      },
      vueRouterMode: 'hash'
    },

    devServer: {
      open: true
    },

    framework: {
      config: {},
      plugins: [
        'Dialog','Loading','Notify'
      ]
    },

    animations: [],

    ssr: {
      pwa: false,
      prodPort: 3000,
      middlewares: [
        'render'
      ]
    },

    pwa: {
      workboxMode: 'generateSW',
      injectPwaMetaTags: true,
      swFilename: 'sw.js',
      manifestFilename: 'manifest.json',
      useCredentialsForManifestTag: false
    },

    capacitor: {
      hideSplashscreen: true
    },

    electron: {
      inspectPort: 5858,
      bundler: 'packager',
      builder: {
        appId: 'loja-planilha'
      }
    },

    bex: {
      contentScripts: [
        'my-content-script'
      ]
    }
  }
});
