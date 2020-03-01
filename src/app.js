const path = require('path');
const fs = require('fs');
const express = require('express');
var convert = require('xml-js');
const multer = require('multer');

const FILE_PATH = 'uploads';
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

const app = express();
const publicDirectoryPath = path.join(__dirname, '../public');

app.post(
  '/upload',
  upload.array('upload', 10),
  (req, res) => {
    var data = { file: 'MiniMouse' };
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
          // console.log(dataJSON);
          data[filename] = JSON.parse(dataJSON).fcpxml.library;
          console.log(data);
        }

        // var result1 = convert.xml2json(JSON.parse(dataJSON), {
        //   compact: true,
        //   spaces: 1
        // });

        // const fileData = fs.readFileSync(dirname + filename).toString();
        // const fileDataJSON = convert.xml2json(fileData, {
        //   compact: true,
        //   spaces: 1
        // });
        // console.log(result1);
        // data[filename] = JSON.parse(fileDataJSON);
        // console.log(data);
        // console.log(JSON.stringify(data));
      });
    });

    convertFramesToTimecode('155/8s', 24);
    console.log(data);
    res.status(200).send({
      message: 'Success',
      data: data
      // res2: JSON.parse(result2)
    });
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

app.use(express.static(publicDirectoryPath));

const port = process.env.PORT || 80;

app.listen(port, () => console.log(`App is listening on port ${port}.`));

function readFiles(dirname, onFileContent, onError) {
  fs.readdir(dirname, function(err, filenames) {
    if (err) {
      onError(err);
      return;
    }
    filenames.forEach(function(filename) {
      console.log(filename);
      fs.readFileSync(dirname + filename, 'utf-8', function(err, content) {
        if (err) {
          onError(err);
          return;
        }
        onFileContent(filename, content);
      });
    });
  });
}

function convertFramesToTimecode(frameString, fps) {
  // frameString is in the format int/ints, e.g. 24/8s
  const totalFrames = parseInt(frameString.split('/')[0]);
  const divider = parseInt(
    frameString.split('/')[1].substring(0, frameString.split('/')[1].length - 1)
  );

  var hours, minutes, seconds, frames;
  var one = parseInt(totalFrames / divider);
  console.log(totalFrames, divider, parseInt(one / 3600));
  hours = parseInt(parseInt(totalFrames / divider) / 3600);
  minutes = parseInt((totalFrames / divider / 60) % 60);
  seconds = parseInt(totalFrames / divider) % 60;
  frames = (totalFrames % divider) * (fps / divider);

  const timeCode = {
    hours,
    minutes,
    seconds,
    frames
  };
  console.log(timeCode);
  return timeCode;
}

function returnLaterTimeCode(tc1, tc2, fps) {}
