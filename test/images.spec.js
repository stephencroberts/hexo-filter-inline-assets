const chai = require('chai');
const spies = require('chai-spies');
const mock = require('mock-require');

chai.use(spies);
const expect = chai.expect;

describe('inline images', () => {
  const defaults = {
    enabled: true,
    limit: 100000,
    html: '<img src="image.png" />',
  };
  const setup = (
    {
      enabled = defaults.enabled,
      limit = defaults.limit,
      html = defaults.html,
    } = defaults) => {
    const hexo = {
      config: {
        inline_assets: {
          enabled,
          limit,
        },
      },
      log: {
        warn: chai.spy(),
      },
      theme_dir: 'theme/',
    };

    mock('fs', {
      readFileSync: path => new Buffer(path),
    });

    const inlineImages = mock.reRequire('../lib/images');

    return {
      hexo,
      html,
      inlineImages,
    };
  };

  after(() => {
    mock.stopAll();
  });

  it('should do nothing if not enabled', () => {
    const { hexo, html, inlineImages } = setup({ enabled: false });
    const newHtml = inlineImages.call(hexo, html);
    expect(html).to.equal(newHtml);
  });

  it('should inline an image', () => {
    const { hexo, html, inlineImages } = setup({
      html: '<img src="image.png" />',
    });
    const newHtml = inlineImages.call(hexo, html);
    const imageData = new Buffer(`${hexo.theme_dir}source/image.png`).toString('base64');
    const expectedHtml = `<img src="data:image/png;base64,${imageData}" />`;
    expect(expectedHtml).to.equal(newHtml);
  });

  it('should inline multiple images', () => {
    const { hexo, html, inlineImages } = setup({
      html: '<img src="image1.png" /><img src="image2.png" />',
    });
    const imageData1 = new Buffer(`${hexo.theme_dir}source/image1.png`).toString('base64');
    const imageData2 = new Buffer(`${hexo.theme_dir}source/image2.png`).toString('base64');
    const newHtml = inlineImages.call(hexo, html);
    const expectedHtml = `<img src="data:image/png;base64,${imageData1}" />`
    + `<img src="data:image/png;base64,${imageData2}" />`;
    expect(expectedHtml).to.equal(newHtml);
  });

  it('should log if the image is not found', () => {
    const { hexo, html } = setup();
    mock('fs', { readFileSync: () => { throw new Error('not found'); } });
    const inlineImages = mock.reRequire('../lib/images');
    inlineImages.call(hexo, html);
    expect(hexo.log.warn).to.have.been.called();
  });

  it('should only inline images with file size less than the limit', () => {
    const { hexo, html, inlineImages } = setup({
      html: '<img src="image.png" />',
      limit: 22,
    });
    const newHtml = inlineImages.call(hexo, html);
    expect(html).to.equal(newHtml);
  });

  it('should use the MIME type of the image', () => {
    const { hexo, html, inlineImages } = setup({
      html: '<img src="image.jpg" />',
    });
    const newHtml = inlineImages.call(hexo, html);
    const imageData = new Buffer(`${hexo.theme_dir}source/image.jpg`).toString('base64');
    const expectedHtml = `<img src="data:image/jpeg;base64,${imageData}" />`;
    expect(expectedHtml).to.equal(newHtml);
  });

  it('should skip files with no known MIME type', () => {
    const { hexo, html, inlineImages } = setup({
      html: '<img src="image.file" />',
    });
    const newHtml = inlineImages.call(hexo, html);
    const expectedHtml = '<img src="image.file" />';
    expect(expectedHtml).to.equal(newHtml);
  });

  it('should warn about files with no known MIME type', () => {
    const { hexo, html, inlineImages } = setup({
      html: '<img src="image.file" />',
    });
    inlineImages.call(hexo, html);
    expect(hexo.log.warn).to.have.been.called();
  });

  it('should log to the console if the hexo logger is not available', () => {
    const { hexo, html } = setup();
    hexo.log = undefined;
    global.console.warn = chai.spy();
    mock('fs', { readFileSync: () => { throw new Error('not found'); } });
    const inlineImages = mock.reRequire('../lib/images');
    inlineImages.call(hexo, html);
    expect(console.warn).to.have.been.called();
  });

  it('should skip data images', () => {
    const { hexo, html, inlineImages } = setup({
      html: '<img src="data:image/jpg;base64,awef" />',
    });
    const newHtml = inlineImages.call(hexo, html);
    expect(html).to.equal(newHtml);
    expect(hexo.log.warn).to.not.have.been.called();
  });
});
