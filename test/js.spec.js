const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const spies = require('chai-spies');
const mock = require('mock-require');

chai.use(chaiAsPromised);
chai.use(spies);
const expect = chai.expect;

let context;
function mockFilter() { context = this; }
mock('../lib/filter', chai.spy(mockFilter));
const filter = require('../lib/filter');
const jsFilter = require('../lib/js');

describe('inline assets', () => {
  describe('css', () => {
    beforeEach(() => {
      filter.reset();
    });

    after(() => {
      mock.stopAll();
    });

    it('should invoke the filter with the correct params', () => {
      const mockThis = {};
      const text = 'text';
      jsFilter.call(mockThis, text);
      expect(filter).to.have.been.called();
      expect(filter.__spy.calls[0][0]).to.deep.include({
        text,
        template: '<script>{content}</script>',
      });
    });

    it('should pass context to the filter', () => {
      const mockThis = {};
      jsFilter.call(mockThis, 'text');
      expect(mockThis).to.equal(context);
    });
  });
});
