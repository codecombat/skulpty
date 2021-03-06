var util = require('./util.js');

describe("Syntax Problems", function () {
  it("not unidenting an else", function () {
    var code = "if False:\n    print(1)\n    else:\n    print(2)";
    var result = util.run(code);
    expect(result.name).to.equal('SyntaxError');
    expect(result.message).to.equal('`else` needs to line up with its `if`.');
  });

  it("not unidenting an else", function () {
    var code = "if False:\n    print(1)\n    else:\n        print(2)";
    var result = util.run(code);
    expect(result.name).to.equal('SyntaxError');
    expect(result.message).to.equal('`else` needs to line up with its `if`.');
  });

  it("if with missing colon", function () {
    var code = "if False\n    print(1)\n";
    var result = util.run(code);
    expect(result.name).to.equal('SyntaxError');
  });
 
  it("empty if with no pass", function () {
    var code = "if False\n    print(1)\n";
    var result = util.run(code);
    expect(result.name).to.equal('SyntaxError');
  });

  
});