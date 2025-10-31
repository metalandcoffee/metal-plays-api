# Metal Plays API

A lightweight Backend for Frontend (BFF) service that provides simplified access to Spotify's currently playing and recently played tracks. Built with TypeScript and Express, this API acts as a proxy layer between the frontend applications and the Spotify Web API.

This endpoint is actively used in the `metalandcoffee` Twitchbot Node application.

## What It Does

Metal Plays API gives you two simple endpoints:

- **`/current`** - Returns what's currently playing on your Spotify account
- **`/played`** - Returns your recently played tracks

The API handles all the OAuth complexity and token management so you don't have to implement Spotify's authentication flow in your frontend.

## Tech Stack

- Node.js + TypeScript
- Express.js
- Spotify Web API

## API Endpoints

### `GET /current`

Returns the currently playing track.

**Response:**
```json
{
  "artists": "Metallica,James Hetfield",
  "trackName": "Master of Puppets",
  "currentTimestamp": 45000,
  "songDuration": 240000,
  "songPreviewURL": "https://open.spotify.com/track/..."
}
```

### `GET /played`

Returns recently played tracks.

**Response:**
```json
[
  {
    "artists": ["Opeth"],
    "trackName": "Blackwater Park",
    "playtime": "2024-01-15T10:30:00.000Z",
    "songPreviewURL": "https://p.scdn.co/mp3-preview/..."
  }
]
```

## License

ISC

---

Made with 🎸 and ☕ by [Metal & Coffee](https://github.com/metalandcoffee)