const Twitter = require('twitter');

/**
 * Tweet Auto-Liker
 * @param {{consumerKey: string, consumerSecret: string, accessToken: string, accessTokenSecret: string}} credentials 
 * @param {boolean} useStream 
 * @param {string} feed 
 * @param {{count: number, since_id: number, include_entities: boolean, follow: string, track: string}} opts
 * Only the follow and track properties are needed for streams. They do not apply for non-streams. 
 */
module.exports = function (credentials, useStream, feed = 'statuses/home_timeline', opts) {
    const client = new Twitter({
      consumer_key: credentials.consumerKey,
      consumer_secret: credentials.consumerSecret,
      access_token_key: credentials.accessToken,
      access_token_secret: credentials.accessTokenSecret
    });
    let lastTweet;
    
    /** Check Twitter Timeline
     * @return {null} Doesn't return anything.
     */
    let checkFeed = () => {
      let screen_name = opts.screen_name;
      client.get(feed, ({
        screen_name, count: 20,
        include_rts: opts.include_rts,
        since_id: lastTweet, include_entities: false
      }), (error, tweets, response) => {
        if (!error) {
          tweets.forEach(function(tweet, index){
            lastTweet = tweet.id_str;
            if (tweet.favorited === false && tweet.user.screen_name !== screen_name) {
              client.post('favorites/create', {
                id: tweet.id_str, include_entities: false
              }, (error2, tweet2, response2) => {
                if (error2) console.error(error2);
                else console.log(`Liked ${tweet.id_str}`);
              });
            }
          });
        } else {
          console.log(error);
        }
      });
    };
    
    if (useStream === false) {
      const interval = setInterval(() => {
        checkFeed();
        console.log('Interval finished lap.')
      }, 180000); // every 3 minutes
      checkFeed();
    } else if (useStream === true) {
      client.stream('statuses/filter', {
        stall_warnings: true, follow: opts.follow, track: opts.track
      }, function (stream) {
        stream.on('data', function(data) {
          if (!data.friends && data.user && data.in_reply_to_screen_name === null && data && data.retweeted === false && data.user){
            console.log(data);
            client.post('favorites/create', {
              id: data.id_str
            }, (error, tweet, response) => {
              if (error) console.error(error);
              else console.log(`Liked ${data.id_str}`);
            });
          }
        });
       
        stream.on('error', function(error) {
          console.log(error);
        });
      });
    }
  };
