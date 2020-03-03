const path = require('path');
const fs = require('fs');
const hbs = require('hbs');

const express = require('express');
const convert = require('xml-js');
const multer = require('multer');

const app = express();

// external files
var fcp = require('./fcp.js');

// directories
const FILE_PATH = 'uploads';
const dirname = 'uploads/';
const publicDirectoryPath = path.join(__dirname, '../public');
const viewsPath = path.join(__dirname, '../templates/views');
const partialsPath = path.join(__dirname, '../templates/partials');

app.set('view engine', 'hbs');
app.set('views', viewsPath);
hbs.registerPartials(partialsPath);
var data = { timelines: [] };

app.get('', (req, res) => {
  data = { timelines: [] };
  deleteFiles();
  res.render('index', {
    title: 'Welcome to multi-conform'
  });
});

app.get('/result', (req, res) => {
  res.render('result', {
    title: 'Result'
  });
});

app.get('/api/result', (req, res) => {
  res
    // .setHeader('Content-Type', 'application/json')
    .status(200)
    .send(data.timelines);
});

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

app.post(
  '/upload',
  upload.array('upload', 10),
  (req, res) => {
    fs.readdir(dirname, function(err, filenames) {
      if (err) {
        onError(err);
        return;
      }
      filenames.forEach(function(filename) {
        console.log(filename);
        if (!filename.startsWith('.') && filename.endsWith('xml')) {
          const buffer = fs.readFileSync(dirname + filename);
          const dataString = buffer.toString();
          const dataJSON = convert.xml2json(dataString, {
            compact: true,
            spaces: 2
          });
          data.timelines.push(JSON.parse(dataJSON));
        }
      });
    });

    res.status(200).redirect('./result');
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

function deleteFiles() {
  fs.readdir(dirname, function(err, filenames) {
    if (err) {
      onError(err);
      return;
    }
    filenames.forEach(function(filename) {
      console.log(filename);
      fs.unlink(dirname + filename, err => {
        if (err) throw err;
        console.log(dirname + filename + ' was deleted');
      });
    });
  });
}

app.use(express.static(publicDirectoryPath));

const port = process.env.PORT || 80;

app.listen(port, () => console.log(`App is listening on port ${port}.`));
