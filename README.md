# simple-reproduction

copy html with meta rewriting.

## usage

### init

```js
const SimpleReproduction = require('simple-reproduction');

const DIST = 'dist';

const reproduction = new SimpleReproduction({
  dest: DIST,
});

reproduction.on('write', ({ htmlDest }) => {
  console.log('[write]', htmlDest);
});

reproduction.on('end', () => {
  console.log('[done]');
});
```

### copy html with injection

```js
reproduction.start({
  src: `${DIST}/index.html`,
  routes: {
    ['/share-test']: {
      title: 'dummy',
      meta: {
        description: 'dummy',
        'og:image': 'http://example.com/dummy1.png',
      },
    },
    ['/share-test2']: {
      title: 'dummy2',
      meta: {
        description: 'dummy',
        'og:image': 'http://example.com/dummy2.png',
      },
    },
  },
});
```

### build pug & html injection

```js
reproduction.start({
  src: `${DIST}/index.pug`,
  routes: {
    ['/share-test3']: {
      locals: {
        title: 'dummy3',
        description: 'dummy3',
        shareImage: 'http://example.com/dummy3.png',
      },
    },
  },
});
```
