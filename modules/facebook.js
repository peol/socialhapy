var functions = require('../functions'),
    https = require('https'),
    hollabacks;

hollabacks = {
    photo: function(m) {
        var id = m.match_data[ 1 ];

        if ( +id ) {
            https.get({ host: 'graph.facebook.com', path: '/' + id }, function(res) {
                var data = '';

                res.on('data', function(d) {
                    data += d;
                }).on('end', function() {
                    var json = JSON.parse( data );

                    if ( json ) {
                        m.say( functions.format(true, "Photo by/of \x02{0}\x02, {1}", json.name, json.link) );
                    }
                });
            });
        }
    }
};

fb = module.exports = {
    _isLoaded: false,
    _sh: null,

    register: function(socialhapy) {
        this._isLoaded = true;
        this._sh = socialhapy;

        functions.extend(socialhapy.watchers, this.watchers);
    },

    watchers: {
        // facebook photo url
        facebook: {
            pattern: /fbcdn[a-z-\.\/0-6]+\d+_\d+_(\d+).+?\.jpg/i,
            hollaback: hollabacks.photo
        }
    }
};
