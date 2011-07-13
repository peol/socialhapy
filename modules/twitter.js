!function() {
    // You will only need the twitter credentials if you plan
    // to use the streaming functionality, it can still respond
    // to tweets
    // If you have problems with bit.ly links not being added to tweets,
    // make sure your credentials are OK in socialhapy.js 
    
	// Add paths for the node-twitter-required modules
	require.paths.unshift(
		// cookie-node
		__dirname + "/../vendor/",
		
		// node-oauth
		__dirname + "/../vendor/node-oauth/lib/"
	);

	var Twitter = require('./../vendor/node-twitter/lib/twitter'),
		util = require('util'),
		poll = require('./twitter-poll.js').poll,
		_twitter,
		// You need to fill these in, dig around dev.twitter.com
		options = {
			consumer_key: "",
			consumer_secret: "",
			access_token_key: "",
			access_token_secret: "",
			follow: []
		};

	// Prints a tweet, requires a modified `jerk` object with the `.say` method
	function printTweet(api, tweet, channels) {
		var i,
			msg = "##url## @##user##: ##text##"
				.replace("##user##", tweet.user.screen_name)
				.replace("##text##", tweet.text)
				.replace(/&lt;/g, "<")
				.replace(/&gt;/g, ">")
				.replace(/"\r\n|\n"/g, "");

		channels = channels || api.channelFilters.twitter;

		api.bitly.shorten("http://twitter.com/" + tweet.user.screen_name + "/status/" + tweet.id_str, function (result) {
			msg = msg.replace("##url##", result.data.url || '');

			for (i = 0; i < channels.length; i++) {
				api.jerk.say( channels[ i ], msg );
			}
		});
	}

	// Grab a specific tweet by ID
	function getTweet(api, target, tweetId) {
		_twitter.showStatus(tweetId, function(tweet) {

			if ( validateTweet(tweet, api.jerk, target) ) {
				printTweet( api, tweet, target );
			}
		});
	}

	// Grab a specific tweet by screen name
	function getLatestTweet(api, target, twitterName) {
		console.log('Latest tweet:', util.inspect( arguments ) );
		_twitter.getUserTimeline({ screen_name: twitterName, count: 1 }, function(tweets) {

			if ( validateTweet(tweets, api.jerk, target) ) {
				printTweet( api, tweets[ 0 ], target );
			}			
		});
	}

	// Validates a tweet, or an array of tweets (actually just check if there's any tweets
	// in it). Returns true/false whether the validation succeeded or not
	function validateTweet(tweet, jerk, target) {
		var passed = true;

		if ( tweet.statusCode ) {
			jerk.say( target, "I couldn't grab that users tweets, is it protected?" );
			console.log('Protected tweet?', util.inspect( tweet ) );
			passed = false;
		}
		else if ( typeof tweet.length !== "undefined" && !tweet.length ) {
			jerk.say( target, "Twitter says there's no such user. Don't blame me. :|" );
			console.log('User non-existant?', util.inspect( tweet ) );
			passed = false;
		}
		else if ( tweet.user && !tweet.text ) {
			jerk.say( target, "Odd, there doesn't seem to be any text in that tweet..." );
			console.log('No text in tweet?', util.inspect( tweet ) );
			passed = false;
		}

		return passed;
	}
	
	// Starts a twitter stream, used on start and whenever we need to restart it (like when
	// the twitter follower list is updated, or triggered)
	function startTweetStream(api, updateCallback) {

		// Invoke the poll method, grabbing the people-to-follow from the interwebs
		poll(function(follow) {
			options.follow = follow;
			
			if ( updateCallback ) {
				updateCallback();
			}

            if ( !options.follow.length ) {
                return;
            }

			// After receiving the list with twitter screen names, we need to get the user ids
			// instead because the 'real' stream lookup requires id's
			_twitter.get('/users/lookup.json', { screen_name: options.follow.join(',') }, function(data) {

				// `data` contains the latest tweets from all users we sent in, map that and grab the
				// user id's instead
				var concatFollow = { follow: data.map(function(o) { return o.id_str; }).join(',') };
				
				// Start a new stream
				_twitter.stream('statuses/filter', concatFollow, function(stream) {
					stream.on('data', function(tweet) {

						console.log('Tweet from stream:', util.inspect( tweet ) );

						// It's not really a tweet, it's a `delete` event
						if ( tweet.delete ) {
							console.log("Not a valid tweet, delete event...");
							return;
						}

						// If the tweet is a RT, or some data wasn't well-formatted, don't output it to
						// the usual channels (only print to the debug channel)
						if ( !tweet.text || tweet.in_reply_to_screen_name || tweet.retweeted_status || tweet.text.match( /RT (\@\w+)/i ) ) {
							printTweet( api, tweet, [api.debugChannel] );
						}
						else {
							printTweet( api, tweet );
						}
					});
				});
			});
		});
	}

	// The main function, this is where everything is bound to the IRC messages and so forth
	function invoke(api) {
		_twitter = new Twitter( options );

		// Match twitter user profiles, and output their latest tweet 
		api.jerk.watch_for(/twitter\.com\/(?:#!\/)?(\w+)\/?(?=\s|$)/i, function(message) {
			getLatestTweet( api, [ message.source ], message.match_data[ 1 ] );
		});

		// Grab the latest tweet from a user
		api.jerk.watch_for(/^\.tweet (.+?)$/i, function(message) {
		    var target = message.match_data[ 1 ],
		        fn = target.match(/^\d+$/) ? getTweet : getLatestTweet;

			fn( api, [ message.source ], message.match_data[ 1 ] );
		});

		// Capture specific tweet links, and output them
		api.jerk.watch_for(/twitter\.com\/(?:#!\/)?(.+?)\/status(?:es)?\/(\d+)/i, function(message) {
			getTweet( api, [ message.source ], message.match_data[ 2 ] );
		});
		
		// Update from the remote twitter following list
		api.jerk.watch_for(/^\.update$/i, function(message) {
			startTweetStream(api, function() {
				api.jerk.say( message.source, "Follower-list updated, currently following " + options.follow.length + " people." );
			});
		});
		
		// Hook for showing the current following list
		api.jerk.watch_for(/^\.following$/i, function(message) {
			api.jerk.say( message.source, options.follow.length + " in total: " + options.follow.join(", ") + "." );
		});

		// Subscribe to twitter streams right away
		startTweetStream( api );
	};
	
	exports.invoke = invoke;
}();
