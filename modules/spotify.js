var targetHost = "ws.spotify.com",
    targetPath = "/lookup/1/.json?uri=spotify:",
    availTargets = ['SE', 'US'/*, 'AUS', 'CA'*/],
    http = require('http');

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

function createBitlyURL(api, type, id, cb) {
    var spotifyURL = 'http://open.spotify.com/' + type + '/' + id;

    api.bitly.shorten(spotifyURL, function (result) {
        cb( result.data.url || '' ); 
    });
}

function request(spotifyURI, cb) {
    var chunks = "",
        server = http.createClient(80, targetHost),
        request = server.request('GET', targetPath + spotifyURI, { 'host': targetHost });

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

function respond(api, message) {
    var type = message.match_data[1],
        id = message.match_data[2],
        uri = type + ':' + id;

    if (type === 'artist') {
        uri += '&extras=album';
    }

    request(uri, function(data) {
        var format = formatting[ data.info.type ]( data );

        createBitlyURL(api, type, id, function(bitlyURL) {
            api.jerk.say(message.source, bitlyURL + ' ' + format);
        });
    });
};

exports.invoke = function(api) {
    function wrap(message) {
        respond(api, message);
    }

    api.jerk.watch_for(/open\.spotify\.com\/(track|artist|album)\/([a-zA-Z0-9]+)/i, wrap);
    api.jerk.watch_for(/spotify:(track|artist|album):([a-zA-Z0-9]+)/i, wrap);
}
