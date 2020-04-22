const jikan = new (require('jikan-node'))();
const Promise = require('bluebird');
const delay = 5000;
const URL = require('url').URL;

module.exports = function (data, res, cache) {
    const url = new URL('https://api.jikan.moe/v3');
    
    switch(data.type) {
        case 'user':
            findUser([data.username, data.request, data.data], data.params)
                .then(function (ret) {
                    cache.set(url.href, JSON.stringify(ret));
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.write(JSON.stringify(ret));
                    res.end();
                });
            break;
    }

    function findUser(args, param) {
        url.pathname += `/${args.filter(a => a).join("/")}`;
        
        for (let p in param) {
            if (param[p]) {
                url.searchParams.set(p, param[p])
            }
        }
        
        console.log(url.href);
        
        if (cache.get(url.href)) {
            return Promise.delay(0)
                .then(function () {
                    return JSON.parse(cache.get(url.href));
                });
        } else {
            return Promise.delay(delay)
                .then(function () {
                    return jikan.findUser(args[0], args[1], args[2], param);
                });
        }
    }
}
