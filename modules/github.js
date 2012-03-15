var functions = require('../functions'),
    Github = require('github').GitHubApi,
    hollabacks,
    github;

hollabacks = {
    commitLink: function(m) {
        var matches = m.match_data;

        github.getCommit(matches[ 1 ], matches[ 2 ], matches[ 3 ], function(commit) {
            if ( !commit ) {
                github.handleError('no commit found', m);
                return;
            }

            commit = commit.commit;

            var fStr = 'Commit on \002{0}\002 by {1} ({2}): {3}',
                duration = functions.duration(( +new Date() / 1000 ) - ( +new Date( commit.committed_date ) / 1000 ), true, true),
                normalizedMessage = functions.normalize( commit.message );

                m.say( functions.format(true, fStr, matches[ 2 ], commit.committer.login || commit.committer.name, duration, normalizedMessage) );
        });
    },

    pullLink: function(m) {
        var matches = m.match_data;

        github.getPullRequest(matches[ 1 ], matches[ 2 ], matches[ 3 ], function(pullReq) {
            if ( !pullReq ) {
                github.handleError('no pull request found', m);
                return;
            }

            pullReq = pullReq.pull;

            var fStr = 'Pull request on \002{0}\002 by {1} ({2}): {3}',
                duration = functions.duration((+new Date() - +new Date( pullReq.created_at)) / 1000, true, true);
            
            m.say( functions.format(true, fStr, matches[ 2 ], pullReq.user.login, duration, pullReq.title) );
     
// With #:
//            var fStr = 'Pull request #{0} on \002{1}\002 by {2}: {3}';
//            m.say( functions.format(true, fStr, pullReq.number, matches[ 2 ], pullReq.user.login, pullReq.title) );
        });
    },

    issueLink: function(m) {
        var matches = m.match_data;

        github.getIssue(matches[ 1 ], matches[ 2 ], matches[ 3 ], function(issue) {
            if ( !issue ) {
                github.handleError('no issue found', m);
                return;
            }

            issue = issue.issue;

            var fStr = 'Issue #{0} on \002{1}\002 ({2}; {3}): {4}',
                duration = functions.duration((+new Date() - +new Date( issue.created_at)) / 1000, true, true);

            m.say( functions.format(true, fStr, issue.number, matches[ 2 ], issue.user, duration, issue.title) );
        });
    }
};

github = module.exports = {
    register: function(socialhapy) {
        functions.extend(this, {
            _isloaded: true,
            _sh: socialhapy,
            _github: new Github( true )
        });

        functions.extend(socialhapy.watchers, this.watchers);
    },

    handleError: function(err, m) {
        var tmpl = '\002Github API:\002 {0}',
            errStr = 'internal error';

        if ( typeof err === 'string' ) {
            errStr = err;
        }
        else {
            console.log( err );
        }

        m.say( functions.format(true, tmpl, errStr) );
    },

    getCommit: function(user, project, commit, hollaback) {
        var route = functions.format('commits/show/{0}/{1}/{2}', user, project, commit);

        this.request(route, hollaback);
   },

    getPullRequest: function(user, project, id, hollaback) {
        var route = functions.format('pulls/{0}/{1}/{2}', user, project, id);

        this.request(route, hollaback);
    },

    getIssue: function(user, project, issueNo, hollaback) {
        var route = functions.format('issues/show/{0}/{1}/{2}', user, project, issueNo);

        this.request(route, hollaback);
    },

    request: function(route, hollaback) {
        this._github.get(route, null, null, function(err, data) {
            // TODO: Add error handling
            hollaback( data );
        });
    },

    watchers: {
        // Commit links
        commitLink: {
            pattern: /github\.com\/(.+?)\/(.+?)\/commit\/([a-z0-9]+)/i,
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
