var functions = require('../functions'),
    jsp = require("uglify-js").parser,
    pro = require("uglify-js").uglify,
    watchers;

watchers = {
    // .uglify
    uglify: {
        pattern: /^\.uglify (.+)$/i,
        hollaback: function(m) {
            var ast, output;
            try {
                var ast = jsp.parse( m.match_data[1] ); // parse code and get the initial AST
                ast = pro.ast_mangle( ast ); // get a new AST with mangled names
                ast = pro.ast_squeeze( ast ); // get an AST with compression optimizations
                output = pro.gen_code( ast ); // compressed code here
            }
            catch(e) {
                output = "Parse error...";
            }

            m.say( functions.format(true, '{0}', output) );
        }
    }
};

module.exports = {
    register: function(socialhapy) {
        functions.extend(this, {
            _isloaded: true,
            _sh: socialhapy
        });

        functions.extend(socialhapy.watchers, this.watchers);
    },
    watchers: watchers
};
