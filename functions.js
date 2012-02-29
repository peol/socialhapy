var config = require('./config'),
    functions;

module.exports = functions = {
    // Simple string format tool, {0}, {1} etc.
    // From http://stackoverflow.com/questions/610406/javascript-equivalent-to-printf-string-format/4673436#4673436
    format: function() {
        var args = Array.prototype.slice.call( arguments ),
            str = args.shift(),
            usePrefix = str === true;

        if ( usePrefix ) {
            str = config.prefix + args.shift();
        }

        return str.replace(/{(\d+)}/g, function(match, number) { 
            return typeof args[ number ] != 'undefined' ?
                args[ number ] :
                '{' + number + '}';
            });
    },

    // Parse weeks, days, hours, minutes and seconds from seconds
    _duration: function(seconds, opts) {
        opts = opts || {
            asArray: false,
            filterValues: false,
            compress: false
        };

        function subtract(div) {
            var v = Math.floor( seconds / div );
            seconds %= div;
        
            return v;
        }

        var val = [
                [subtract( 31536000 ), ' year'],
                [subtract( 2628000 ), ' month'],
                [subtract( 604800 ), ' week'],
                [subtract( 86400 ), ' day'],
                [subtract( 3600 ), ' hour'],
                [subtract( 60 ), ' minute'],
                [seconds, ' second']
            ],
            i = 0,
            l = val.length,
            v;

        for (; i < l; i += 1) {        
            v = val [ i ];

            if ( opts.compress ) {
                // Take first char after space
                v[ 1 ] = v[ 1 ][ 1 ];
            }
            else {
                if ( val[ i ][ 0 ] !== 1 ) {
                    // Pluralize
                    val[ i ][ 1 ] += 's';
                }
            }
        }

        if ( opts.filterValues ) {
            val = val.filter(function(i) {
                return i[ 0 ] > 0;
            });
        }
        
        if ( !opts.asArray ) {
            val = val
                .map(function(i){return i.join('');})
                .join(', ');
        }
        
        return opts.compress && !opts.asArray ?
            val.replace(/,/g,''):
            val;
    },

    duration: function(secs, useSuffix, doCompress) {
        // Round the value if it's more than a minute, otherwise, round to three decimals
        secs = secs > 59 ? Math.round( secs ) : Math.round(secs * 1000) / 1000;

        var dur = this._duration(secs, { filterValues: true, compress: doCompress, asArray: true }),
            i = 0,
            // Adjust this, by default we just want 2, e.g. "2 years, 3 months"
            l = Math.min(dur.length, 2),
            arr = [],
            str = '';


        for (; i < l; i += 1) {
            arr.push( dur[ i ].join('') );
        }

        str = arr.join(', ');

        return useSuffix ? str + ' ago' : str;
    },

    // Extend an object with another object, just a shallow extend
    extend: function(extendee, extender) {
        var o;

        for (o in extender) {
            extendee[ o ] = extender [ o ];
        }
    },

    // Normalize a string for IRC output (remove unnecessary white space, new
    // lines etc.)
    normalize: function(str) {
        return str.replace(/\r\n|\n/g, ' ');
    },

    // Helper for checking if `v1` has a value, and if the value is identical
    // to `v2`, defaults to `true`
    isMatchOrEmpty: function(v1, v2) {
        return typeof v1 != 'undefined' ?
            v1 === v2:
            true;
    },

    // Checks whether a specific user is an admin or not
    isAdmin: function(user) {
        var adminUser = config.admins[ user.nick ],
            userMatch = adminUser && this.isMatchOrEmpty( adminUser.user, user.user ),
            hostMatch = adminUser && this.isMatchOrEmpty( adminUser.host, user.host );

        return userMatch && hostMatch; 
    },

    // Filters an array and returns a new array with unique values
    unique: function(arr) {
        var frequency = {},
            uniques = [];

        arr.forEach(function(v) { frequency[ v ] = 0; });

        uniques = arr.filter(function(val) {
            return ++frequency[ val ] == 1;
        });

        return uniques;
    },

    // Add a watcher to a specific jerk instance, it also checks if the watcher
    // is a admin-only command and validates the user
    addWatcher: function(jerk, w) {
        jerk.watch_for(w.pattern, function(m) {
            var that = this,
                isAdmin = functions.isAdmin( m.person );

            if ( w.adminOnly && !isAdmin ) {
                m.say(m.user + ': Sorry, admins only');
            }
            else {
                w.hollaback.call(that, m);
            }
        });
    }
};
