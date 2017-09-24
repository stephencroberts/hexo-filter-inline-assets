const fs = require('hexo-fs');

/**
 * RegEx to match <link> elements with __inline=true
 */
const linkRegex = /<link\s[^>]*?href(\s+)?=[(\s+)"]?([^>\s"]+__inline=true[^>\s"]*)[^>]*>/gi;

/**
 * Run the text through hexo filters
 */
const hexoFilter = ({ text, context, path, link }) => (
  // Process the file with any CSS filters
  context.execFilter(
    'after_render:css',
    text,
    {
      context,
      args: [{ path, text, engine: 'css' }],
    },
  ).then(result => ({
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
      const log = hexo.log || console;
      const searchPaths = [
        `${hexo.theme_dir}/source`,
      ];
      const promises = [];
      let matches;
      let newStr = str;

      // eslint-disable-next-line no-cond-assign
      while ((matches = linkRegex.exec(str)) !== null) {
        // Strip any query params
        const src = matches[2].replace(/\?.*$/, '');

        // Search for the file
        let found = false;
        let path;
        for (let i = 0; i < searchPaths.length; i += 1) {
          path = `${searchPaths[i]}/${src}`.replace(/\/+/g, '/');

          if (fs.existsSync(path)) {
            const css = fs.readFileSync(path).toString();
            promises.push(hexoFilter({
              text: css,
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
        results.forEach((result) => {
          newStr = newStr.replace(result.link, result.styles);
        });
        resolve(newStr);
      }).catch((err) => {
        log.warn(err);
        resolve(newStr);
      });
    }
  });
}

module.exports = cssFilter;

