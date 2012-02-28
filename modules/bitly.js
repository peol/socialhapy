var functions = require('../functions'),
    Bitly = require('bitly'),
    urlp = require('url'),
    hollabacks,
    bitly;

hollabacks = {
    bitly: function(m) {
        var url = m.match_data[ 1 ];

        // Add http:// if it's not there
        if ( !/^http?(s)?:\/\//.test( url ) ) {
            url = 'http://' + url;
        }

        bitly.createLink(url, function(bitlyURL) {
            if ( bitlyURL ) {
                m.say( functions.format(true, 'URL has been shortened: {0}', bitlyURL) );
            }
        });
    }
};

bitly = module.exports = {
    _isLoaded: false,
    _sh: null,
    _bitly: null,

    register: function(socialhapy) {
        this._isLoaded = true;
        this._sh = socialhapy;

        var credentials = socialhapy.config.modules.bitly;
        this._bitly = new Bitly(credentials.user, credentials.token);
        functions.extend(socialhapy.watchers, this.watchers);
    },

    createLink: function(url, hollaback) {
        this._bitly.shorten(url, function(err, result) {
            if ( err || !result.data.url ) {
                console.log('*** Warning: bit.ly module encountered an error while shortening a link: ' + result.status_txt);
            }

            hollaback( result.data.url || '' );
        });
    },

    watchers: {
        // .bitly <url>
        bitly: {
            pattern: /^\.bitly (.+?)$/i,
            hollaback: hollabacks.bitly
        }
    }
};
