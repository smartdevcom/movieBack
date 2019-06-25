var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var mysql = require('mysql');
var multer = require('multer');
var cors = require('cors');

app.use(bodyParser.json());
app.use(cors());
app.use(
	bodyParser.urlencoded({
		extended: true
	})
);
app.use(express.static('posters'));

// default route
app.get('/', function(req, res) {
	return res.send({ error: true, message: 'hello' });
});

// connection configurations

var dbConn = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: '',
	database: 'movie'
});

dbConn.connect();

// Retrieve all users
app.get('/movies', function(req, res) {
	dbConn.query('SELECT * FROM movies', function(error, results, fields) {
		if (error) throw error;
		return res.json({ error: false, data: results, message: 'movies list.' });
	});
});

let storage = multer.diskStorage({
	destination: function(req, file, cb) {
		cb(null, 'posters');
	},
	filename: function(req, file, cb) {
		cb(null, Date.now() + '-' + file.originalname);
	}
});

let upload = multer({ storage: storage }).single('file');

app.post('/add_movie', function(req, res) {
	try {
		upload(req, res, async function(err) {
			if (err instanceof multer.MulterError) {
				return res.status(500).json(err);
			} else if (err) {
				return res.status(500).json(err);
			}
			const { name, duration, price } = req.body;
			let photo = req.file.filename;
			dbConn.query(
				'INSERT INTO movies SET ? ',
				{
					name: name,
					duration: duration,
					photo: photo,
					price: price,
					rating: 'n/a',
					genre: 'n/a',
					director: 'n/a'
				},
				function(error, results, fields) {
					if (error) throw error;
					return res.json({
						error: false,
						data: results,
						message: 'New movie has been added successfully.'
					});
				}
			);
		});
	} catch (err) {
		console.log(err);
		res.json({
			success: false
		});
	}
});

// Update user with id
app.put('/movie', function(req, res) {
	let movie = req.body.movie;
	let { id, like_count } = movie;
	if (!movie) {
		return res.status(400).send({ error: movie, message: 'Please provide movie' });
	}

	dbConn.query('UPDATE movies SET like_count = ? WHERE id = ?', [like_count, id], function(error, results, fields) {
		if (error) throw error;
		return res.send({ error: false, data: results, message: 'movie has been updated successfully.' });
	});
});

app.listen(5000, function() {
	console.log('App is running on port 5000');
});

module.exports = app;
