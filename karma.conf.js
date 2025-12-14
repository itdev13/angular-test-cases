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
      // Include jQuery FIRST - Angular will use it instead of jqLite
      'node_modules/jquery/dist/jquery.js',
      
      // Include AngularJS and dependencies
      'node_modules/angular/angular.js',
      'node_modules/angular-route/angular-route.js',
      'node_modules/angular-ui-bootstrap/dist/ui-bootstrap-tpls.js',
      'node_modules/angular-mocks/angular-mocks.js',

      'node_modules/ng-ckeditor/dist/ng-ckeditor.js',
      'node_modules/angucomplete-alt/angucomplete-alt.js',
      'node_modules/html2canvas/dist/html2canvas.min.js',
      
      // Include your app files in the correct order
      'js/notificationCtr.js',   // Define the ncApp module first - MUST be first
      'js/services.js',          // All services
      'js/file-upload.js',       // File upload directives
      'js/settingCtr.js',        // Controllers
      'js/loginCtr.js',          // Login controller
      'js/subscriptionCtr.js',    // Subscription controller
      
      // Include test files in specific order to prevent injector conflicts
      'spec/services/services.spec.js',         // Services first
      'spec/directives/file-upload.spec.js',    // Directives second  
      'spec/controllers/loginCtr.spec.js',      // Controllers last
      'spec/controllers/settingCtr.spec.js',
      'spec/controllers/notificationCtr.spec.js',
      'spec/controllers/subscriptionCtr.spec.js',
      'spec/directives/directive.spec.js'
    ],
    exclude: [
      'node_modules/**/test/**',
      'node_modules/**/tests/**'
    ],
    preprocessors: {
      // Measure coverage for controllers being tested
      'js/*.js': ['coverage']
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

