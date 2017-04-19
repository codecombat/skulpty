var util = require('./util.js');

describe("Strings", function () {
  it("Multiline literal", function () {
    var code = "\
    return '''1\n\
	2\n\
	3'''";
    expect(util.run(code)).to.equal("1\n  2\n  3"); // Spaces are due to auto-indent of test
  });

});
