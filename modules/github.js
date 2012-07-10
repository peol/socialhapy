var functions = require('../functions'),
    Github = require('github'),
    hollabacks,
    github;

hollabacks = {
    // https://github.com/scottgonzalez/jquery-ui/commit/menu-review
    commitLinkRef: function(m) {
        var matches = m.match_data,
            refName = matches[ 3 ];

        github.getCommitRef(matches[ 1 ], matches[ 2 ], refName, function(err, ref) {
            var targetCommit = ref && (ref.length ? ref[0] : ref) || null;

            if ( err || !targetCommit ) {
                github.handleError('no ref/branch found', m);
                return;
            }

            m.match_data[ 3 ] = targetCommit.object.sha;
            hollabacks.commitLink( m, refName );
        });
    },

    commitLink: function(m, ref) {
        var matches = m.match_data;

        if ( !/\b([a-f0-9]{40})\b/i.test( matches[ 3 ] ) ) {
            // didn't match sha1, try resolving through ref instead
            hollabacks.commitLinkRef( m );
            return;
        }

        github.getCommit(matches[ 1 ], matches[ 2 ], matches[ 3 ], function(err, commit) {
            if ( err ) {
                github.handleError('no commit found', m);
                return;
            }

            commit = commit.commit;

           var fStr = 'Commit on \x02{0}\x02 by {1} ({2}): {3}',
                duration = functions.duration(( +new Date() / 1000 ) - ( +new Date( commit.author.date ) / 1000 ), true, true),
                normalizedMessage = functions.normalize( commit.message );

                m.say( functions.format(true, fStr, matches[ 2 ] + (ref ? '/' + ref : ''), commit.committer.login || commit.committer.name, duration, normalizedMessage) );
        });
    },

    pullLink: function(m) {
        var matches = m.match_data;

        github.getPullRequest(matches[ 1 ], matches[ 2 ], matches[ 3 ], function(err, pullReq) {
            if ( err ) {
                github.handleError('no pull request found', m);
                return;
            }

            var fStr = 'Pull request on \x02{0}\x02 by {1} ({2}): {3}',
                duration = functions.duration((+new Date() - +new Date( pullReq.created_at)) / 1000, true, true);

            m.say( functions.format(true, fStr, matches[ 2 ], pullReq.user.login, duration, pullReq.title) );

// With #:
//            var fStr = 'Pull request #{0} on \x02{1}\x02 by {2}: {3}';
//            m.say( functions.format(true, fStr, pullReq.number, matches[ 2 ], pullReq.user.login, pullReq.title) );
        });
    },

    issueLink: function(m) {
        var matches = m.match_data;

        github.getIssue(matches[ 1 ], matches[ 2 ], matches[ 3 ], function(err, issue) {
            if ( err ) {
                github.handleError('no issue found', m);
                return;
            }

            var fStr = 'Issue #{0} on \x02{1}\x02 ({2}; {3}): {4}',
                duration = functions.duration((+new Date() - +new Date( issue.created_at)) / 1000, true, true);

            m.say( functions.format(true, fStr, issue.number, matches[ 2 ], issue.user.name || issue.user.login, duration, issue.title) );
        });
    }
};

github = module.exports = {
    register: function(socialhapy) {
        functions.extend(this, {
            _isloaded: true,
            _sh: socialhapy,
            _github: new Github({
                version: "3.0.0"
            })
        });

        functions.extend(socialhapy.watchers, this.watchers);
    },

    handleError: function(err, m) {
        var tmpl = '\x02Github API:\x02 {0}',
            errStr = 'internal error';

        if ( typeof err === 'string' ) {
            errStr = err;
        }
        else {
            console.log( err );
        }

        m.say( functions.format(true, tmpl, errStr) );
    },

    getCommitRef: function(user, project, ref, hollaback) {
        console.log('gitdata getref:', ref);
        this._github.gitdata.getReference({
            user: user,
            repo: project,
            ref: 'heads/' + ref
        }, hollaback);
    },

    getCommit: function(user, project, commit, hollaback) {
        this._github.repos.getCommit({
            user: user,
            repo: project,
            sha: commit
        }, hollaback);
   },

    getPullRequest: function(user, project, id, hollaback) {
        this._github.pullRequests.get({
            user: user,
            repo: project,
            number: id
        }, hollaback);
    },

    getIssue: function(user, project, issueNo, hollaback) {
        this._github.issues.getRepoIssue({
            user: user,
            repo: project,
            number: issueNo
        }, hollaback);
    },

    watchers: {
        // Commit links
        commitLink: {
            pattern: /github\.com\/(.+?)\/(.+?)\/commit\/(\S+)/i,
            hollaback: hollabacks.commitLink
        },

        // Pull request links
        pullLink: {
            pattern: /github\.com\/(.+?)\/(.+?)\/pull\/(\d+)/i,
            hollaback: hollabacks.pullLink

        },

        issueLink: {
            pattern: /github\.com\/(.+?)\/(.+?)\/issues\/(\d+)/i,
            hollaback: hollabacks.issueLink
        }
   }
};
