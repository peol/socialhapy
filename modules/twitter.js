var functions = require('../functions'),
    urlShortener = require('./bitly'),
    Twitter = require('ntwitter'),
    hollabacks,
    stream,
    twitter;

hollabacks = {
    tweet: function(m) {
        var target = m.match_data[ m.match_data.length - 1 ],
            method = +target ? 'getStatus' : 'getLatestTweet';

        twitter[ method ](target, function(err, data) {
            if ( err || !data ) {
                if ( err.statusCode === 401 ) {
                    // 401's are protected tweets 99/100 times
                    m.say( functions.format(true, '\002{0}\002 has protected tweets', target) );
                }
                else if ( err.statusCode === 404 ) {
                    // 404's are twitter status errors (protected or non-existing)
                    m.say( functions.format(true, "Could not find the tweet with id \002{0}\002", target) );
                }
                else if ( !data ) {
                    // User was not found
                    m.say( functions.format(true, "Twitter user was not found, or no public tweets available") );
                }
                else {
                    console.log('Twitter error:', err.stack);
                    m.say( functions.format(true, 'Unknown twitter error encountered. The error has been logged.') );
                }

                return;
            }

            twitter.createTweet(true, data.user.screen_name, data.text, data.id_str, function(msg) {
                m.say( msg );
            });
        });
    }
};

stream = {
    _stream: null,

    start: function() {
        if ( this._stream ) {
            this._stream.destroy();
        }

        this.getIds(twitter.config.users, this._bind);
    },

    _bind: function(userIds) {
        twitter._twitter.stream('statuses/filter', { follow: userIds.join(',') }, function(strm) {
            console.log('Twitter stream started, following: ' + userIds);
            stream._stream = strm;

            strm.on('data', stream.receive);

            strm.on('error', function(err) {
                console.log('Twitter stream error: ' + err);
            });

            strm.on('end', function() {
		console.log(strm);
                console.log('Twitter stream ended, trying to start it up again in 60 seconds...');
                setTimeout(stream.start.bind( stream ), 60000);
            });
        });
    },

    receive: function(data) {
        if ( data.friends ) {
            // Ignore initial call
            return;
        }

        var user = data.user.screen_name,
            o,       
            channels = twitter.config.streamChannels,
            chan;

        if (/^RT/i.test( data.text ) || data.in_reply_to_user_id_str) {
            // Ignore RT's (very spammy)
            return;
        }

        twitter.createTweet(true, user, data.text, data.id_str, function(msg) {
            for (o in channels) {
                chan = channels[ o ];
                if ( !chan.length || chan.indexOf( user.toLowerCase() ) !== -1 ) {
                    twitter._sh.jerk.say(o, msg);
                }
            }
        });
    },

    getIds: function(names, hollaback) {
        twitter._twitter.get('/users/lookup.json', { screen_name: names.join(',') }, function(err, data) {
            var ids = [],
                i = 0,
                l = data && data.length || 0;

            for (; i < l; i += 1) {
                ids.push( data[ i ].id_str );
            }

            hollaback( ids );
        });
    }
};

twitter = module.exports = {
    register: function(socialhapy) {
        var config = socialhapy.config.modules.twitter;

        functions.extend(this, {
            _isloaded: true,
            _sh: socialhapy,
            config: config,
            _twitter: new Twitter( config )
        });

        stream.start();

        functions.extend(socialhapy.watchers, this.watchers); 
    },

    createTweet: function(includeURL, screenName, message, id, hollaback) {
        var tmpl = functions.format(true, 'Tweet from \002{0}\002: {1}', screenName, message);

        if ( includeURL ) {
            urlShortener.createLink(functions.format('https://twitter.com/{0}/status/{1}', screenName, id), function(url) {
                tmpl += ' ' + twitter._sh.config.prefix + url;
                hollaback( tmpl );
            });
        }
        else {
            hollaback( tmpl );
        }
    },

    getLatestTweet: function(user, hollaback) {
        this._twitter.get('/statuses/user_timeline.json', { count: 1, screen_name: user, include_entities: true }, function(err, data) {
            hollaback(err, data && data[ 0 ]);
        });
    },

    getStatus: function(id, hollaback) {
        this._twitter.get(functions.format('/statuses/show/{0}.json', id), { include_entities: true }, hollaback);
    },

   watchers: {
        //.tweet <user/status id>
        tweet: {
            pattern: /^\.tweet (.+?)$/i,
            hollaback: hollabacks.tweet
        },

        // Matches twitter.com normal links
        tweetLinkWithStatus: {
            pattern: /twitter\.com\/(?:#!\/)?(.+?)\/status(?:es)?\/(\d+)/i,
            hollaback: hollabacks.tweet
        },

        tweetLinkWithUser: {
            pattern: /twitter\.com\/(?:#!\/)?(\w+)\/?(?=\s|$)/i,
            hollaback: hollabacks.tweet
        }
    }
};
