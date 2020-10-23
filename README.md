# snowpack alias bug (i think?)

Clone this repo, `npm install`, then `npm run dev` to see the bug.

## Explanation

The `index.html` file imports `/modules/one/index.js`, which, per the [Snowpack config](snowpack.config.js)...

```js
module.exports = {
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
```

...corresponds to `src/one/index.js`. That file imports `@two/index.js`, which is an alias for `src/two/index.js`, which is mounted as `/modules/two/index.js`.

Snowpack transforms `src/one/index.js` from this...

```js
import two from '@two/index.js';

const message = `${two}..ONE`;

console.log(message);
```

...to this:

```js
import two from '../two/index.js';

const message = `${two}..ONE`;

console.log(message);
```

Note that `@two/index.js` has been replaced with the relative import `../two/index.js` — in other words, `/modules/one/index.js` imports `/modules/two/index.js`.

But how does `two` get transformed? From this...

```js
import three from '@three/index.js';

export default `${three}..TWO`;
```

...to this:

```js
import three from '../../three/index.js';

export default `${three}..TWO`;
```

**This is incorrect**. The `@three` alias maps to `./three`, which is mounted as `/modules/three`, but if you resolve `../../three/index.js` from `/modules/two/index.js`, then you get `/three/index.js` instead of `/modules/three/index.js`, because Snowpack is attempting to resolve relative filepaths instead of relative URLs.


## Proposal

I believe that aliases should have **nothing to do with the filesystem**. Snowpack is all about URLs, and it feels odd to map an alias to a local directory that is *in turn* mapped to a URL; it feels more logical (to me! I may be missing some essential context) to map an alias to a URL.

Fortunately I believe this can be done in a non-breaking way. There are already two types of alias. From the docs:

```js
// snowpack.config.json
{
  alias: {
    // Type 1: Package Import Alias
    "lodash": "lodash-es",
    "react": "preact/compat",
    // Type 2: Local Directory Import Alias (relative to cwd)
    "components": "./src/components"
    "@app": "./src"
  }
}
```

Package aliases are those whose values begin with a valid package name character. Local directory aliases are those whose values begin with a `.`.

We could add a third type, a URL alias, which is any alias whose value begins with a `/`:

```diff
module.exports = {
  mount: {
    public: '/',
    'src/one': '/modules/one',
    'src/two': '/modules/two',
    'three': '/modules/three'
  },
  alias: {
-    '@one': './src/one',
-    '@two': './src/two',
-    '@three': './three'
+    '@one': '/modules/one',
+    '@two': '/modules/two',
+    '@three': '/modules/three'
  },
};
```

It turns out this *almost* works already, because `one` gets transformed to this...

```js
import two from '../../../../../../../modules/two/index.js';

const message = `${two}..ONE`;

console.log(message);
```

...and browsers 'helpfully' ignore leading `..` segments that go past `/`, so that import is treated as `/modules/two/index.js`. As soon as you try to do anything with the output of `snowpack build` other than serve it (e.g. run an out-of-band optimisation step), it fails.


## File aliases?

I thought I had a need for this, and it turns out I don't, but I still think it's a good idea: it would be nice if an alias could point to a file rather than just a directory:

```js
{
  alias: {
    $app: '/__auto_generated_stuff/app.js'
  }
}
```

```js
import { magic } from '$app';
```