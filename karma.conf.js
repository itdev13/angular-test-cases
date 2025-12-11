module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine'],
    plugins: [
      'karma-jasmine',
      'karma-chrome-launcher',
      'karma-coverage'
    ],
    files: [
      // Include AngularJS and dependencies first
      'node_modules/angular/angular.js',
      'node_modules/angular-route/angular-route.js',
      'node_modules/angular-mocks/angular-mocks.js',
      
      // Include your app files in the correct order
      'js/notificationCtr.js',   // Define the ncApp module first - MUST be first
      'js/services.js',          // All services
      'js/settingCtr.js',        // Controllers
      
      // Include test files
      'spec/**/*.spec.js'
    ],
    exclude: [
      'node_modules/**/test/**',
      'node_modules/**/tests/**'
    ],
    preprocessors: {
      'js/**/*.js': ['coverage'],
    },
    client: {
      clearContext: false,
      captureConsole: false,
      jasmine: {
        random: false,
      },
    },
    
    coverageReporter: {
      dir: require("path").join(__dirname, "./coverage"),
      reporters: [{ type: "lcov", subdir: ".", }, { type: "text-summary" }],
    },
    browserConsoleLogOptions: { level: 'warn' },
    reporters: ['progress', 'coverage'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['ChromeHeadlessNoSandbox'],
    customLaunchers: {
      ChromeHeadlessNoSandbox: {
        base: 'Chrome',
        flags: [
          '--headless',
          '--disable-gpu',
          '--no-sandbox',
          '--disable-dev-shm-usage',
          '--disable-software-rasterizer',
          '--disable-extensions'
        ],
      },
    },
    restartOnFileChange: true,
    browserDisconnectTimeout: 6000,
    browserDisconnectTolerance: 1,
    browserNoActivityTimeout: 90000,
    browserConsole: false,
    concurrency: Infinity,
  });
};

