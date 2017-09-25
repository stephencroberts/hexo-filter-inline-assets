const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const spies = require('chai-spies');
const mock = require('mock-require');

chai.use(chaiAsPromised);
chai.use(spies);
const expect = chai.expect;

describe('inline assets', () => {
  describe('css', () => {
    const defaults = {
      enabled: true,
      files: {
        'theme/source/css/main.css': {
          exists: true,
          content: 'body { background-color: red; }',
        },
      },
    };
    const setup = ({
      enabled = defaults.enabled,
      files = defaults.files,
    } = defaults) => {
      const hexo = {
        config: { inline_assets: { enabled } },
        render: {
          render: chai.spy(({ path }) => new Promise(resolve => resolve(files[path].content))),
        },
        log: chai.spy.object(['warn']),
        theme_dir: 'theme',
      };

      const html = '<html><body><link rel="stylesheet" href="css/main.css?__inline=true"></body></html>';

      mock('hexo-fs', {
        existsSync: file => files[file].exists,
        readFileSync: file => files[file].content,
      });

      return {
        hexo,
        html,
        cssFilter: mock.reRequire('../lib/css'),
      };
    };

    it('should do nothing if not enabled', () => {
      const { hexo, html, cssFilter } = setup({ enabled: false });
      const result = cssFilter.call(hexo, html);
      return expect(result).to.eventually.deep.equal(html);
    });

    it('should inline css', () => {
      const { hexo, cssFilter } = setup();
      const html = '<html><body><link rel="stylesheet" href="css/main.css?__inline=true"></body></html>';
      const result = cssFilter.call(hexo, html);
      const expectedResult = '<html><body><style>body { background-color: red; }</style></body></html>';
      return expect(result).to.eventually.deep.equal(expectedResult);
    });

    it('should inline multiple files', () => {
      const { hexo, cssFilter } = setup({
        files: {
          'theme/source/css/main.css': {
            exists: true,
            content: 'body { background-color: red; }',
          },
          'theme/source/css/fonts.css': {
            exists: true,
            content: 'div { color: blue; }',
          },
        },
      });
      const link1 = '<link rel="stylesheet" href="css/main.css?__inline=true">';
      const link2 = '<link rel="stylesheet" href="css/fonts.css?__inline=true">';
      const html = `<html><body>${link1}${link2}</body></html>`;

      const result = cssFilter.call(hexo, html);

      const expectedLink1 = '<style>body { background-color: red; }</style>';
      const expectedLink2 = '<style>div { color: blue; }</style>';
      const expectedResult = `<html><body>${expectedLink1}${expectedLink2}</body></html>`;
      return expect(result).to.eventually.deep.equal(expectedResult);
    });

    it('should only inline css with the inline flag', () => {
      const { hexo, cssFilter } = setup();
      const link1 = '<link rel="stylesheet" href="css/main.css?__inline=true">';
      const link2 = '<link rel="stylesheet" href="css/fonts.css">';
      const html = `<html><body>${link1}${link2}</body></html>`;

      const result = cssFilter.call(hexo, html);

      const expectedLink1 = '<style>body { background-color: red; }</style>';
      const expectedResult = `<html><body>${expectedLink1}${link2}</body></html>`;
      return expect(result).to.eventually.deep.equal(expectedResult);
    });

    it('should skip files that do not exist', () => {
      const { hexo, cssFilter } = setup({
        files: {
          'theme/source/css/main.css': {
            exists: false,
            content: 'body { background-color: red; }',
          },
          'theme/source/css/fonts.css': {
            exists: true,
            content: 'div { color: blue; }',
          },
        },
      });
      const link1 = '<link rel="stylesheet" href="css/main.css?__inline=true">';
      const link2 = '<link rel="stylesheet" href="css/fonts.css?__inline=true">';
      const html = `<html><body>${link1}${link2}</body></html>`;

      const result = cssFilter.call(hexo, html);

      const expectedLink2 = '<style>div { color: blue; }</style>';
      const expectedResult = `<html><body>${link1}${expectedLink2}</body></html>`;
      return expect(result).to.eventually.deep.equal(expectedResult);
    });

    it('should warn about files that do not exist', () => {
      const { hexo, cssFilter } = setup({
        files: {
          'theme/source/css/main.css': {
            exists: false,
            content: 'body { background-color: red; }',
          },
        },
      });
      const link1 = '<link rel="stylesheet" href="css/main.css?__inline=true">';
      const html = `<html><body>${link1}</body></html>`;

      return cssFilter.call(hexo, html).then(() => {
        expect(hexo.log.warn).to.have.been.called();
      });
    });

    it('should invoke hexo render with the correct params', () => {
      const { hexo, html, cssFilter } = setup();
      return cssFilter.call(hexo, html).then(() => {
        expect(hexo.render.render).to.have.been.called.with.exactly({
          path: 'theme/source/css/main.css',
        });
      });
    });

    it('should warn about filter errors', () => {
      const { hexo, html, cssFilter } = setup();
      hexo.render.render = () => new Promise((resolve, reject) => reject(new Error('err')));
      return cssFilter.call(hexo, html).then(() => {
        expect(hexo.log.warn).to.have.been.called();
      });
    });

    it('should return the original string on filter errors', () => {
      const { hexo, html, cssFilter } = setup();
      hexo.render.render = () => new Promise((resolve, reject) => reject(new Error('err')));
      const result = cssFilter.call(hexo, html);
      return expect(result).to.eventually.deep.equal(html);
    });
  });
});

