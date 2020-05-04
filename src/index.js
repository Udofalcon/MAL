var anime = [];
var animeById = {}
var todo = [];
var done = [];
var active;
var requestCount = 0;
var requestTime = 0;
var challenges = {};
var allChallenges;
var clubs = {};
var producers = {};
var queryAll = true;
var user;
var criteria = {}
var people = {};

function init(username) {
    var username = document.getElementById('Username').value;
    
    next([0, 'getUserProfile', username]);
}

function next(arg) {
    if (arg) {
        pushTodo(arg);
    }
    
    if (active) {
        return console.log(':(');
    }
    
    var ol = document.getElementById('todo');
    
    while (ol.firstChild) {
        ol.removeChild(ol.firstChild);
    }
    
    var len = todo.length;
    
    todo.forEach(item => {
        var li = document.createElement('li');
        
        ol.appendChild(li);
        
        item.forEach(subItem => {
            var span = document.createElement('span');
            
            li.appendChild(span);
            span.innerText = subItem;
            span.style.paddingRight = '1em';
        });
    });
    
    active = todo.shift();
    
    if (active) {
        var rank = active.shift();
        var func = active.shift();
        var progress = document.getElementById('progress');
        
        allChallenges = rank !== 0;
    
        Object.keys(challenges).forEach(c => {
            allChallenges &= !!challenges[c].length;
        });
        
        if (allChallenges) {
            active = null;
            progress.removeChild(progress.firstChild);
            
            return next();
        }
        
        window[func](...active);
        done.push([rank, func, ...active]);
        progress.removeChild(progress.firstChild);
    } else {
        console.log(':)');
    }
}

function getPerson(id) {
    var xhr = new XMLHttpRequest();
    
    xhr.open('POST', '/jikan', true);
    xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
    xhr.addEventListener('load', () => {
        var data = JSON.parse(xhr.responseText);
        
        people[id] = data;
        updateData(anime);
    });
    xhr.send(JSON.stringify({
        type: 'person',
        id: id
    }));
}

function getProducer(id) {
    var xhr = new XMLHttpRequest();
    
    xhr.open('POST', '/jikan', true);
    xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
    xhr.addEventListener('load', () => {
        var data = JSON.parse(xhr.responseText);
        
        producers[id] = data;
        updateData(anime);
    });
    xhr.send(JSON.stringify({
        type: 'producer',
        id: id
    }));
}

function getClub(id) {
    var xhr = new XMLHttpRequest();
    
    xhr.open('POST', '/jikan', true);
    xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
    xhr.addEventListener('load', () => {
        var data = JSON.parse(xhr.responseText);
        
        clubs[id] = data;
        updateData(anime);
    });
    xhr.send(JSON.stringify({
        type: 'club',
        id: id
    }));
}

function getAnime(id) {
    var xhr = new XMLHttpRequest();
    
    xhr.open('POST', '/jikan', true);
    xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
    xhr.addEventListener('load', () => {
        var data = JSON.parse(xhr.responseText);
        var curr = animeById[data.mal_id];
        var index = curr && anime.indexOf(curr) || -1;
                
        if (index === -1) {
            anime.push(data);
        } else {
            anime[index] = { ...anime[index], ...data };
            animeById[data.mal_id] = anime[index];
        }
        
        updateData(anime);
    });
    xhr.send(JSON.stringify({
        type: 'anime',
        id: id
    }));
}

function getUserData(username, request, data, params) {
    var xhr = new XMLHttpRequest();
    
    xhr.open('POST', '/jikan', true);
    xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
    xhr.addEventListener('load', () => {
        var data = JSON.parse(xhr.responseText);
        
        data.anime.forEach(a => {
            anime.push(a);
            animeById[a.mal_id] = a;
            
            if (a.watching_status !== 2) {
                pushTodo([0, 'getAnime', a.mal_id]);
            }
        });
        
        updateData(anime);
    });
    xhr.send(JSON.stringify({
        type: 'user',
        username: username,
        request: request,
        data: data,
        params: params
    }));
}

function getUserProfile(username) {
    anime = [];
    
    var xhr = new XMLHttpRequest();
    
    xhr.open('POST', '/jikan', true);
    xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
    xhr.addEventListener('load', () => {
        user = JSON.parse(xhr.responseText);
        
        for (var page = 0; page * 300 < user.anime_stats.total_entries; page++) {
            pushTodo([0, 'getUserData', username, 'animelist', 'all', { page: page + 1 }]);
        }
        
        user.favorites.people.forEach(p => pushTodo([0, 'getPerson', p.mal_id]));
        
        updateData(anime);
    });
    xhr.send(JSON.stringify({
        type: 'user',
        username: username,
        request: 'profile'
    }));
}

function updateData(list) {
    challenges = {};
    
    list = list.filter(a => !a.error)
        .filter(a => a.watching_status !== 2)
        .filter(a => a.rank)
        .filter(a => !a.airing)
        .filter(a => a.episodes !== 'Unknown')
        .filter(a => a.aired)
        .filter(a => new Date(a.aired.from) < new Date(2020, 0, 1))
        .filter(a => !a.aired.to || new Date(a.aired.to) < new Date(2020, 0, 1));
    list.sort((a, b) => a.rank > b.rank);
    list.forEach(a => {
        var checking = a.prerequisites = false;
        
        Object.keys(a.related).forEach(b => {
            a.related[b].forEach(c => {
                if (!checking && !a.prerequisites && c.type === 'anime') {
                    if (animeById[c.mal_id] &&
                        animeById[c.mal_id].watching_status !== 2 &&
                        !animeById[c.mal_id].error &&
                        animeById[c.mal_id].aired &&
                        animeById[c.mal_id].aired.from &&
                        new Date(animeById[c.mal_id].aired.from) < new Date(a.aired.from)) {
                        a.prerequisites = true;
                    } else if (!animeById[c.mal_id] ||
                        animeById[c.mal_id] && 
                        animeById[c.mal_id].watching_status !== 2 &&
                        !animeById[c.mal_id].error &&
                        (!animeById[c.mal_id].aired ||
                        animeById[c.mal_id].aired.from)) {
                        pushTodo([a.rank, 'getAnime', c.mal_id]);
                        checking = true;
                    }
                }
            });
        });
        
        a.challenges = [];
        
        if (!a.prerequisites && !checking) {
            checkChallenges(a);
        }
    });
    list = list.filter(a => a.challenges.length);
    
    updateDisplay(list);
    
    todo.sort((a, b) => a[0] > b[0]);

    active = undefined;
    next();
}

function updateDisplay(list) {
    var table = document.getElementById('Anime');
    
    while (table.firstChild) {
        table.removeChild(table.firstChild);
    }
    
    table.style.border = '#EBEBEB 1px solid';
    table.style.borderCollapse = 'collapse';
    table.style.margin = '0 auto';
    table.style.width = '100%';
    
    var thead = document.createElement('thead');
    
    table.appendChild(thead);
    
    thead.style.backgroundColor = '#FCFCFC';
    
    var tr = document.createElement('tr');
    
    thead.appendChild(tr);
    
    var th1 = document.createElement('th');
    
    tr.appendChild(th1);
    th1.style.backgroundImage = 'none';
    th1.style.borderBottom = '#EBEBEB 1px solid';
    th1.style.display = 'table-cell';
    th1.style.height = '36px';
    th1.style.textAlign = 'center';
    th1.style.verticalAlign = 'middle';
    th1.style.width = '4px';
    
    var th2 = document.createElement('th');
    
    tr.appendChild(th2);
    th2.innerText = '#';
    th2.style.borderBottom = '#EBEBEB 1px solid';
    th2.style.display = 'table-cell';
    th2.style.height = '36px';
    th2.style.textAlign = 'center';
    th2.style.verticalAlign = 'middle';
    th2.style.width = '30px';
    
    var th3 = document.createElement('th');
    
    tr.appendChild(th3);
    th3.innerText = 'Image';
    th3.style.borderBottom = '#EBEBEB 1px solid';
    th3.style.display = 'table-cell';
    th3.style.height = '36px';
    th3.style.textAlign = 'center';
    th3.style.verticalAlign = 'middle';
    th3.style.width = '66px';
    
    var th4 = document.createElement('th');
    
    tr.appendChild(th4);
    th4.innerText = 'Title';
    th4.style.borderBottom = '#EBEBEB 1px solid';
    th4.style.display = 'table-cell';
    th4.style.height = '36px';
    th4.style.paddingLeft = '8px';
    th4.style.textAlign = 'left';
    th4.style.verticalAlign = 'middle';
    
    var th5 = document.createElement('th');
    
    tr.appendChild(th5);
    th5.innerText = 'Challenges';
    th5.style.borderBottom = '#EBEBEB 1px solid';
    th5.style.display = 'table-cell';
    th5.style.height = '36px';
    th5.style.paddingLeft = '8px';
    th5.style.textAlign = 'left';
    th5.style.verticalAlign = 'middle';
    
    var tbody = document.createElement('tbody');
    
    table.appendChild(tbody);
    
    list.forEach((item, index) => {
        var tr = document.createElement('tr');
        
        tbody.appendChild(tr);
        tr.style.backgroundColor = index % 2 ? '#fcfcfc' : '';
        
        var td1 = document.createElement('td');
        
        tr.appendChild(td1);
        td1.style.backgroundColor = item.watching_status === 1 ? '#2db039'
            : item.watching_status === 2 ? '#26448f'
            : item.watching_status === 3 ? '#f9d457'
            : item.watching_status === 4 ? '#a12f31'
            : item.watching_status === 6 ? '#c3c3c3'
            : '';
        td1.style.borderBottom = '#ebebeb 1px solid';
        td1.style.display = 'table-cell';
        td1.style.padding = '4px 0';
        td1.style.textAlign = 'center';
        td1.style.verticalAlign = 'middle';
        td1.style.width = '4px';
        
        var td2 = document.createElement('td');
        
        tr.appendChild(td2);
        td2.innerText = item.rank || '?';
        td2.style.borderBottom = '#ebebeb 1px solid';
        td2.style.display = 'table-cell';
        td2.style.padding = '4px 0';
        td2.style.textAlign = 'center';
        td2.style.verticalAlign = 'middle';
        
        var td3 = document.createElement('td');
        
        tr.appendChild(td3);
        td3.style.borderBottom = '#ebebeb 1px solid';
        td3.style.display = 'table-cell';
        td3.style.padding = '4px 0';
        td3.style.textAlign = 'center';
        td3.style.verticalAlign = 'middle';
        
        var img = document.createElement('img');
        
        td3.appendChild(img);
        img.src = item.image_url;
        img.style.border = '#ebebeb 1px solid';
        img.style.height = '68px';
        img.style.width = '48px';
        
        var td4 = document.createElement('td');
        
        tr.appendChild(td4);
        td4.style.borderBottom = '#ebebeb 1px solid';
        td4.style.display = 'table-cell';
        td4.style.padding = '4px 0';
        td4.style.paddingLeft = '8px';
        td4.style.textAlign = 'left';
        td4.style.verticalAlign = 'middle';
        td4.style.wordWrap = 'break-word';
        
        var a = document.createElement('a');
        
        td4.appendChild(a);
        a.href = item.url;
        a.innerText = item.title;
        
        var td5 = document.createElement('td');
        
        tr.appendChild(td5);
        td5.style.borderBottom = '#ebebeb 1px solid';
        td5.style.display = 'table-cell';
        td5.style.padding = '4px 0';
        td5.style.paddingLeft = '8px';
        td5.style.textAlign = 'left';
        td5.style.verticalAlign = 'middle';
        td5.style.wordWrap = 'break-word';
        
        var ul = document.createElement('ul');
        
        td5.appendChild(ul);
        
        item.challenges.forEach(i => {
            var li = document.createElement('li');
            
            ul.appendChild(li);
            li.innerText = i;
        });
        
        item.row = tr;
    });
}

function checkChallenges(item) {
    var noitaminA = [16, 322, 586, 953, 1142, 1592, 1698, 2246, 3001, 3710, 3613, 4021, 4477, 5155, 5630, 6211, 6774, 5690, 7588, 7785, 7724, 8129, 9314, 8426, 10163, 9989, 10162, 10161, 10798, 10793, 12321, 11285, 12531, 12883, 13409, 13585, 13601, 13599, 6594, 16918, 19367, 19365, 19363, 22135, 21561, 23283, 23281, 23273, 23277, 28617, 28619, 28621, 31043, 28623, 32947, 32948, 32949, 30727, 34543, 34542, 34984, 35968, 36649, 37779, 37426, 39533, 39491, 39942, 41120, 6927, 6372, 6637, 11531, 11001, 15039, 21339, 30585, 28725, 28625, 28211, 33519, 33520, 23279, 34537, 34792, 37407, 37440, 37441, 37442, 34544, 38594, 40858];
    var yatp = [10501, 10016, 10500, 10502, 13169, 13173, 13175, 13171, 13863, 14353, 14349, 14347, 20889, 20903, 20907, 20961, 29513, 29511, 29517, 30922, 30920, 33391, 29515, 30923, 30921, 33388, 33389, 33390, 35681, 35683, 35682, 35680, 38012, 38013, 38014, 38011, 40036, 40035, 40037];
    var criteria = {
        'Bronze 1': a => [a.type && a.type === 'ONA', [[a.rank, 'getAnime', a.mal_id]]],
        'Bronze 2': a => [a.episodes && a.episodes >= 10 && a.duration && getDuration(a.duration) / 60 <= 15, [[a.rank, 'getAnime', a.mal_id]]],
        'Bronze 3': a => [clubs[71894] && clubs[71894].anime_relations && clubs[71894].anime_relations.filter(a => a.mal_id === item.mal_id).length, [[a.rank, 'getClub', 71894]]],
        'Bronze 4': a => [noitaminA.includes(a.mal_id) || yatp.includes(a.mal_id)],
        'Bronze 5': a => [clubs[41909] && clubs[41909].anime_relations && clubs[41909].anime_relations.filter(a => a.mal_id === item.mal_id).length || clubs[42215] && clubs[42215].anime_relations && clubs[42215].anime_relations.filter(a => a.mal_id === item.mal_id).length, [[a.rank, 'getClub', 41909], [a.rank, 'getClub', 42215]]],
        'Bronze 6': a => [a.producers && a.producers.filter(p => producers[p.mal_id] && producers[p.mal_id].anime && producers[p.mal_id].anime.length >= 5 && producers[p.mal_id].anime.length <= 30).length, [[a.rank, 'getAnime', a.mal_id]].concat(a.producers && a.producers.map(p => [a.rank, 'getProducer', p.mal_id]) || [])],
        'Bronze 7': a => [user && user.favorites && user.favorites.people && user.favorites.people.filter(p => people[p.mal_id] && people[p.mal_id].anime_staff_positions && people[p.mal_id].anime_staff_positions.filter(asp => asp.anime && asp.anime.mal_id === a.mal_id).length).length],
        'Bronze 8': a => [user && user.joined && a.aired && a.aired.from && (new Date(user.joined)).getFullYear() === (new Date(a.aired.from)).getFullYear(), [[a.rank, 'getAnime', a.mal_id]]],
        'Bronze 9': a => [a.aired && a.aired.from && (new Date(a.aired.from)).getFullYear() >= 2016 && (new Date(a.aired.from)).getFullYear() <= 2019, [[a.rank, 'getAnime', a.mal_id]]],
        'Bronze 10': a => [a.source && ['Visual novel', 'Light novel'].includes(a.source), [[a.rank, 'getAnime', a.mal_id]]],
        'Bronze 11': a => [a.source && ['4-koma manga', 'Web manga', 'Digital manga'].includes(a.source), [[a.rank, 'getAnime', a.mal_id]]],
        'Bronze 12': a => [a.source && a.source === 'Original', [[a.rank, 'getAnime', a.mal_id]]],
        'Bronze 13': a => [a.score && a.score >= 8.00 && a.duration && getDuration(a.duration) / 60 >= 16, [[a.rank, 'getAnime', a.mal_id]]],
        'Bronze 14': a => [a.rank && a.rank > 700 && a.duration && getDuration(a.duration) / 60 >= 16, [[a.rank, 'getAnime', a.mal_id]]],
        'Bronze 15': a => [a.rating && a.rating === 'PG-13 - Teens 13 or older', [[a.rank, 'getAnime', a.mal_id]]],
        'Bronze 16': a => [a.genres && a.genres.filter(g => ['Ecchi', 'Harem'].includes(g.name)).length, [[a.rank, 'getAnime', a.mal_id]]],
        'Bronze 17': a => [a.genres && a.genres.filter(g => ['Mystery', 'Psychological', 'Thriller'].includes(g.name)).length, [[a.rank, 'getAnime', a.mal_id]]]
    };
    
    Object.keys(criteria).forEach(c => {
        challenges[c] = challenges[c] || [];
        
        if (queryAll || !queryAll && !challenges[c].length) {
            if (criteria[c](item)[0]) {
                item.challenges.push(c);
                challenges[c].push(item);
            } else if (criteria[c](item)[1]) {
                criteria[c](item)[1].forEach(pushTodo);
            }
        }
    });

    function getDuration (str) {
        var hr = parseInt(str.match(/\d+ hr/) || 0);
        var min = parseInt(str.match(/\d+ min/) || 0);
        var sec = parseInt(str.match(/\d+ sec/) || 0);
        
        return (hr * 60 + min) * 60 + sec;
    }
}

function pushTodo(item) {
    var exists = false;
    var colors = {
        getUserProfile: '#FF9AA2',
        getUserData: '#FFB7B2',
        getAnime: '#FFDAC1',
        getClub: '#E2F0CB',
        getProducer: '#B5EAD7'//,
        //'#C7CEEA'
    };
    var progress = document.getElementById('progress');
    
    
    for (var r = 0; r < done.length && !exists; r++) {
        var same = true;
        
        for(var c = 1; c < done[r].length && same; c++) {
            same = done[r][c] === item[c];
        }
        
        exists = same;
    }
    
    for (var r = 0; r < todo.length && !exists; r++) {
        var same = true;
        
        for(var c = 1; c < todo[r].length && same; c++) {
            same = todo[r][c] === item[c];
        }
        
        exists = same;
    }
    
    if (!exists) {
        var span = document.createElement('span');
        
        progress.appendChild(span);
        span.style.display = 'inline-block';
        span.style.backgroundColor = colors[item[1]];
        span.style.width = '1em';
        span.style.height = '1em';
        todo.push(item);
    }
}

function toggleSize() {
    queryAll = !queryAll;
    document.getElementById('queryAll').innerText = queryAll ? 'All' : 'First';
}
