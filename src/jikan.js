const jikan = new (require('jikan-node'))();
const Promise = require('bluebird');
const delay = 5000;
const URL = require('url').URL;

module.exports = function (data, res, cache) {
    const url = new URL('https://api.jikan.moe/v3');

    switch(data.type) {
        case 'cachebust':
            console.log("Delete: ", data.key);
            cache.del(data.key);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end();
            break;
        case 'anime':
            findAnime([data.id, data.request, data.page])
                .catch(e => {
                    console.log('Error: ', url.href);
                    
                    return { error: e };
                })
                .then(then);
            break;
        case 'user':
            findUser([data.username, data.request, data.data], data.params)
                .catch(e => {
                    console.log('Error: ', url.href);
                    
                    return { error: e };
                })
                .then(then);
            break;
        case 'club':
            findClub([data.id, data.request])
                .catch(e => {
                    console.log('Error: ', url.href);
                    
                    return { error: e };
                })
                .then(then);
            break;
        case 'producer':
            findProducer([data.id, data.page])
                .catch(e => {
                    console.log('Error: ', url.href);
                    
                    return { error: e };
                })
                .then(then);
            break;
        case 'person':
            findPerson([data.id, data.request])
                .catch(e => {
                    console.log('Error: ', url.href);
                    
                    return { error: e };
                })
                .then(then);
            break;
    }
    
    function then(ret) {
        cache.set(url.href, JSON.stringify(ret));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify(ret));
        res.end();
    }
    
    function findPerson(args) {
        url.pathname += '/person' + `/${args.filter(a => a).join("/")}`;
        
        console.log(url.href);
        
        if (cache.get(url.href)) {
            return Promise.delay(0)
                .then(() => {
                    return JSON.parse(cache.get(url.href));
                });
        } else {
            return Promise.delay(delay)
                .then(() => {
                    return jikan.findPerson(args[0], args[1]);
                });
        }
    }
    
    function findProducer(args) {
        url.pathname += '/producer' + `/${args.filter(a => a).join("/")}`;
        
        console.log(url.href);
        
        if (cache.get(url.href)) {
            return Promise.delay(0)
                .then(() => {
                    return JSON.parse(cache.get(url.href));
                });
        } else {
            return Promise.delay(delay)
                .then(() => {
                    return jikan.findProducer(args[0], args[1]);
                });
        }
    }
    
    function findClub(args) {
        url.pathname += '/club' + `/${args.filter(a => a).join("/")}`;
        
        console.log(url.href);
        
        if (cache.get(url.href)) {
            return Promise.delay(0)
                .then(() => {
                    return JSON.parse(cache.get(url.href));
                });
        } else {
            return Promise.delay(delay)
                .then(() => {
                    return jikan.findClub(args[0], args[1]);
                });
        }
    }
    
    function findAnime(args) {
        url.pathname += '/anime' + `/${args.filter(a => a).join("/")}`;
        
        console.log(url.href);
        
        if (cache.get(url.href)) {
            return Promise.delay(0)
                .then(() => {
                    return JSON.parse(cache.get(url.href));
                });
        } else {
            return Promise.delay(delay)
                .then(() => {
                    return jikan.findAnime(args[0], args[1], args[2]);
                });
        }
    }

    function findUser(args, param) {
        url.pathname += '/user' + `/${args.filter(a => a).join("/")}`;
        
        for (let p in param) {
            if (param[p]) {
                url.searchParams.set(p, param[p])
            }
        }
        
        console.log(url.href);
        
        if (cache.get(url.href)) {
            return Promise.delay(0)
                .then(() => {
                    return JSON.parse(cache.get(url.href));
                });
        } else {
            return Promise.delay(delay)
                .then(() => {
                    return jikan.findUser(args[0], args[1], args[2], param);
                });
        }
    }
}