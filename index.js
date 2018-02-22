const express = require('express');
const bodyParser = require('body-parser');
const del = require('del');
const fs = require('fs');
const shell = require('shelljs');
const app = express();
const basicAuth = require('express-basic-auth');


app.use(bodyParser.json({limit: '50mb'}));       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true,
  limit: '50mb'
})); 

// authenticate
if (process.env.PASSWORD && process.env.USERNAME) {
	authObj = {};
	authObj[process.env.USERNAME] = process.env.PASSWORD;
	app.use(basicAuth({
	    users: authObj,
	    challenge: true
	}));
}


app.get('/zip', (req, res) => {
	res.sendFile(__dirname + '/files.zip');
})

app.get('/', (req, res) => res.sendFile(__dirname + '/app.html'));
app.post('/', (req, res) => {

	try {

		del(['files/*', '*.zip']).then(paths => {

			let fileTemplate = req.body.file;
			let htmlTemplate = req.body.html;

			console.log(JSON.parse(req.body.data));

			JSON.parse(req.body.data).forEach((item) => {

				let file = function(){return fileTemplate }();
				let body = function(){return htmlTemplate }();

				for (let key in item) {
					file = keyReplace(key, item[key], file);
					body = keyReplace(key, item[key], body);
				}

				fs.writeFileSync(__dirname + '/files/' + file, body);

			});

			shell.exec('zip -r files.zip files', function(code, stdout, stderr) {
				res.redirect('/zip');
			});
			
		});

		function keyReplace(key, value, template){
			key = '{{' + key + '}}';
			return template.split(key).join(value);	
		}

	} catch(e){
		console.log('error');
		res.sendFile(__dirname + '/app.html');
	}

});

app.listen(process.env.PORT || 8085, () => console.log('Example app listening on port 8085!'))