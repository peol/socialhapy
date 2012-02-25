!function() {
	var targetHost = "oksoclap.com",
	    targetPath = "",
		//targetPath = "/ep/pad/export/SOME-PAD-YOU-CREATED/latest?format=txt",
		http = require('http');

	function pollTwitterList(callback) {
	    if (targetPath === '') {
	        callback( [] );
	        return;
	    }
	    
		var chunks = "",
		    server = http.createClient(80, 'www.' + targetHost),
		    request = server.request('GET', targetPath, { 'host': targetHost });

		request.end();

		request.on('response', function (response) {
			response.setEncoding('utf8');

			response.on('data', function (chunk) {
				chunks += chunk;
			});

			response.on('end', function() {
				chunks = chunks
					// Add commas between each person to follow
					.replace(/\n+/g, ',')

					// Remove any whitespace
					.replace(/\s*/g, '')

					// Remove last comma
					.slice(0, -1);

					callback( chunks.split(',') );
			});
		});
	}

	exports.poll = pollTwitterList;
}();