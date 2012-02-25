var functions = require('../functions'),
    startDate = new Date(),
    watchers,
    core;

watchers = {
    // .restart
    restart: {
        adminOnly: true,
        pattern: /^\.restart$/i,
        hollaback: function(m) {
            m.say( functions.format(true, 'Restarting... I was up for {0}', functions.duration( ( +new Date() - startDate ) / 1000 ) ) );
            // Note: This requires node-forever (forever-node?) or some sort
            // of auto-startup script
            // TODO: Send disconnect to the IRC server somehow, we'd need the jerk instance
            //       for that...
            setTimeout(function() {
                core._sh.jerk.quit("I'm just restarting!");
            }, 50);

            setTimeout(function() {
                process.exit();
            }, 100);
        }
    },

    // Add an idle channel temporary (handy when you want it to idle in a new
    // channel, but don't want to restart the bot - YOU DO NEED TO ADD THAT CHANNEL
    // MANUALLY IN THE CONFIG)
    join: {
        adminOnly: true,
        pattern: /^\.join (\#*)?(.+)$/i,
        hollaback: function(m) {
            var channel = '#' + m.match_data[ 2 ];

            core._sh.jerk.join( channel );

            m.say( functions.format(true, 'I (temporarily) joined {0}', channel) );
        }
    },

    // Same as above, but leaves a channel
    part: {
        adminOnly: true,
        pattern: /^\.part (\#*)?(.+)$/i,
        hollaback: function(m) {
            var channel = '#' + m.match_data[ 2 ];

            core._sh.jerk.part( channel );

            m.say( functions.format(true, 'I (temporarily) left {0}', channel) );
        }
    },

    // .uptime
    uptime: {
        pattern: /^\.uptime$/i,
        hollaback: function(m) {
            m.say( functions.format(true, 'I have been up for {0}', functions.duration( ( +new Date() - startDate ) / 1000 ) ) );
        }
    },

    // .duration
    duration: {
        pattern: /^\.duration (\d+)$/i,
        hollaback: function(m) {
            m.say( functions.format(true, '{0}', functions.duration( parseFloat( m.match_data[ 1 ] ) )) );
        }
    }
};

core = module.exports = {
    register: function(socialhapy) {
        functions.extend(this, {
            _isloaded: true,
            _sh: socialhapy
        });

        functions.extend(socialhapy.watchers, this.watchers);
    },
    watchers: watchers
};
