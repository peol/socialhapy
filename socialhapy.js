var Jerk = require('jerk'),
    config = require('./config'),
    functions = require('./functions'),
    jerkInstance = null,
    socialhapy = {
        config: config,
        watchers: {},
        jerk: null
    },
    watchers = socialhapy.watchers;

function loadModules() {
    var modules = config.modules,
        o, m, module;

    function warn(name, str) {
        console.log( functions.format('*** Warning: The `{0}` module was not loaded, {1}', name, str) );
    }

    for (o in modules) {
        m = modules[ o ];

        if ( !m.enabled ) {
            continue;
        }

        try { module = require('./modules/' + o); }
        catch (e) {
            warn(o, 'error while pulling in the module: ' + e);
            continue;
        }

        if ( typeof module.register != 'undefined' ) {
            module.register( socialhapy );
        }
        else {
            warn(o, 'missing `invoke` function');
        }
    }
}

function initialize() {
    var chans = config.channels,
        ircChans = [],
        o;

    loadModules();

    if ( config.debugMode ) {
        // Skip all other channels
        chans = { debug: chans.debug };
    }

    // Prepare channel array
    for (o in chans) {
         ircChans = ircChans.concat( chans[ o ] );
    }

    config.irc.channels = functions.unique( ircChans );

    // Connect to IRC
    (function() {
        var staticJerk = Jerk(function(jerk) {
            socialhapy.jerk = jerkInstance = jerk;

            for (o in watchers) {
             	functions.addWatcher( jerkInstance, watchers[ o ] );
            }
        })
        .connect( config.irc );

        functions.extend(jerkInstance, staticJerk);
    })();
}

initialize();
