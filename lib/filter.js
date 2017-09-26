const fs = require('hexo-fs');

/**
* Render the file using hexo
*/
const hexoRender = ({ path, context, element, template }) => (
  context.render.render({
    path,
  }).then(result => ({
    element,
    text: template.replace('{content}', result),
  }))
);

function filter({ text, regex, template }) {
  return new Promise((resolve) => {
    const hexo = this;
    const config = hexo.config.inline_assets;

    if (config.enabled !== true) {
      resolve(text);
    } else {
      // Use hexo logger if available
      const log = hexo.log || console;

      // Ordered list of places to search for input files
      const searchPaths = [`${hexo.theme_dir}/source`];

      // Collect promises for processing src files
      const promises = [];

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
            promises.push(hexoRender({
              context: hexo,
              path,
              element: matches[0],
              template,
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
        // Transform input string by replacing the html elements
        let newText = text;
        results.forEach((result) => {
          newText = newText.replace(result.element, result.text);
        });
        resolve(newText);
      }).catch((err) => {
        log.warn(err);
        resolve(text);
      });
    }
  });
}

module.exports = filter;

