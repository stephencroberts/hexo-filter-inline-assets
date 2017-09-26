const filter = require('./filter');

/**
 * RegEx to match <script> elements with __inline=true
 */

const linkRegex = /<script\s[^>]*?src(\s+)?=[\s"]+?([^>\s"]+__inline=true[^>\s"]*)[^>]*>([^<]*<\/script>)?/gi;

function jsFilter(text) {
  return filter.call(this, {
    text,
    regex: linkRegex,
    template: '<script>{content}</script>',
  });
}

module.exports = jsFilter;

