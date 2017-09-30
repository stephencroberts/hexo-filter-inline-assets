const fs = require('fs');
const mime = require('mime');

const imageRegex = /<img\s[^>]*?src(\s+)?=[\s"]+?([^>\s"]+)[^>]*>([^<]*<\/img>)?/gi;

function imagesFilter(str) {
  const hexo = this;
  const log = hexo.log || console;
  const config = hexo.config.inline_assets;

  let matches;
  let newStr = str;

  if (config.enabled) {
    // eslint-disable-next-line no-cond-assign
    while ((matches = imageRegex.exec(str)) !== null) {
      const src = matches[2];
      if (!/^data/.test(src)) {
        const path = `${hexo.theme_dir}source/${src}`;

        try {
          const type = mime.getType(path);
          if (type === null) {
            log.warn(`Unknown file type: ${path}`);
          } else {
            const data = fs.readFileSync(path);
            const base64 = data.toString('base64');

            // Only inline images smaller than the limit
            if (data.length < config.limit) {
              const newSrc = matches[0].replace(/(src(\s+)?=[(\s+)"]?)[^>\s"]+/, `$1data:${type};base64,${base64}$2`);
              newStr = newStr.replace(matches[0], newSrc);
            }
          }
        } catch (err) {
          log.warn(`Image not found: ${path}`);
        }
      }
    }
  }

  return newStr;
}

module.exports = imagesFilter;
