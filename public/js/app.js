var convert = require('xml-js');
const fs = require('fs');
console.log('Click me');

var xml = fs.read;
fs.readFile(__dirname + '/Test.fcpxml', (err, data) => {
  if (err) throw err;
  // console.log(data);
  var result1 = convert.xml2json(data, { compact: true, spaces: 4 });
  console.log(result1);
  var test = result1.fcpxml;
  console.log(test);
});
