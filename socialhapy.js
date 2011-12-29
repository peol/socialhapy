var m,
    // Modules
    Jerk = require('./vendor/Jerk/lib/jerk'),
    Bitly = require('./vendor/node-bitly/lib/bitly/Bitly').Bitly,
    startTime = +new Date(),

    // Channel filters, add channels on a specific module to make it "active" in
    // that specific channel (e.g., twitter won't output the streamed tweets to
    // channels NOT in this array)
    channelFilters = {
        twitter: [""],
        github: [""]
    },

    jerkOptions = {
        server: "irc.freenode.net",
        nick: "socialhapy-bot",
        // Idle channels, where it'll respond to stuff like linked tweets and commands, but not output
        // any streamed content
        channels: ["#socialhapy-dev"].concat(
            channelFilters.twitter,
            channelFilters.github
        ),
        user: {
            username: "socialhapy-bot",
            hostname: "",
            servername: "",
            realname: "Social Dev. IRC Bot"
        }
    },

    // This channel needs to be in the jerkOptions `channels`
    debugChannel = '#socialhapy-dev',

    // API credentials for bit.ly
    bitlyOptions = {
        user: "",
        password: ""
    },

    // Used variables
    jerk, _jerk = Jerk(function (j) {
        jerk = j;

        // Output simple uptime data, 86400 = Seconds in a day
        j.watch_for(/^\.uptime$/i, function(message) {
            function suf(val) {
                return val !== 1 ? "s, " : ", ";
            }

            var duration = ( +new Date() - startTime ) / 1000,
                d = ~~ ( duration / 86400 ),
                h = ~~ ( duration % 86400 / 3600 ),
                m = ~~ ( duration % 86400 % 3600 / 60 ),
                s = ~~ ( duration % 86400 % 3600 % 60 ),
                dStr = " day" + suf( d ),
                hStr = " hour" + suf( h ),
                mStr = " minute" + suf( m ),
                sStr = " second" + suf( s );

            message.say( ( d + dStr + h + hStr + m + mStr + "and " + s + sStr ).slice(0, -2) );
        });
    }).connect( jerkOptions ),

    // This is the 'api' (in lack of other, better names), that is passed to
    // all socialhapy modules, no specific order is needed as long as all
    // requirements are in this list
    api = {
        jerk: jerk,
        bitly: new Bitly( bitlyOptions.user, bitlyOptions.password ),
        channelFilters: channelFilters,
        debugChannel: debugChannel,
        modules: {
            twitter: require('./modules/twitter'),
            github: require('./modules/github'),
            spotify: require('./modules/spotify'),
            vimeo: require('./modules/vimeo'),
            youtube: require('./modules/youtube')
        }
    };

// Add the global 'say' method to jerk, hacketi-hack
jerk.say = _jerk.say;

// Run the 'invoke' function on each socialhapy module
for (m in api.modules) {
    if ( api.modules.hasOwnProperty( m ) ) {
        api.modules[ m ].invoke( api );
    }
}
