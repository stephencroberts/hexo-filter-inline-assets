const fs = require('hexo-fs');

function filter({ text, regex, template }) {
  const hexo = this;
  const config = hexo.config.inline_assets;

  if (config.enabled !== true) {
    return text;
  }
  // Use hexo logger if available
  const log = hexo.log || console;
  let newText = text;

  // Ordered list of places to search for input files
  const searchPaths = [`${hexo.theme_dir}/source`];

  let matches;
  // eslint-disable-next-line no-cond-assign
  while ((matches = regex.exec(text)) !== null) {
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
        try {
          const content = hexo.render.renderSync({ path });
          newText = newText.replace(matches[0], template.replace('{content}', content));
        } catch (err) {
          log.warn(err);
        }

        // Bail after we find the file
        found = true;
        break;
      }
    }

    if (found === false) {
      log.warn(`File not found: ${path}`);
    }
  }

  return newText;
}

module.exports = filter;

