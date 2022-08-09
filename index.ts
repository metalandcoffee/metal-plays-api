import express from 'express';
import * as dotenv from 'dotenv';
import fetch from 'node-fetch';
import { Buffer } from 'buffer';
import * as fs from 'fs';

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
const generateRandomString = (length) => {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < length; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
};

// Import environment variables.
dotenv.config();

// Express server instance.
const app = express();
const port = 8888;
let state = null;

// Index page route handler.
app.get('/', (req, res) => {
	res.send('Welcome to Metal Plays API!');
});

// Currently playing handler.
app.get('/api/current', (req, res) => {
	res.send('Welcome to Metal Plays API!');
});

// Recently played handler.
app.get('/api/played', async (req, res) => {
	try {
		// @todo read access from database versus file
		const data = fs.readFileSync('secrets.json', 'utf8');
		const dataObj = JSON.parse(data) as { access_token: string, token_type: string };
		const { access_token, token_type } = dataObj;

		// Get information from Spotify using access token!
		const response = await fetch('https://api.spotify.com/v1/me/player/recently-played', {
			headers: { Authorization: `${token_type} ${access_token}` }
		});
		const spotifyJSON = await response.json() as { items: any[] };

		// Format the data to look pretty.
		const tracks: Array<{
			track: {
				album: {
					artists: Array<{
						name: string,
					}>
				},
				name: string,
				preview_url: string,
			},
			name: string,
			played_at: string,
			context: {
				external_urls: { spotify: string }
			}
		}> = spotifyJSON.items;

		const formattedJSON = tracks.map( track => {
			return {
				artists: track.track.album.artists.map(artist => artist.name),
				trackName: track.track.name,
				playtime: track.played_at,
				songPreviewURL: track.track.preview_url,
				spotifyURL: track.context.external_urls.spotify,
			};
		});
		res.send(formattedJSON);
		
	} catch (err) {
		console.error(err);
	}

});

// Login page route handler.
app.get('/login', (req, res) => {
	//res.send('Login endpoint disabled');

	const scope = 'user-read-currently-playing user-read-recently-played';
	state = generateRandomString(16);
	const params = new URLSearchParams(
		{
			client_id: process.env.SPOTIFY_CLIENT_ID,
			response_type: 'code',
			redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
			scope,
			state,
			type: req.query.type
		}).toString();
	res.redirect(`https://accounts.spotify.com/authorize?${params}`);

});

// Spotify Callback route handler.
app.get('/callback', async (req, res) => {
	// Extract URL Params.
	const { code, state } = req.query;
	// @todo verify state parameter matches

	// Create fetch requests parameters.
	const params = new URLSearchParams();
	params.append('grant_type', 'authorization_code');
	params.append('code', code);
	params.append('redirect_uri', process.env.SPOTIFY_REDIRECT_URI);

	// Get access token from Spotify.
	const response = await fetch('https://accounts.spotify.com/api/token', {
		method: 'post',
		body: params,
		headers: {
			'Authorization': `Basic ${Buffer.from(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64')}`,
		},
	});
	if (200 !== response.status) {
		res.send(`Status: ${response.status}. Try Again Later.`);
		//return;
	}
	const data = await response.json() as { access_token: string, token_type: string };

	const { access_token, token_type } = data;

	// @todo: Temp dev code. Remove for production.
	const content = JSON.stringify({
		access_token,
		token_type
	});
	fs.writeFile('secrets.json', content, err => {
		if (err) {
			console.error(err);
		}
	});
	res.send('Stuff happened.');
});

// Spotify refresh token route handler.
app.get('/refresh_token', async (req, res) => {
	// @todo verify request is coming from front-end app
	// Extract URL Params.
	const { refresh_token } = req.query;

	// Create fetch requests parameters.
	const params = new URLSearchParams();
	params.append('grant_type', 'refresh_token');
	params.append('refresh_token', refresh_token);
	params.append('redirect_uri', process.env.SPOTIFY_REDIRECT_URI);

	// Get access token from Spotify.
	const response = await fetch('https://accounts.spotify.com/api/token', {
		method: 'post',
		body: params,
		headers: {
			'Authorization': `Basic ${Buffer.from(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64')}`,
		},
	});
	console.log(response.status);
	if (200 !== response.status) {
		res.send(`Status: ${response.status}. Try Again Later.`);
		return;
	}
	const data = await response.json() as { access_token: string, token_type: string };
	const { access_token, token_type } = data;
	// spotify_access_token = access_token;
	// spotify_token_type = token_type;
});

// Tell Express to listen for a connection on the specified port.
app.listen(port, () => {
	console.log(`Express app listening at http://localhost:${port}`);
});