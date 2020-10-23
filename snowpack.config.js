module.exports = {
  devOptions: {
    open: 'none'
  },
  mount: {
    public: '/',
    'src/one': '/modules/one',
    'src/two': '/modules/two',
    'three': '/modules/three'
  },
  alias: {
    '@one': './src/one',
    '@two': './src/two',
    '@three': './three'
  },
};
