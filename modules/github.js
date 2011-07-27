!function() {
	var Github = require("./../vendor/node-github/lib/github").GitHubApi,
	    util = require('util'),
	    _github = new Github(true),
	    // This module is modified for use in node.js!
        humaneDate = require("./../vendor/Humane-Dates/src/humane");

	// The main function, this is where everything is bound to the IRC messages and so forth
	function invoke(api) {

		// Outputs a specific commit by id, triggered by a github URL
		api.jerk.watch_for(/github\.com\/(.+?)\/(.+?)\/commit\/([a-z0-9]+)/i, function(message) {
		    var user = message.match_data[ 1 ],
		        project = message.match_data[ 2 ],
		        sha = message.match_data[ 3 ],
		        msg = '##bitly## ##committer## (##date##) on ##project##: ##commitmsg##',
        		// commits/show/:user_id/:repository/:sha
		        route = 'commits/show/' + user + '/' + project + '/' + sha;

//			api.jerk.say(api.debugChannel, "Parsed github link from " + message.source + " :: User: " + user + " Project: " + project + " Commit: " + commit);

            _github.get(route, null, null, function(err, commit) {
				console.log('Commit from github:', util.inspect( commit ) );

                if ( !err ) {
                    commit = commit.commit;

            		api.bitly.shorten('https://' + message.match_data[0], function (result) {
                        msg = msg
                            .replace('##bitly##', result.data.url || '')
                            .replace('##committer##', commit.author.login)
                            .replace('##sha##', sha)
                            .replace('##date##', humaneDate( new Date( commit.committed_date ) ).toLowerCase())
                            .replace('##project##', project)
                            .replace('##commitmsg##', commit.message)
                            .replace(/&lt;/g, "<")
            				.replace(/&gt;/g, ">")
            				.replace(/"\r\n|\n"/g, " ");

                        message.say( msg );
                    });
                }
                else {
                    
                }
            });
		});
	};
	
	exports.invoke = invoke;
}();
