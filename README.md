# static client side mbta rail tracker

This is an incredibly terrible client-side scraper of the MBTA v3 api:

https://api-v3.mbta.com/docs/swagger/index.html

It doesn't work super well because of some CORS nonsense that's preventing API
key usage, and I'm being extremely awful about issuing too many API requests
(without an API key you're limited to 10 / minute per IP address). So TODO:

- solve insane js CORS silliness so API key works
- reduce the API requests by instead parsing more JSON blobs after fetching
  instead of relying on API calls. can probably do ~ 2 total API requests to
  refresh the final "route + stop + direction" page: `/schedules` +
  `/predictions`. I think all the data is in there, so just filtering by route +
  direction should give enough JSON to populate each `stop`

I also don't have the "platform" stuff figured out :( TODO.
