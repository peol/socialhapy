!function() {
    var targetHost = "gdata.youtube.com",
    http = require('http'),
    sys = require('sys');

    function respond(api, message) {
        var firstMatch = message.match_data[0],
        secMatch = message.match_data[1],
        videoId = "";
        if (firstMatch == "youtu.be") {
            videoId = (message.toString()).split("/")[1];
            sys.debug(videoId);
        } else {
            videoId = (message.toString()).split("v=")[1].split("&")[0];
        }

        lookUp(videoId, function(data) {
            if (data.data.items != undefined){

                var details = data.data.items[0];                   
                msg = "YouTube: '" + details.title + "' | Views: " + details.viewCount + " | Duration: " + details.duration + " seconds. ";
            } else {
                msg = "YouTube: No video found :(";
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
            path = "/feeds/api/videos?v=2&alt=jsonc&q=" + videoId,
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
       
        api.jerk.watch_for(/youtube\.com\/watch/i, wrap);
        api.jerk.watch_for(/youtu\.be/i, wrap);
        
    };
    
    exports.invoke = invoke;

}();
