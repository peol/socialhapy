!function() {
    var targetHost = "vimeo.com",
    http = require('http');

    function respond(api, message) {

        var videoId = message.match_data[0].split("/")[1];

        lookUp(videoId, function(data) {
            var details = data[0];

            if (details != undefined) {
                msg = "Vimeo: '" + details.title + "' | Views: " + details.stats_number_of_plays + " | Duration: " + details.duration + " seconds.";
            } else {
                msg = "Vimeo: No video found :(";
            }            
            api.jerk.say(message.source, msg);
        });
    };

    function lookUp(videoId, cb) {
        request(videoId, cb);
    }

    function request(videoId, cb) {
        var chunks = "",
            server = http.createClient(80, targetHost),
            path = "/api/v2/video/" + videoId + ".json",
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

    // The main function, this is where everything is bound to the IRC messages and so forth
    function invoke(api) {
        function wrap(message) {
            respond(api, message);
        }
       
        api.jerk.watch_for(/vimeo\.com\/([0-9]+)/i, wrap);
    };
    
    exports.invoke = invoke;

}();
