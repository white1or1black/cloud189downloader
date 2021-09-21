const Cloud189 = require('../Cloud189');

jest.mock('../lib/requireEsModule', () => {
  return {
    requireEsModule: _ => _,
    removeImportExport: _ => _
  }
});

describe('Cloud189 test.', () => {
  let cloud189 = null;
  beforeEach(() => {
    cloud189 = new Cloud189('');
  });

  describe('Download progress test.', () => {
    it('Item of State in progress number should be 2', () => {
      cloud189.isDlReq = true;
      expect(cloud189.hasDlReq()).toBe(true);
    })
  });
});