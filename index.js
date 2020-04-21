const express = require('express');
const bodyParser = require('body-parser');
const del = require('del');
const fs = require('fs');
const shell = require('shelljs');
const app = express();
const basicAuth = require('express-basic-auth');
var sass = require('node-sass');

const varianList = [
	{
		slug:'aktiv-grotesk', 
		name:'Aktive Grotesk',
		stats:`Variable: Yes <br /> Font Files: 1 <br /> Total Font Weight: 173kb`
	}, 
	{
		slug:'source-sans-pro', 
		name:'Source Sans Pro',
		stats:`Variable: No <br /> Font Files: 4 <br /> Total Font Weight: 54.5kb`
	},
	{
		slug:'proxima-nova',
		name:'Proxima Nova',
		stats:`Variable: No <br /> Font Files: 4 <br /> Total Font Weight: 222.9kb`
	},
	{
		slug:'manrope',
		name:'Manrope',
		stats:`Variable: Yes <br /> Font Files: 1 <br /> Total Font Weight: 23.1kb`
	}
];

app.use(express.static('font-test/public'));

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

	var dir = './tmp';

	if (!fs.existsSync(__dirname + '/files/')){
	    fs.mkdirSync(__dirname + '/files/');
	}

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

				console.log(__dirname + '/files/' + file);

				fs.writeFileSync(__dirname + '/files/' + file, body);

			});

			shell.exec('zip -r files.zip ' + __dirname + '/files', function(code, stdout, stderr) {
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

app.get('/font', (req, res) => {
	let html = '';

	varianList.forEach(item => {
		html += `<p><a href="/font/${item.slug}">${item.name}</a></p>`;
	})

	res.send(html);

});

app.get('/font/:fontface', (req, res) => {
	
	const fontMatch = varianList.filter(item => item.slug === req.params.fontface)

	if (!fontMatch.length) return res.send(':(');
	
	let html = fs.readFileSync('font-test/app.html', 'utf8');
	
	html = html.split('{{slug}}').join(fontMatch[0].slug);
	html = html.split('{{name}}').join(fontMatch[0].name);
	html = html.split('{{stats}}').join(fontMatch[0].stats);

	res.send(html);
});

app.listen(process.env.PORT || 8085, () => {
	console.log('Example app listening on port 8085!')
	console.log('Compiling SASS');

	varianList.forEach(item => {
		sass.render({
			file: `font-test/scss/${item.slug}.scss`
		}, function(err, result) { 
			if (err) return console.log(err);
			fs.writeFileSync(`font-test/public/css/${item.slug}.css`, result.css);
		});
	});

});