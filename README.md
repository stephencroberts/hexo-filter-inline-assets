# hexo-filter-inline-assets

[![npm](https://img.shields.io/npm/v/hexo-filter-inline-assets.svg)](https://npmjs.org/package/hexo-filter-inline-assets)
[![npm](https://img.shields.io/npm/dt/hexo-filter-inline-assets.svg)](https://npmjs.org/package/hexo-filter-inline-assets)
[![Build Status](https://img.shields.io/travis/stephencroberts/hexo-filter-inline-assets.svg)](https://travis-ci.org/stephencroberts/hexo-filter-inline-assets)
[![NPM Dependencies](https://img.shields.io/david/stephencroberts/hexo-filter-inline-assets.svg)](https://www.npmjs.com/package/hexo-filter-inline-assets)
[![Coverage Status](https://img.shields.io/coveralls/stephencroberts/hexo-filter-inline-assets.svg)](https://coveralls.io/r/stephencroberts/hexo-filter-inline-assets)
![](https://img.shields.io/npm/l/hexo-filter-inline-assets.svg)

Hexo filter that inlines images, JS, and CSS in HTML

## Installation

```bash
$ yarn add hexo-filter-inline-assets
```

## Usage

The filter is enabled by default with the configuration:

```
inline_assets:
  enabled: true
  limit: 100000
```

### Images

Any images in HTML are inlined if their file size is smaller than the `limit`
defined in the configuration.

### JS & CSS

To mark a JS or CSS file for inlining, just add `?__inline=true` to the end of the file
path:

```html
<link rel="stylesheet" href="css/main.css?__inline=true">
<script src="myscript.js?__inline=true"></script>
```

