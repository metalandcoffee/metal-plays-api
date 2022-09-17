# Metal Plays Proxy/BFF (Backend for Frontend)

The Metal Plays BFF layer serves as a dedicated and simplified access point for a Spotify user's currenty playing and recently played tracks.

This BFF uses the Spotify API and the Authorization Code workflow to prompt the user for authorization and access before making the `played` and `current` endpoint available.

### Scratch Notes

Possible solutions for needing to grab current access token (without re-requesting it from Spotify server when its not expired yet)
- Saving tokens to database
- Stateful server session

Possible places for hosting Node app
- Heroku
- Glitch
- Netlify
- Railway


Advice from scottprins_dev
"scottprins_dev: Yeah if you have a token that doesn’t need to be changed often, env variables are a good choice and just forego a login endpoint except to renew those tokens to re store them if they are compromised"
Advice from techgrrrl
"yeah for my personal implementation to get what's playing, i store the refresh token in an environment variable and then make a request to get the access token from the refresh token before making a request to the API."