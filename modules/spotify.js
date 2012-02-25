var functions = require('../functions'),
    urlShortener = require('./bitly'),
    spotifyAPI = require('node-spotify'),
    hollabacks,
    parsers,
    helpers,
    spotify;

hollabacks = {
    def: function(m) {
        var isSearch = m.match_data[ 0 ].indexOf('spotifind') >= 0,
            method = isSearch ? 'search' : 'lookup',
            type = m.match_data[ 1 ],
            str = m.match_data[ 2 ],
            apiOptions = { type: type, query: str, id: str };

        spotifyAPI[ method ](apiOptions, function(err, data) {
            var str = '';

            if ( err ) {
                console.log( err );
                str = 'An internal error while fetching Spotify data occurred';
            }
            else {
                data = parsers.data(type, data);

                if ( !data || !data[ 0 ] ) {
                    str = 'No matches in the Spotify library';
                }
            }

            if ( str ) {
                // Means that we either have an error on our hands, or
                // just no data
                m.say( functions.format(true, str) );
            }
            else {
                console.log(data);
                str = parsers[ type ].apply(parsers, data);

                if ( isSearch || m.match_data[ 0 ].indexOf('spotify:') !== -1 ) {
                    // Create link from Spotify href (spotify:type:id -> type/id)
                    urlShortener.createLink('http://open.spotify.com/' + data[ 0 ].href.split(':').slice(1).join('/'), function(url) {
                        m.say( functions.format(str + ' {0}{1}', spotify._sh.config.prefix, url) );
                    });
                }
                else {
                    m.say( str );
                }
            }

       });
    }
};

parsers = {
    track: function(track, notAvailableIn, skippedTracks) {
        var artists = track.artists.map(function(a) { return a.name; }).join(', '),
            popularity = helpers.generatePopularity( track.popularity ),
            tmpl = '\002{0} - {1}\002 (Popularity: {2}';

        if ( notAvailableIn.length ) {
            tmpl += functions.format(', N/A in \002{0}\002', notAvailableIn.join(', '));
        }

        if ( skippedTracks ) {
            tmpl += functions.format(', skipped {0} tracks', skippedTracks);
        }

        return functions.format(true, tmpl + ')', artists, track.name, popularity);
    },

    album: function(album, notAvailableIn, skippedAlbums) {
        var artists = album.artist || album.artists.map(function(a) { return a.name; }).join(', '),
            popularity = helpers.generatePopularity( album.popularity ),
            tmpl = '\002{0} - {1}\002 (Popularity: {2}';

	if ( album.released ) {
	    tmpl += functions.format(', released in {0}', album.released);
	}

        if ( notAvailableIn.length ) {
            tmpl += functions.format(', N/A in \002{0}\002', notAvailableIn.join(', '));
        }

        if ( skippedAlbums ) {
            tmpl += functions.format(', skipped {0} albums', skippedAlbums);
        }

       return functions.format(true, tmpl + ')', artists, album.name, popularity);
    },

    artist: function(artist) {
        var popularity = helpers.generatePopularity( artist.popularity ),
            tmplAlbums = functions.format(', has {1} album(s) available in the Spotify library', artist.albums),
            tmplPopularity = ' (Popularity: {2})',
            tmpl = '\002{0}\002';

        if ( artist.albums ) {
            tmpl += tmplAlbums;
        }

        if ( artist.popularity ) {
            tmpl += tmplPopularity;
        }

        return functions.format(true, tmpl, artist.name, artist.albums && artist.albums.length, popularity);
    },

    data: function(type, data) {
        var plural = type + 's',
            t = {};

        if ( !data[ plural ] ) {
            t[ plural ] = [ data[ type ] ];
            data = t;
        }

        data = helpers.findCompatible( data[ plural ] );

        return data;
    }
};

helpers = {
    findCompatible: function(data) {
        var i = 0,
            l = data.length,
            bestMatch = null,
            o,
            avail;

        for (; i < l; i += 1) {
            o = data[ i ];

            if ( !o ) {
                // No usuable data found
                continue;
            }

            avail = this.checkAvailability( o.availability || o.album && o.album.availability || { territories: '' } );

            if ( !bestMatch || bestMatch[ 0 ].length > avail.length ) {
                bestMatch = [o, avail, i];

                if ( !avail.length ) {
                    // We found a perfect match, no need to continue
                    break;
                }
            }
        }

        return bestMatch;
    },

    checkAvailability: function(terr) {
        terr = terr.territories.split(' ');

        var compat = spotify.config.compatible,
            i = 0,
            l = compat.length,
            absent = [];

        if ( terr[ 0 ] !== '' ) {
            // Only loop through if we actually have data,
            // or it'll return false-positives
            for (; i < l; i += 1) {
                if ( terr.indexOf( compat[ i ] ) === -1 ) {
                    absent.push( compat[ i ] );
                }
            }
        }

        return absent;
    },

    generatePopularity: function(index) {
        var str = '',
            i = 0,
            l = 10;

        index = Math.round( parseFloat( index ) * 10 );

        for (; i < l; i += 1) {
            str += i < index ? '▮' : '▯';
        }

        return str;
    }
};

spotify = module.exports = { 
    register: function(socialhapy) {
        functions.extend(this, {
            _isloaded: true,
            _sh: socialhapy,
            config: socialhapy.config.modules.spotify
        });

        functions.extend(socialhapy.watchers, this.watchers);
    },

    watchers: {
        // .spotifind <type>:<search string>
        spotifind: {
            pattern: /\.spotifind (track|album|artist):(.+?)$/i,
            hollaback: hollabacks.def
        },

        // URI links
        uri: {
            pattern: /spotify:(track|artist|album):([a-zA-Z0-9]+)/i,
            hollaback: hollabacks.def 
        },
 
        // URL links
        url: {
            pattern: /open\.spotify\.com\/(track|artist|album)\/([a-zA-Z0-9]+)/i,
            hollaback: hollabacks.def 
        }
    }
};
