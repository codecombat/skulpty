var util = require('./util.js');

// NOTE: Be careful with indentation when using multiline strings

describe("Errors", function () {

  it("Indent error while block", function () {
    var code = "\n\
    while True:\n\
    break\n\
    ";
    var error;
    try {
      util.parse(code);
    } catch (e) {
      error = e;
    }
    expect(error.message).to.equal("Empty while statement. Put 4 spaces in front of statements inside the while statement.");
    expect(error.pos).to.equal(12);
    expect(error.loc).to.deep.equal({line: 2, column: 0});
  });

  it("Indent error if block", function () {
    var code = "\
    if True:\n\
    x = 5\n\
    ";
    var error;
    try {
      util.parse(code);
    } catch (e) {
      error = e;
    }
    expect(error.message).to.equal("Empty if statement. Put 4 spaces in front of statements inside the if statement.");
    expect(error.pos).to.equal(9);
    expect(error.loc).to.deep.equal({line: 2, column: 0});
  });

  it("Indent error within if block", function () {
    var code = "\
    if True:\n\
      x = 5\n\
        x = 5\n\
    ";
    var error;
    try {
      util.parse(code);
    } catch (e) {
      error = e;
    }
    expect(error.message).to.equal("Indentation error.");
    expect(error.pos).to.equal(17);
    expect(error.loc).to.deep.equal({line: 3, column: 0});
  });

  it("else with no colon", function () {
    var code = "\
    if False:\n\
      x = 5\n\
    else\n\
      x = 7\n\
    ";
    var error;
    try {
      util.parse(code);
    } catch (e) {
      error = e;
    }
    expect(error.message).to.equal("Need a `:` on the end of the line following `else`.");
    expect(error.pos).to.equal(22);
    expect(error.loc).to.deep.equal({line: 3, column: 4});
  });

  it("JS-style else if", function () {
    var code = "\
    if False:\n\
      x = 5\n\
    else if True:\n\
      x = 7\n\
    ";
    var error;
    try {
      util.parse(code);
    } catch (e) {
      error = e;
    }
    expect(error.message).to.match(/^Need a .:. after .else./);
    expect(error.pos).to.equal(23);
    expect(error.loc).to.deep.equal({line: 3, column: 5});
  });

  it("Error for for-else", function() {
    expect(util.run("for x in None:\n\tpass\nelse:\n\tpass").toString()).to.equal('Error: else: for-else statement unsupported.');
  });

});
