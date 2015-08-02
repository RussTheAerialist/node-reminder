var gha = require('github'),
    twit = require('twitter'),
    fs = require('fs'),
    util = require('util'),
    expand = require('expand-home-dir'),
    request = require('request'),
    stats = require('text-statistics'),
    twitter_config_path = expand('~/.twitter.api.json'),
    no_post_message = '@RussellHay should be ashamed. He hasn\'t written in %d days. http://github.com/RussTheAerialist/writing',
    statistics_message = '@RussellHay wrote stuff today which has a reading grade level of %s (SMOG): %s',
    github_user = process.env.npm_package_config_github_user || 'RussTheAerialist',
    github_repo = process.env.npm_package_config_repo || 'writing'
    ;

var gh = new gha({
       version: '3.0.0'
    });

var now = new Date(process.argv[2] || undefined);


function post_twitter_message_real(message) {
    fs.readFile(twitter_config_path, function(err, data) {
        if (err) { throw err; }

        var client = new twit(JSON.parse(data));
        client.post('statuses/update', {
            status: message
        }, function(err, tweet, response) {
            if (err) { throw err; }
            console.log(tweet, response);
        });
    });
}

var post_twitter_message = post_twitter_message_real;
function post_twitter_message_debug(message) {
	console.log(message);
}

if (process.env.npm_package_config_debug === '1') {
	post_twitter_message = post_twitter_message_debug;
}

function get_last_commit_url(callback) {
	gh.repos.getCommits({
		user: github_user,
		repo: github_repo,
		page: 0,
		per_page: 1
	}, function (err, res) {
		if (err) {
			callback(err, res);
			return;
		}

		var commit = res[0],
		    sha = commit.sha,
		    html_url = commit.html_url;

		gh.repos.getCommit({
			user: github_user,
			repo: github_repo,
			sha: sha			
		}, function (err, res) {
			if (err) {
				callback(err, res);
				return;
			}

			var file_url = res.files[0].raw_url;
			callback(undefined, file_url, html_url);
		});
	});
}

function do_statistics_post() {
	get_last_commit_url(function (err, url, commit_url) {
		if (err) { throw err; }

		request(url, function (err, response, body) {
			if (err) { throw err; }
			if (response.statusCode != 200) {
				throw response;
			}

			var calc = new stats(body);
			var message = util.format(statistics_message, calc.smogIndex(), commit_url);
			post_twitter_message(message);
		});
	});
}

gh.repos.get({
    user: github_user,
    repo: github_repo
}, function(err, res) {
    var last_push = new Date(res.pushed_at);
    var days_since_last_push = Math.floor((now - last_push)/(86400000)); // (1000 * 3600 * 24)
    if (days_since_last_push > 1) {
        post_twitter_message(util.format(no_post_message, days_since_last_push));
    } else {
    	do_statistics_post();
    }
});
