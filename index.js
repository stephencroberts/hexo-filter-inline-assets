hexo.config.inline_assets = Object.assign({
  enabled: true,
  limit: 100000,
}, hexo.config.inline_assets);

hexo.extend.filter.register('after_render:html', require('./lib/css'));
hexo.extend.filter.register('after_render:html', require('./lib/js'));
hexo.extend.filter.register('after_render:html', require('./lib/images'));
