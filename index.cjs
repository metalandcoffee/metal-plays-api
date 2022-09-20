"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var express_1 = require("express");
var dotenv = require("dotenv");
var node_fetch_1 = require("node-fetch");
var buffer_1 = require("buffer");
var fs = require("fs");
// Import environment variables.
dotenv.config();
// Express server instance.
var app = (0, express_1["default"])();
var port = 8888;
var state = null;
/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function (length) {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (var i = 0; i < length; i++) {
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
var getTokenFromSpotify = function (res, params) { return __awaiter(void 0, void 0, void 0, function () {
    var response, data, access_token, token_type, refresh_token, expires_in;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, node_fetch_1["default"])('https://accounts.spotify.com/api/token', {
                    method: 'post',
                    body: params,
                    headers: {
                        'Authorization': "Basic ".concat(buffer_1.Buffer.from(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64')),
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                })];
            case 1:
                response = _a.sent();
                if (200 !== response.status) {
                    console.log("fail", params);
                    res.send("Status: ".concat(response.status, ". ").concat(response.statusText, ". Try Again Later."));
                    throw "Status: ".concat(response.status, ". ").concat(response.statusText, ". Try Again Later.");
                }
                return [4 /*yield*/, response.json()];
            case 2:
                data = _a.sent();
                access_token = data.access_token, token_type = data.token_type, refresh_token = data.refresh_token, expires_in = data.expires_in;
                return [2 /*return*/, { access_token: access_token, token_type: token_type, refresh_token: refresh_token, expires_in: expires_in }];
        }
    });
}); };
/**
 * Get recently played tracks from Spotify user account.
 *
 * @param {string} access_token Token to access data.
 * @param {string} token_type   How the Access Token may be used: always “Bearer”.
 *
 * @return {object} Recently played songs.
 */
var getRecentlyPlayed = function (access_token, token_type) { return __awaiter(void 0, void 0, void 0, function () {
    var response, tracksJsonObj, formattedJSON;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, node_fetch_1["default"])('https://api.spotify.com/v1/me/player/recently-played', {
                    headers: { Authorization: "".concat(token_type, " ").concat(access_token) }
                })];
            case 1:
                response = _a.sent();
                return [4 /*yield*/, response.json()];
            case 2:
                tracksJsonObj = _a.sent();
                if (tracksJsonObj.error && 401 === tracksJsonObj.error.status) {
                    return [2 /*return*/, tracksJsonObj];
                }
                formattedJSON = tracksJsonObj.items.map(function (track) {
                    return {
                        artists: track.track.album.artists.map(function (artist) { return artist.name; }),
                        trackName: track.track.name,
                        playtime: track.played_at,
                        songPreviewURL: track.track.preview_url
                    };
                });
                return [2 /*return*/, formattedJSON];
        }
    });
}); };
// Index page route handler.
app.get('/', function (req, res) {
    res.send('Welcome to Metal Plays API!');
});
/**
 * Currently Playing Track route handler.
 */
app.get('/current', function (req, res) {
    res.send('Under construction...');
});
/**
 * Recently Played Tracks route handler.
 */
app.get('/played', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var data, dataObj, access_token, token_type, recentlyPlayedData, params, refreshAccessData, access_token_1, token_type_1, e_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                data = fs.readFileSync('secrets_expired.json', 'utf8');
                dataObj = JSON.parse(data);
                access_token = dataObj.access_token, token_type = dataObj.token_type;
                return [4 /*yield*/, getRecentlyPlayed(access_token, token_type)];
            case 1:
                recentlyPlayedData = _a.sent();
                if (!('error' in recentlyPlayedData)) return [3 /*break*/, 6];
                params = new URLSearchParams({
                    grant_type: 'refresh_token',
                    refresh_token: process.env.SPOTIFY_REFRESH_TOKEN
                }).toString();
                _a.label = 2;
            case 2:
                _a.trys.push([2, 5, , 6]);
                return [4 /*yield*/, getTokenFromSpotify(res, params)];
            case 3:
                refreshAccessData = _a.sent();
                access_token_1 = refreshAccessData.access_token, token_type_1 = refreshAccessData.token_type;
                return [4 /*yield*/, getRecentlyPlayed(access_token_1, token_type_1)];
            case 4:
                recentlyPlayedData = _a.sent();
                res.send(recentlyPlayedData);
                return [3 /*break*/, 6];
            case 5:
                e_1 = _a.sent();
                res.send(e_1);
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); });
// Login page route handler.
app.get('/login', function (req, res) {
    //res.send('Login endpoint disabled');
    var scope = 'user-read-currently-playing user-read-recently-played';
    state = generateRandomString(16);
    var params = new URLSearchParams({
        client_id: process.env.SPOTIFY_CLIENT_ID,
        response_type: 'code',
        redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
        scope: scope,
        state: state,
        type: req.query.type
    }).toString();
    res.redirect("https://accounts.spotify.com/authorize?".concat(params));
});
// Spotify Callback route handler.
app.get('/callback', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, code, state, params, data, access_token, token_type, refresh_token, content;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = req.query, code = _a.code, state = _a.state;
                params = new URLSearchParams();
                params.append('grant_type', 'authorization_code');
                params.append('code', code);
                params.append('redirect_uri', process.env.SPOTIFY_REDIRECT_URI);
                return [4 /*yield*/, getTokenFromSpotify(res, params)];
            case 1:
                data = _b.sent();
                access_token = data.access_token, token_type = data.token_type, refresh_token = data.refresh_token;
                content = JSON.stringify({
                    access_token: access_token,
                    token_type: token_type,
                    refresh_token: refresh_token
                });
                fs.writeFile('secrets.json', content, function (err) {
                    if (err) {
                        console.error(err);
                    }
                });
                res.send('Stuff happened.');
                return [2 /*return*/];
        }
    });
}); });
// Tell Express to listen for a connection on the specified port.
app.listen(port, function () {
    console.log("Express app listening at http://localhost:".concat(port));
});
