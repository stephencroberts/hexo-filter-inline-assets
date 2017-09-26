const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const spies = require('chai-spies');
const mock = require('mock-require');

chai.use(chaiAsPromised);
chai.use(spies);
const expect = chai.expect;

const regex = /<element\s[^>]*?src(\s+)?=[(\s+)"]?([^>\s"]+__inline=true[^>\s"]*)[^>]*>/gi;

describe('inline assets', () => {
  describe('filter', () => {
    const defaults = {
      enabled: true,
      files: {
        'theme/source/main.file': {
          exists: true,
          content: 'content',
        },
      },
    };
    const setup = ({
      enabled = defaults.enabled,
      files = defaults.files
    } = defaults) => {
      const hexo = {
        config: { inline_assets: { enabled } },
        render: {
          render: chai.spy(({ path }) => new Promise(resolve => resolve(files[path].content))),
        },
        log: chai.spy.object(['warn']),
        theme_dir: 'theme',
      };

      const html = '<html><body><element src="main.file?__inline=true"></body></html>';

      mock('hexo-fs', {
        existsSync: file => files[file].exists,
        readFileSync: file => files[file].content,
      });

      return {
        hexo,
        html,
        filter: mock.reRequire('../lib/filter'),
      };
    };

    after(() => {
      mock.stopAll();
    });

    it('should do nothing if not enabled', () => {
      const { hexo, html, filter } = setup({ enabled: false });
      const result = filter.call(hexo, {
        text: html,
        regex,
        template: '<inline>{content}</inline>',
      });
      return expect(result).to.eventually.deep.equal(html);
    });

    it('should inline files', () => {
      const { hexo, filter } = setup();
      const html = '<html><body><element src="main.file?__inline=true"></body></html>';
      const result = filter.call(hexo, {
        text: html,
        regex,
        template: '<inline>{content}</inline>',
      });
      const expectedResult = '<html><body><inline>content</inline></body></html>';
      return expect(result).to.eventually.deep.equal(expectedResult);
    });

    it('should inline multiple files', () => {
      const { hexo, filter } = setup({
        files: {
          'theme/source/main.file': {
            exists: true,
            content: 'main content',
          },
          'theme/source/another.file': {
            exists: true,
            content: 'another file content',
          },
        },
      });
      const element1 = '<element src="main.file?__inline=true">';
      const element2 = '<element src="another.file?__inline=true">';
      const html = `<html><body>${element1}${element2}</body></html>`;

      const result = filter.call(hexo, {
        text: html,
        regex,
        template: '<inline>{content}</inline>',
      });

      const expectedLink1 = '<inline>main content</inline>';
      const expectedLink2 = '<inline>another file content</inline>';
      const expectedResult = `<html><body>${expectedLink1}${expectedLink2}</body></html>`;
      return expect(result).to.eventually.deep.equal(expectedResult);
    });

    it('should only inline files with the inline flag', () => {
      const { hexo, filter } = setup();
      const element1 = '<element src="main.file?__inline=true">';
      const element2 = '<element src="another.file">';
      const html = `<html><body>${element1}${element2}</body></html>`;

      const result = filter.call(hexo, {
        text: html,
        regex,
        template: '<inline>{content}</inline>',
      });

      const expectedLink1 = '<inline>content</inline>';
      const expectedResult = `<html><body>${expectedLink1}${element2}</body></html>`;
      return expect(result).to.eventually.deep.equal(expectedResult);
    });

    it('should skip files that do not exist', () => {
      const { hexo, filter } = setup({
        files: {
          'theme/source/main.file': {
            exists: false,
            content: 'main content',
          },
          'theme/source/another.file': {
            exists: true,
            content: 'another file content',
          },
        },
      });
      const element1 = '<element src="main.file?__inline=true">';
      const element2 = '<element src="another.file?__inline=true">';
      const html = `<html><body>${element1}${element2}</body></html>`;

      const result = filter.call(hexo, {
        text: html,
        regex,
        template: '<inline>{content}</inline>',
      });

      const expectedLink2 = '<inline>another file content</inline>';
      const expectedResult = `<html><body>${element1}${expectedLink2}</body></html>`;
      return expect(result).to.eventually.deep.equal(expectedResult);
    });

    it('should warn about files that do not exist', () => {
      const { hexo, filter } = setup({
        files: {
          'theme/source/main.file': {
            exists: false,
            content: 'main content',
          },
        },
      });
      const element1 = '<element src="main.file?__inline=true">';
      const html = `<html><body>${element1}</body></html>`;

      return filter.call(hexo, {
        text: html,
        regex,
        template: '<inline>{content}</inline>',
      }).then(() => {
        expect(hexo.log.warn).to.have.been.called();
      });
    });

    it('should invoke hexo render with the correct params', () => {
      const { hexo, html, filter } = setup();

      return filter.call(hexo, {
        text: html,
        regex,
        template: '<inline>{content}</inline>',
      }).then(() => {
        expect(hexo.render.render).to.have.been.called.with.exactly({
          path: 'theme/source/main.file',
        });
      });
    });

    it('should warn about filter errors', () => {
      const { hexo, html, filter } = setup();
      hexo.render.render = () => new Promise((resolve, reject) => reject(new Error('err')));
      return filter.call(hexo, {
        text: html,
        regex,
        template: '<inline>{content}</inline>',
      }).then(() => {
        expect(hexo.log.warn).to.have.been.called();
      });
    });

    it('should return the original string on filter errors', () => {
      const { hexo, html, filter } = setup();
      hexo.render.render = () => new Promise((resolve, reject) => reject(new Error('err')));

      const result = filter.call(hexo, {
        text: html,
        regex,
        template: '<inline>{content}</inline>',
      });

      return expect(result).to.eventually.deep.equal(html);
    });

    it('should use a template for inline content', () => {
      const { hexo, html, filter } = setup();
      const result = filter.call(hexo, {
        text: html,
        regex,
        template: 'my custom {content} template',
      });
      const expectedResult = '<html><body>my custom content template</body></html>';
      return expect(result).to.eventually.deep.equal(expectedResult);
    });
  });
});

