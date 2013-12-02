var strftime = require('strftime');
var runtimeerror = require('../runtimeerror');

describe("runtimeerror", function() {
  describe("suffixed", function() {
    var oneday = 3600000*24;
    var today = strftime.strftime('%b %d', new Date());
    it("should append suffix [today, 1]", function() {
      expect(runtimeerror.suffixed('hello')).toBe('hello<br/>\n{"runtimeerror":["' + today + '",1]}');
    });
    it("should modify suffix if exist", function() {
      expect(runtimeerror.suffixed('hello<br/>\n{"runtimeerror": ["' + today + '",99]}')).toBe('hello<br/>\n{"runtimeerror":["' + today + '",100]}');
    });
    it("should keep old date & counts if exist", function() {
      var yesterday = strftime.strftime('%b %d', new Date(new Date() - oneday));
      var ancient  = strftime.strftime('%b %d', new Date(new Date() - oneday*7));
      expect(runtimeerror.suffixed('hello<br/>\n{"runtimeerror": ["' + ancient + '",88,"' + yesterday + '",99]}')).toBe('hello<br/>\n{"runtimeerror":["' + yesterday + '",99,"' + today + '",1]}');
    });
  })
});
