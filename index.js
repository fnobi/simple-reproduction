const EventEmitter = require('events').EventEmitter;
const path = require('path');

const _ = require('lodash');
const fs = require('mz/fs');
const mkdirp = require('mkdirp-promise');
const cheerio = require('cheerio');
const he = require('he');

class SimpleReproduction extends EventEmitter {
  start({ src, dest = '.', routes }) {
    return Promise.resolve()
      .then(() => fs.readFile(src, 'utf-8'))
      .then(html => {
        return Promise.all(
          _.map(routes, (route, htmlPath) => {
            const htmlDest = path.join(dest, completeHtmlPath(htmlPath));
            return Promise.resolve()
              .then(() => mkdirp(htmlDest.replace(/[^/]+\.html$/, '')))
              .then(() =>
                fs.writeFile(htmlDest, applyRouteOption(html, route), {
                  encoding: 'utf-8',
                })
              )
              .then(() =>
                this.emit('write', {
                  htmlDest,
                  route,
                })
              );
          })
        );
      })
      .then(() => this.emit('end'));
  }
}

function completeHtmlPath(pathName) {
  return /\.html$/.test(pathName)
    ? pathName
    : path.join(pathName, 'index.html');
}

function applyRouteOption(html, route) {
  const $ = cheerio.load(html);
  if (route.title) {
    $('title').text(route.title);
  }
  if (route.meta) {
    _.each(route.meta, (content, name) => {
      const $meta = $(
        [
          `meta[name="${name}"]`,
          `meta[property="${name}"]`,
          `meta[http-equiv="${name}"]`,
        ].join(',')
      );
      if ($meta.length) {
        $meta.attr('content', content);
      } else {
        const $appendMeta = $('<meta />');
        $appendMeta.attr(calcMetaKey(name), name);
        $appendMeta.attr('content', content);
        $('head').append($appendMeta);
      }
    });
  }
  return he.decode($.html());
}

function calcMetaKey(name) {
  if (/^(og|twitter):/.test(name)) {
    return 'property';
  }

  if (name === 'refresh') {
    return 'http-equiv';
  }

  return 'name';
}

module.exports = SimpleReproduction;
