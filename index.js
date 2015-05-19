var gha = require('github'),
    twit = require('twitter'),
    fs = require('fs'),
    util = require('util'),
    expand = require('expand-home-dir'),
    twitter_config_path = expand('~/.twitter.api.json'),
    twitter_message = '@RussellHay should be ashamed. He hasn\'t written in %d days. http://github.com/RussTheAerialist/writing'

var gh = new gha({
       version: '3.0.0'
    })

var now
if (process.argv[2]) {
    now = new Date(process.argv[2])
} else {
    now = new Date()
}

function post_twitter(days_since_last_push) {
    fs.readFile(twitter_config_path, function(err, data) {
        if (err) throw err

        var client = new twit(JSON.parse(data))
        client.post('statuses/update', {
            status: util.format(twitter_message, days_since_last_push)
        }, function(err, tweet, response) {
            if (err) throw err
            console.log(tweet, response)
        })
    })
}

gh.repos.get({
    user: 'RussTheAerialist',
    repo: 'writing'
}, function(err, res) {
    var last_push = new Date(res.pushed_at)
    var days_since_last_push = Math.floor((now - last_push)/(86400000)) // (1000 * 3600 * 24)
    if (days_since_last_push > 1) {
        post_twitter(days_since_last_push)
    }

})
