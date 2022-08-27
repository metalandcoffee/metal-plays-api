import express from 'express';
import * as dotenv from 'dotenv';
import fetch from 'node-fetch';
import { Buffer } from 'buffer';
import * as fs from 'fs';
import { resolveSoa } from 'dns';

// Import environment variables.
dotenv.config();

// Express server instance.
const app = express();
const port = 8888;
let state = null;

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

/**
 * Get new access token from Spotify.
 * @param {object} res 
 * @param {string} params 
 * @returns {object}
 */
const getTokenFromSpotify = async (res, params) => {
	// Get access token from Spotify.
	const response = await fetch('https://accounts.spotify.com/api/token', {
		method: 'post',
		body: params,
		headers: {
			'Authorization': `Basic ${Buffer.from(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64')}`,
			'Content-Type': 'application/x-www-form-urlencoded'
		},
	});
	if (200 !== response.status) {
		console.log(`fail`, params);
		res.send(`Status: ${response.status}. ${response.statusText}. Try Again Later.`);
		throw `Status: ${response.status}. ${response.statusText}. Try Again Later.`;
	}

	const data = await response.json() as {
		access_token: string,
		token_type: string,
		refresh_token: string,
	};

	const { access_token, token_type, refresh_token } = data;

	return { access_token, token_type, refresh_token };
}

/**
 * 
 */
const getRecentlyPlayed = async (access_token, token_type) => {
	// Get information from Spotify using access token.
	const response = await fetch('https://api.spotify.com/v1/me/player/recently-played', {
		headers: { Authorization: `${token_type} ${access_token}` }
	});

	const data = await response.json() as {
		items: any[],
		error: {
			status: number,
			message: string
		}
	};

	return data;
}

// Index page route handler.
app.get('/', (req, res) => {
	res.send('Welcome to Metal Plays API!');
});

/**
 * Currently Playing Track route handler.
 */
app.get('/api/current', (req, res) => {
	res.send('Under construction...');
});

/**
 * Recently Played Tracks route handler.
 */
app.get('/api/played', async (req, res) => {

	// Grab access token from file.
	const data = fs.readFileSync('secrets_expired.json', 'utf8');
	const dataObj = JSON.parse(data) as { access_token: string, token_type: string };
	const { access_token, token_type } = dataObj;
	const spotifyData = await getRecentlyPlayed(access_token, token_type);
	console.log(spotifyData);
	//@todo 8/27/2022 You left off working through getting the new function getRecentlyPlayed set up and properly called throughout this endpoint.
	return;

	// If token is expired...
	/**
	if (spotifyJSON.error) {
		console.log(spotifyJSON);

		// call refresh_token route with refresh token URL param
		const params = new URLSearchParams(
			{
				grant_type: 'refresh_token',
				refresh_token: process.env.SPOTIFY_REFRESH_TOKEN,
			}).toString();
		try {
			const data = await getTokenFromSpotify(res, params) as {
				access_token: string,
				token_type: string,
				refresh_token: string,
			};
		} catch (e) {
			res.send(e);
		}

		console.log(`new access token acquired`);
		// Save access token to database.
		// Query for recently played tracks again with new access token
		return; //tmp

	}

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

	const formattedJSON = tracks.map(track => {
		return {
			artists: track.track.album.artists.map(artist => artist.name),
			trackName: track.track.name,
			playtime: track.played_at,
			songPreviewURL: track.track.preview_url,
			spotifyURL: track.context.external_urls.spotify,
		};
	});
	res.send(formattedJSON);*/
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

	const data = await getTokenFromSpotify(res, params) as {
		access_token: string,
		token_type: string,
		refresh_token: string,
	};

	const { access_token, token_type, refresh_token } = data;

	// @todo: Temp dev code. Remove for production.
	const content = JSON.stringify({
		access_token,
		token_type,
		refresh_token
	});
	fs.writeFile('secrets.json', content, err => {
		if (err) {
			console.error(err);
		}
	});
	res.send('Stuff happened.');
});

// Tell Express to listen for a connection on the specified port.
app.listen(port, () => {
	console.log(`Express app listening at http://localhost:${port}`);
});