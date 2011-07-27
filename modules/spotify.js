var targetHost = "ws.spotify.com",
    targetLookupPath = "/lookup/1/.json?uri=spotify:",
    targetSearchPath = "/search/1/",
    availTargets = ['SE', 'US'/*, 'AUS', 'CA'*/],
    http = require('http');

// Object containing formatting methods for track, album and artist types
var formatting = {
    track: function(data) {
        var artist = data.track.artists.map(function(a) { return a.name; }).join(', '),
            song = data.track.name,
            suffix = data.track.album ?
                ' (' + data.track.album.released + ')' :
                '';

        suffix += checkAvailability( data.track.availability );

        return '[Track] ' + artist + ' - ' + song + suffix;
    },

    album: function(data) {
        var artist = data.album.artist,
            album = data.album.name,
            released = data.album.released,
            suffix = checkAvailability( data.album.availability );

        return '[Album] ' + artist + ' - ' + album + ' (' + released + ')' + suffix;
    },

    artist: function(data) {
        var artist = data.artist.name,
            noOfAlbums = data.artist.albums.length;

        return '[Artist] ' + artist + ', featured on ' + noOfAlbums + ' albums';
    }
};

// Compare the availability data with our local data and return
// a string that describes which countries that this track, artist,
// or album is unavailable in. If it's available in all, it'll return
// and empty string
function checkAvailability(availability) {
    var i, l = availTargets.length, a = [], ret = '';

    availability = availability.territories.split(' ');

    for (i = 0; i < l; i += 1) {
        if ( availability.indexOf( availTargets[ i ] ) === -1 ) {
            a.push( availTargets[ i ] );
        }
    }

    return a.length ?
        ' [N/A in ' + a.join(', ') + ']':
        '';
}

// Creates a ten-in-length string illustrating how popular this particular track
// is (currently, from what I can tell, it'll only work on tracks). The popularity
// stuff is a little fuzzy, we're not really sure what it means more than it is spanning
// between 0-1 :-)
function createPopularity(index) {
    var str = '',
        i = 0 ,
        l = 10;

    index = Math.round( parseFloat( index ) * 10 );

    for (; i < l; i += 1) {
        str += i < index ? '▮' : '▯';
    }

    return str;
};

// Creates a custom bit.ly URL by sending in the spotify type and the ID.
// Invokes the callback with the created URL (or empty string if it fails).
function createBitlyURL(api, type, id, cb) {
    var spotifyURL = 'http://open.spotify.com/' + type + '/' + id;

    api.bitly.shorten(spotifyURL, function (result) {
        cb( result.data.url || '' ); 
    });
}

// Search the spotify library
function search(type, str, cb) {
    var path = targetSearchPath + type + '.json?q=' + str;

    request(path, cb);
}

// Resolve the spotify type/ID and get the data
function lookUp(type, id, cb) {
    var path = targetLookupPath + type + ':' + id;

    if (type === 'artist') {
        path += '&extras=album';
    }

    request(path, cb);
}

// Does a request to the spotify web service API
function request(path, cb) {
    var chunks = "",
        server = http.createClient(80, targetHost),
        request = server.request('GET', path, { 'host': targetHost });

    request.end();

    request.on('response', function (response) {
        response.setEncoding('utf8');

        response.on('data', function (chunk) {
            chunks += chunk;
        });

        response.on('end', function() {
            cb( JSON.parse( chunks ) );
        });
    });
}

// Respond to spotify URL/URI links.
// This is also used indirectly by the .spotifind functionality,
// querying the spotify API again to get more data on the subject
function respond(api, message) {
    var type = message.match_data[ 1 ],
        id = message.match_data[ 2 ];

    lookUp(type, id, function(data) {
        var msg = '',
            popularity = '';
        
        if ( data.info ) {
            msg = ' ' + formatting[ data.info.type ]( data );
            popularity = data[ type ].popularity && ' Popularity: ' + createPopularity( data[ type ].popularity ) || '';
        }
        else {
            msg = 'Invalid Spotify URL (nothing found)';
            id = '';
        }

        createBitlyURL(api, type, id, function(bitlyURL) {
            api.jerk.say(message.source, bitlyURL + msg + popularity);
        });
    });
};

exports.invoke = function(api) {
    function wrap(message) {
        respond(api, message);
    }

    api.jerk.watch_for(/open\.spotify\.com\/(track|artist|album)\/([a-zA-Z0-9]+)/i, wrap);
    api.jerk.watch_for(/spotify:(track|artist|album):([a-zA-Z0-9]+)/i, wrap);
    api.jerk.watch_for(/^\.spotifind (track|artist|album):(.+)$/i, function(message) {
        var type = message.match_data[ 1 ],
            searchStr = encodeURI( message.match_data[ 2 ] );

        search(type, searchStr, function(data) {
            var d = data[ type + 's' ][ 0 ];

            if ( d ) {
                message.match_data[ 2 ] = d.href.split(':')[ 2 ];
                wrap( message );
            }
            else {
                api.jerk.say(message.source, 'Nothing matching that query found on Spotify :-(');
            }
        });
    });
}
