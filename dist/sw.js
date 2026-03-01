/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-7a5e81cd'], (function (workbox) { 'use strict';

  self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
      self.skipWaiting();
    }
  });

  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "strategy-guide.html",
    "revision": "d3725b5de6d5287a387d6dac64e74f90"
  }, {
    "url": "index.html",
    "revision": "58db64f5821ecc9edd2c7798094bbaf5"
  }, {
    "url": "assets/workbox-window.prod.es5-SgebDBZS.js",
    "revision": null
  }, {
    "url": "assets/index-C_NDH8xa.css",
    "revision": null
  }, {
    "url": "assets/index-4p4G5j0I.js",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "9b8f109036c6174f59511339ab556893"
  }, {
    "url": "favicon.svg",
    "revision": "7369c57dd15c377516aa852ab4721fdf"
  }, {
    "url": "icons/icon-144x144.png",
    "revision": "b5ba22847c956ce536218ae568d30e82"
  }, {
    "url": "icons/icon-192x192.png",
    "revision": "a8fc17f0a8b2f0e8f2a1b961ee042d17"
  }, {
    "url": "icons/icon-512x512.png",
    "revision": "40b8bb3a9fc4771e3f6f9f39e7577974"
  }, {
    "url": "icons/icon-72x72.png",
    "revision": "a7a501006e8e4d776cdd31a6059fb936"
  }, {
    "url": "manifest.webmanifest",
    "revision": "d2fd4b201bc2b392170f8078325894ce"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));

}));
