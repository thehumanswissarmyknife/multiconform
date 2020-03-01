const path = require('path');
const fs = require('fs');
const express = require('express');
const convert = require('xml-js');
const multer = require('multer');
const app = express();

// external files
var fcp = require('./fcp.js');

const FILE_PATH = 'uploads';
const publicDirectoryPath = path.join(__dirname, '../public');

// multer
var storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, `${FILE_PATH}/`);
  },
  filename: function(req, file, cb) {
    cb(null, file.originalname);
  }
});

const upload = multer({
  dest: `${FILE_PATH}/`,
  storage: storage,
  limits: {
    fileSize: 2000000
  }
});

// local storage
var data = { file: 'MiniMouse', timelines: [] };

app.post(
  '/upload',
  upload.array('upload', 10),
  (req, res) => {
    const dirname = 'uploads/';
    fs.readdir(dirname, function(err, filenames) {
      if (err) {
        onError(err);
        return;
      }
      filenames.forEach(function(filename) {
        console.log(filename);
        if (!filename.startsWith('.') && filename.endsWith('fcpxml')) {
          const buffer = fs.readFileSync(dirname + filename);
          const dataString = buffer.toString();
          const dataJSON = convert.xml2json(dataString, {
            compact: true,
            spaces: 2
          });
          data.timelines.push(JSON.parse(dataJSON));
          console.log(data);
          fcp.returnLongestTimeline(data.timelines);
        }
      });
    });

    // var tc1 = fcp.convertFramesToTimecode('240/24s', 24);
    // var tc2 = fcp.convertFramesToTimecode('280/24s', 24);
    // fcp.durationIsLonger(tc1, tc2, 24);

    console.log(data);
    res.status(200).send({
      message: 'Success',
      data: data
    });
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

app.use(express.static(publicDirectoryPath));

const port = process.env.PORT || 80;

app.listen(port, () => console.log(`App is listening on port ${port}.`));

// function readFiles(dirname, onFileContent, onError) {
//   fs.readdir(dirname, function(err, filenames) {
//     if (err) {
//       onError(err);
//       return;
//     }
//     filenames.forEach(function(filename) {
//       console.log(filename);
//       fs.readFileSync(dirname + filename, 'utf-8', function(err, content) {
//         if (err) {
//           onError(err);
//           return;
//         }
//         onFileContent(filename, content);
//       });
//     });
//   });
// }

function returnLaterTimeCode(tc1, tc2, fps) {}
