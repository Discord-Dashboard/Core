cookieParser = require('cookie-parser'),
i18n = require('i18n'),
app = app;

i18n.configure({
  // setup some locales - other locales default to en silently

  locales: themeConfig.locales || ['en'],

  // sets a custom cookie name to parse locale settings from
  cookie: 'lang',

  // where to store json files - defaults to './locales'
  directory: '/home/container/locales'
});

// you will need to use cookieParser to expose cookies to req.cookies
app.use(cookieParser());

// i18n init parses req for language headers, cookies, etc.
app.use(i18n.init);