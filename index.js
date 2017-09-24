hexo.config.inline_assets = Object.assign({
  enabled: true,
}, hexo.config.inline_assets);

hexo.extend.filter.register('after_render:html', require('./lib/css'));

