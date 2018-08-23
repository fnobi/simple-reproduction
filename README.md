simple-reproduction
==============

copy html with meta rewriting.

## usage

```js
const SimpleReproduction = require("simple-reproduction");

const DIST = "dist";

const reproduction = new SimpleReproduction();

reproduction.on("write", ({ htmlDest }) => {
  console.log("[write]", htmlDest);
});

reproduction.on("end", () => {
  console.log("[done]");
});

reproduction.start({
  src: `${DIST}/index.html`,
  routes: {
    [`${DIST}/share-test`]: {
      title: "dummy",
      meta: {
        description: "dummy",
        "og:image": "http://example.com/dummy1.png"
      }
    },
    [`${DIST}/share-test2`]: {
      title: "dummy2",
      meta: {
        description: "dummy",
        "og:image": "http://example.com/dummy2.png"
      }
    }
  }
});
```
