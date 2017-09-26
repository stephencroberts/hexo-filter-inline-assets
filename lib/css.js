const filter = require('./filter');

/**
 * RegEx to match <link> elements with __inline=true
 */
const linkRegex = /<link\s[^>]*?href(\s+)?=[\s"]+?([^>\s"]+__inline=true[^>\s"]*)[^>]*>([^<]*<\/link>)?/gi;

function cssFilter(text) {
  return filter.call(this, {
    text,
    regex: linkRegex,
    template: '<style>{content}</style>',
  });
}

module.exports = cssFilter;

