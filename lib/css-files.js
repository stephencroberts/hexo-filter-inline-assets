const path = require('path');
const fs = require('fs');
const mime = require('mime');

const imageRegex = /url\((.*?)\)/g;

function cssFilesFilter(str, file) {
  const hexo = this;
  const log = hexo.log || console;
  const config = hexo.config.inline_assets;
  const cssPath = path.dirname(file.path);

  let matches;
  let newStr = str;

  if (config.enabled) {
    // eslint-disable-next-line no-cond-assign
    while ((matches = imageRegex.exec(str)) !== null) {
      const match = matches[1];
      const src = match.replace(/"/g, '');
      if (!/^data/.test(src)) {
        const filePath = path.resolve(cssPath, src);

        try {
          const type = mime.getType(filePath);
          if (type === null) {
            log.warn(`Unknown file type: ${filePath}`);
          } else {
            const data = fs.readFileSync(filePath);
            const base64 = data.toString('base64');

            // Only inline images smaller than the limit
            if (data.length < config.limit) {
              newStr = newStr.replace(matches[0], `url("data:${type};base64,${base64}")`);
            }
          }
        } catch (err) {
          log.warn(`Image not found: ${filePath}`);
        }
      }
    }
  }

  return newStr;
}

module.exports = cssFilesFilter;
