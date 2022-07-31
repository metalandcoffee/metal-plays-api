"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dotenv = __importStar(require("dotenv"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const buffer_1 = require("buffer");
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
const app = (0, express_1.express)();
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
    const params = new URLSearchParams({
        client_id: process.env.SPOTIFY_CLIENT_ID,
        response_type: 'code',
        redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
        scope,
        state
    }).toString();
    res.redirect(`https://accounts.spotify.com/authorize?${params}`);
});
// Spotify Callback route handler.
app.get('/callback', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Extract URL Params.
    const { code, state } = req.query;
    // @todo verify state parameter matches
    // Create fetch requests parameters.
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', process.env.SPOTIFY_REDIRECT_URI);
    // Get access token from Spotify.
    const response = yield (0, node_fetch_1.default)('https://accounts.spotify.com/api/token', {
        method: 'post',
        body: params,
        headers: {
            'Authorization': `Basic ${buffer_1.Buffer.from(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64')}`,
        },
    });
    if (200 !== response.status) {
        res.send(`Status: ${response.status}. Try Again Later.`);
        //return;
    }
    const data = yield response.json();
    const { access_token, token_type } = data;
    // Get information from Spotify using access token!
    const genreResponse = yield (0, node_fetch_1.default)('https://api.spotify.com/v1/me/player/recently-played', {
        headers: { Authorization: `${token_type} ${access_token}` }
    });
    const genreJson = yield genreResponse.json();
    res.send(genreJson);
}));
// Spotify refresh token route handler.
app.get('/refresh_token', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // @todo verify request is coming from front-end app
    // Extract URL Params.
    const { refresh_token } = req.query;
    // Create fetch requests parameters.
    const params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('refresh_token', refresh_token);
    params.append('redirect_uri', process.env.SPOTIFY_REDIRECT_URI);
    // Get access token from Spotify.
    const response = yield (0, node_fetch_1.default)('https://accounts.spotify.com/api/token', {
        method: 'post',
        body: params,
        headers: {
            'Authorization': `Basic ${buffer_1.Buffer.from(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64')}`,
        },
    });
    console.log(response.status);
    if (200 !== response.status) {
        res.send(`Status: ${response.status}. Try Again Later.`);
        return;
    }
    const data = yield response.json();
    const { access_token, token_type } = data;
    // Get information from Spotify using access token!
    const genreResponse = yield (0, node_fetch_1.default)('https://api.spotify.com/v1/recommendations/available-genre-seeds', {
        headers: { Authorization: `${token_type} ${access_token}` }
    });
    const genreJson = yield genreResponse.json();
    res.send(genreJson);
}));
// Tell Express to listen for a connection on the specified port.
app.listen(port, () => {
    console.log(`Express app listening at http://localhost:${port}`);
});
//# sourceMappingURL=index.js.map