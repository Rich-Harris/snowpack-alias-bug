module.exports = {
  devOptions: {
    open: 'none'
  },
  mount: {
    public: '/',
    'src/one': '/modules/one',
    'src/two': '/modules/two',
    'three': '/modules/three',
    'four': '/modules/four'
  },
  alias: {
    '@one': '/modules/one',
    '@two': '/modules/two',
    '@three': '/modules/three',
    '@four': '/modules/four'
  },
};
