const EventEmitter = require('events').EventEmitter;
const path = require('path');

const _ = require('lodash');
const fs = require('mz/fs');
const mkdirp = require('mkdirp-promise');
const cheerio = require('cheerio');
const he = require('he');
const pug = require('pug');

class SimpleReproduction extends EventEmitter {
  constructor(opts = {}) {
    super();
    this.init(opts);
  }

  init({ src, dest = '.', templateOptions = {}, templateParameters = {} }) {
    this.src = src;
    this.dest = dest;
    this.templateOptions = templateOptions;
    this.templateParameters = templateParameters;
    if (src || templateOptions) this.template = null;
  }

  start(opts) {
    this.init(opts);
    return Promise.resolve()
      .then(() => this.loadTemplate())
      .then(() => {
        return Promise.all(
          _.map(opts.routes, (route, htmlPath) => {
            return this.buildRoute(route, htmlPath);
          })
        );
      })
      .then(() => this.emit('end'));
  }

  buildRoute(route, htmlPath) {
    const htmlDest = path.join(this.dest, completeHtmlPath(htmlPath));
    return Promise.resolve()
      .then(() => mkdirp(htmlDest.replace(/[^/]+\.html$/, '')))
      .then(() => {
        const html = this.buildTemplate(route);
        const injected = applyRouteOption(html, route);
        return fs.writeFile(htmlDest, injected, {
          encoding: 'utf-8',
        });
      })
      .then(() =>
        this.emit('write', {
          htmlDest,
          route,
        })
      );
  }

  loadTemplate() {
    if (this.template) return Promise.resolve(this.template);
    return Promise.resolve()
      .then(() => fs.readFile(this.src, 'utf-8'))
      .then(body => {
        if (/\.html$/.test(this.src)) {
          return (this.template = body);
        }
        if (/\.pug$/.test(this.src)) {
          return (this.template = pug.compile(body, this.templateOptions));
        }
        return Promise.reject(new Error(`${this.src} is invalid src.`));
      });
  }

  buildTemplate({ locals }) {
    const parameters = Object.assign({}, this.templateParameters, locals);
    if (/\.html$/.test(this.src)) {
      return this.template;
    }
    if (/\.pug$/.test(this.src)) {
      return this.template(parameters);
    }
    return Promise.reject(new Error(`${this.src} is invalid src.`));
  }
}

function completeHtmlPath(pathName) {
  return /\.html$/.test(pathName)
    ? pathName
    : path.join(pathName, 'index.html');
}

function applyRouteOption(html, { title, meta }) {
  const $ = cheerio.load(html);
  if (title) {
    $('title').text(title);
  }
  if (meta) {
    _.each(meta, (content, name) => {
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
