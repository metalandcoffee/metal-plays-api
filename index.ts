import express from 'express';
import * as dotenv from 'dotenv';
import fetch from 'node-fetch';
import { Buffer } from 'buffer';
import * as fs from 'fs';
import { Current, Artist } from './spotify.current.models';

// Import environment variables.
dotenv.config();

// Express server instance.
const app = express();
const port = process.env.PORT;
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
		expires_in: number,
	};

	const { access_token, token_type, refresh_token, expires_in } = data;

	return { access_token, token_type, refresh_token, expires_in };
}

/**
 * Get recently played tracks from Spotify user account.
 * 
 * @param {string} access_token Token to access data.
 * @param {string} token_type   How the Access Token may be used: always “Bearer”.
 * 
 * @return {object} Recently played songs.
 */
const getRecentlyPlayed = async (access_token, token_type) => {
	// Get information from Spotify using access token.
	const response = await fetch('https://api.spotify.com/v1/me/player/recently-played', {
		headers: { Authorization: `${token_type} ${access_token}` }
	});

	const tracksJsonObj = await response.json() as {
		items: Array<{
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
		}>,
		error: {
			status: number,
			message: string
		}
	};

	if (tracksJsonObj.error && 401 === tracksJsonObj.error.status) {
		return tracksJsonObj;
	}

	// Format the data to look pretty.
	const formattedJSON = tracksJsonObj.items.map(track => {
		return {
			artists: track.track.album.artists.map(artist => artist.name),
			trackName: track.track.name,
			playtime: track.played_at,
			songPreviewURL: track.track.preview_url,
		};
	});
	return formattedJSON;
}

/**
 * 
 * @param {string} access_token 
 * @param {string} token_type 
 * @returns 
 */
const getCurrentTrack = async (access_token, token_type) => {
	// Get information from Spotify using access token.
	const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
		headers: { Authorization: `${token_type} ${access_token}` }
	});

	const tracksJsonObj = await response.json() as Current;

	const tmp = [
		{ name: "Metal & Coffee" },
		{ name: "Metallica" },
		{ name: "Opeth" }
	];

	// Generate array of just artists' names.
	const allArtists = tracksJsonObj.item.artists.reduce((previous: string[], currentValue: Artist): string[] => {
		previous.push(currentValue.name);
		return previous;
	}, []);

	// Format the data to look pretty.
	return {
		artists: allArtists.join(','),
		trackName: tracksJsonObj.item.name,
		currentTimestamp: tracksJsonObj.progress_ms,
		songDuration: tracksJsonObj.item.duration_ms,
		songPreviewURL: tracksJsonObj.item.external_urls.spotify,
	};

}

// Index page route handler.
app.get('/', (req, res) => {
	res.send('Welcome to Metal Plays API!');
});

/**
 * Currently Playing Track route handler.
 */
app.get('/current', async (req, res) => {
	const params = new URLSearchParams(
		{
			grant_type: 'refresh_token',
			refresh_token: process.env.SPOTIFY_REFRESH_TOKEN,
		}).toString();
	try {
		const refreshAccessData = await getTokenFromSpotify(res, params) as {
			access_token: string,
			token_type: string,
			refresh_token: string,
			expires_in: number,
		};
		let { access_token, token_type } = refreshAccessData;
		const currentTrackData = await getCurrentTrack(access_token, token_type);
		res.send(currentTrackData);
	} catch (e) {
		res.send(e);
	}
});

/**
 * Recently Played Tracks route handler.
 */
app.get('/played', async (req, res) => {
	const params = new URLSearchParams(
		{
			grant_type: 'refresh_token',
			refresh_token: process.env.SPOTIFY_REFRESH_TOKEN,
		}).toString();
	try {
		const refreshAccessData = await getTokenFromSpotify(res, params) as {
			access_token: string,
			token_type: string,
			refresh_token: string,
			expires_in: number,
		};
		let { access_token, token_type } = refreshAccessData;
		const recentlyPlayedData = await getRecentlyPlayed(access_token, token_type);
		res.send(recentlyPlayedData);
	} catch (e) {
		res.send(e);
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