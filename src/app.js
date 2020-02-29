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
    // var result = 'Test';

    // var data = {};
    // readFiles(
    //   'uploads/',
    //   function(filename, content) {
    //     data[filename] = content;
    //     console.log(data);
    //   },
    //   function(err) {
    //     throw err;
    //   }
    // );

    // readFiles(
    //   'uploads/',
    //   function(filename, content) {
    //     result = convert.xml2json(content, { compact: true });
    //   },
    //   function(err) {
    //     console.log('Some error');
    //     throw err;
    //   }
    // );
    // console.log(result);
    res.status(200).send({ message: 'Success' });
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
