const path = require('path');
const fs = require('fs');
const hbs = require('hbs');

const express = require('express');
const convert = require('xml-js');
const multer = require('multer');
var bodyParser = require('body-parser');
var jsonParser = bodyParser.json();

const app = express();

// external files
var fcp = require('./fcp.js');

// directories
const FILE_PATH = 'uploads';
const dirname = 'uploads';
const publicDirectoryPath = path.join(__dirname, '../public');
const uploadPath = path.join(__dirname, '../uploads');
const viewsPath = path.join(__dirname, '../templates/views');
const partialsPath = path.join(__dirname, '../templates/partials');

var allowCrossDomain = function (req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
	res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

	// intercept OPTIONS method
	if ('OPTIONS' == req.method) {
		res.send(200);
	} else {
		next();
	}
};

app.set('view engine', 'hbs');
app.set('views', viewsPath);
hbs.registerPartials(partialsPath);
var data = { timelines: [] };

var finalFilename = '';
var spacerFrames = true;
var projectName = '';

app.use(bodyParser.json({ limit: '10mb' }));
app.use(allowCrossDomain);

app.get('', (req, res) => {
	data = { timelines: [] };
	deleteFiles(publicDirectoryPath + '/download');
	deleteFiles(uploadPath);
	res.render('index', {
		title: 'Welcome to multi-conform'
	});
});

app.get('/result', (req, res) => {
	deleteFiles(uploadPath);
	res.render('result', {
		title: 'Result'
	});
});

app.get('/api/result', (req, res) => {
	res
		// .setHeader('Content-Type', 'application/json')
		.status(200)
		.send({ name: finalFilename, data: data.timelines, spacerFrames, fileName: projectName });
});

// multer
var storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, `${FILE_PATH}/`);
	},
	filename: function (req, file, cb) {
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

// app.post('/internalupload', (req, res) => {
// 	console.log('req', req.body);
// } );

app.post('/internalupload', jsonParser, function (req, res) {
	var file = JSON.stringify(req.body);

	var options = { compact: true, ignoreComment: true, spaces: 4 };
	var result = convert.json2xml(file, options);

	var filePAthName = 'public/download/' + finalFilename;

	fs.writeFile(filePAthName, result, (err) => {
		// throws an error, you could also catch it here
		if (err) throw err;

		// success case, the file was saved
		console.log('File saved!');
	});
	res.status(200).send({ Good: 'Data', file: finalFilename });
});

app.post(
	'/upload',
	upload.array('upload', 10),
	(req, res) => {
		console.log('req, body', req.body);
		finalFilename = req.body.fileName + '.xml';
		projectName = req.body.fileName;
		var formBody = req.body;

		if (req.body.spacerFrames != 'on') {
			console.log('No spacer');
			spacerFrames = false;
		}

		fs.readdir(dirname, function (err, filenames) {
			if (err) {
				onError(err);
				return;
			}
			filenames.forEach(function (filename) {
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

function deleteFiles (dirname) {
	console.log('DeleteFile', dirname);
	fs.readdir(dirname, function (err, filenames) {
		if (err) throw err;
		filenames.forEach(function (filename) {
			// console.log(filename);
			fs.unlink(dirname + '/' + filename, (err) => {
				if (err) throw err;
				console.log(dirname + filename + ' was deleted');
			});
		});
	});
}

app.use(express.static(publicDirectoryPath));

const port = process.env.PORT || 80;

app.listen(port, () => console.log(`App is listening on port ${port}.`));
