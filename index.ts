import express from 'express';
import * as dotenv from 'dotenv';
import fetch from 'node-fetch';
import { Buffer } from 'buffer';

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
const generateRandomString = ( length ) => {
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
	res.send('Hello World!');
});

// Login page route handler.
app.get('/login', (req, res) => {
	
	const scope = 'user-read-currently-playing user-read-recently-played';
	state = generateRandomString(16);
	const params = new URLSearchParams(
		{
			client_id: process.env.SPOTIFY_CLIENT_ID,
			response_type: 'code',
			redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
			scope,
			state
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
	if ( 200 !== response.status) {
		res.send(`Status: ${response.status}. Try Again Later.`);
		//return;
	}
	const data = await response.json() as { access_token: string, token_type: string };
	
	const { access_token, token_type } = data;

	// Get information from Spotify using access token!
	const genreResponse = await fetch('https://api.spotify.com/v1/me/player/recently-played', {
		headers: { Authorization: `${token_type} ${access_token}` }
	});
	const genreJson = await genreResponse.json();
	res.send(genreJson);
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
	if ( 200 !== response.status) {
		res.send(`Status: ${response.status}. Try Again Later.`);
		return;
	}
	const data = await response.json() as { access_token: string, token_type: string };
	const { access_token, token_type } = data;

	// Get information from Spotify using access token!
	const genreResponse = await fetch('https://api.spotify.com/v1/recommendations/available-genre-seeds', {
		headers: { Authorization: `${token_type} ${access_token}` }
	});
	const genreJson = await genreResponse.json();
	res.send(genreJson);
});

// Tell Express to listen for a connection on the specified port.
app.listen(port, () => {
	console.log(`Express app listening at http://localhost:${port}`);
});