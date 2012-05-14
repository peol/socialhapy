module.exports = {
    // Currently, this flag only restricts which channels the
    // bot will join (e.g. `true` will ignore all entries but `debug`
    // in the below channel object)
    debugMode: false,

    channels: {
        idle: [
            '#list',
            '#of',
            '#channels',
            '#to',
            '#idle',
            '#in'
        ],
        debug: ['#socialhapy-dev']
    },

    irc: {
        server: 'chat.freenode.net',
        nick: 'socialhapy' + ~~(Math.random() * 1001),
        log: false,
        user: {
            username: 'socialhapy',
            realname: 'Social bot for developers'
        },

        // Automatically populated by combining all arrays in `channels`
        // WILL BE OVERWRITTEN
        channels: []
    },

    // The prefix used on ALL messages that goes through functions.format(true, '....')
    prefix: '★ ',

    modules: {
        core: {
            enabled: true
        },

        bitly: {
            enabled: false,
            user: 'my-bitly-user',
            token: 'my-bitly-token'
        },

        twitter: {
            enabled: false,
            // These are only needed for the stream functionality
            consumer_key: '',
            consumer_secret: '',
            access_token_key: '',
            access_token_secret: '',
            // Array of people you want to follow, this should contain ALL users
            // You can filter out specific users by channels below
            // Note: Lowercase on all usernames!
            users: [
                'peolanha'
            ],
            // Define stream output. THE CHANNELS NEEDS TO BE ADDED IN `channels` above
            // Syntax: "#channel": [] (will output everything) or ['twitterer1', 'twitterer2']
            // The bot will not output streaming tweets to the normal channel list, if you want
            // it to stream to your channel, you NEED to add it to this object 
            // TODO: Add these channels dynamically in `register` in `modules/twitter.js`
            streamChannels: {
            }
        },

        github: {
            enabled: true
        },

        spotify: {
            enabled: true,
            compatible: []
        },

        facebook: {
            enabled: true
        }
    },

    admins: {
        // nick (required)
        'my-nickname': {
            // ident (optional)
            user: '~ident',
            // host (optional)
            host: 'hostname.com'
        }
    }
};
