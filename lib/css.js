const fs = require('hexo-fs');

/**
 * RegEx to match <link> elements with __inline=true
 */
const linkRegex = /<link\s[^>]*?href(\s+)?=[(\s+)"]?([^>\s"]+__inline=true[^>\s"]*)[^>]*>/gi;

/**
 * Render the file using hexo
 */
const hexoRender = ({ path, context, link }) => (
  context.render.render({
    path,
  }).then(result => ({
    link,
    styles: `<style>${result}</style>`,
  }))
);

function cssFilter(str) {
  return new Promise((resolve) => {
    const hexo = this;
    const config = hexo.config.inline_assets;

    if (config.enabled !== true) {
      resolve(str);
    } else {
      // Use hexo logger if available
      const log = hexo.log || console;

      // Ordered list of places to search for input files
      const searchPaths = [`${hexo.theme_dir}/source`];

      // Collect promises for processing src files
      const promises = [];

      let matches;
      // eslint-disable-next-line no-cond-assign
      while ((matches = linkRegex.exec(str)) !== null) {
        // Strip any query params
        const src = matches[2].replace(/\?.*$/, '');

        // Search for the file
        let found = false;
        let path;
        for (let i = 0; i < searchPaths.length; i += 1) {
          // Assemble absolute path, removing double slashes
          path = `${searchPaths[i]}/${src}`.replace(/\/+/g, '/');

          // Use hexo to render the src file
          if (fs.existsSync(path)) {
            promises.push(hexoRender({
              context: hexo,
              path,
              link: matches[0],
            }));

            // Bail after we find the file
            found = true;
            break;
          }
        }

        if (found === false) {
          log.warn(`File not found: ${path}`);
        }
      }

      Promise.all(promises).then((results) => {
        // Transform input string by replacing the <link> elements
        // with style blocks
        let newStr = str;
        results.forEach((result) => {
          newStr = newStr.replace(result.link, result.styles);
        });
        resolve(newStr);
      }).catch((err) => {
        log.warn(err);
        resolve(str);
      });
    }
  });
}

module.exports = cssFilter;

