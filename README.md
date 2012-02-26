socialhapy, the social developer irc bot
========================================
This IRC bot features a few useful modules and features that can help
developers in discussions, references etc. It'll pick up on URLs to
github commits, look up tweets and/or stream tweets to specific channels.
It also sports a spotify module that automatically picks up on spotify
URIs and lets everyone know what artist, track or album that was linked.

How to get started
------------------
This project expects version 0.6.0+ of node.js, but it'll probably
work with lower versions if you fix the `node_modules` reference.

1. Go into your Terminal application and do `git clone git@github.com:peol/socialhapy.git`
2. `cd socialhapy` and run `npm install` to pull in all dependencies
3. Edit the `config.example.js` file to your liking, and **save it as `config.js`**
4. Run socialhapy by either running it with `node socialhapy.js` or by
   the recommended way, with `forever`

Create your own socialhapy module
---------------------------------
socialhapy has its own module system that leverages the `require` system but
demands that an API is returned with at least a `register` method in it, it's
also required that you add the module in `config.js`, see other entries under
the `modules` object.

Roadmap
-------
There's not much but refactoring on the roadmap right now, but I'm happy to
merge in any optimizations/useful socialhapy modules that I see fit, just
send a pull request.
