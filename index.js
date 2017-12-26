const Twitter = require('twitter');

module.exports = function (credentials, useStream, feed = 'statuses/home_timeline', opts) {
    const client = new Twitter({
      consumer_key: process.env.TWITTER_CONSUMER_KEY,
      consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
      access_token_key: credentials.accessToken,
      access_token_secret: credentials.accessTokenSecret
    });
    let lastTweet;
    
    /** Check Twitter Timeline
     * @return {null} Doesn't return anything.
     */
    function checkFeed() {
      client.get(feed, (opts || {
        count: 15, since_id: lastTweet, include_entities: false
      }), (error, tweets, response) => {
        if (!error) {
          const tweet = tweets[0];
          lastTweet = tweet.id_str;
          if (tweet.user.id_str !== credentials.id) {
            client.post('favorites/create', {
              id: tweet.id_str, include_entities: false
            }, (error, tweet, response) => {
              if (error) console.error(error);
            });
          }
        } else {
          console.log(error);
        }
      });
    }

    if (useStream === false) {
      const interval = setInterval(() => { checkFeed(); }, 600000); // every 6 minutes
      checkFeed();
    } else if (useStream === true) {
      client.stream('statuses/filter', ({
        stall_warnings: true, follow: opts.follow, track: opts.track
      }, function (error, data) {
        console.log(data);
      });;
    }
  }
