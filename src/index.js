var anime;
var animeById = {}
var todo = [];
var done = [];
var active;
var requestCount = 0;
var requestTime = 0;
var challenges = {};
var allChallenges;
var clubs = {};

function next(arg) {
    if (active) {
        return console.log(':(');
    }
    
    if (arg) {
        pushTodo(arg);
    }
    
    var ol = document.getElementById('todo');
    
    while (ol.firstChild) {
        ol.removeChild(ol.firstChild);
    }
    
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
        var func = active.shift();
        
        try {
            window[func](...active);
            done.push([func, ...active]);
        } catch (e) {
            todo.unshift(active);
            active = undefined;
            console.log(e);
            
            var li = document.createElement('li');
            
            ol.insertBefore(li, ol.firstChild);
            li.innerText = e.message;
            li.style.backgroundColor = '#faa';
        }
    } else {
        console.log(':)');
    }
}

function getClub(id) {
    var xhr = new XMLHttpRequest();
    
    xhr.open('POST', '/jikan', true);
    xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
    xhr.addEventListener('load', () => {
        var data = JSON.parse(xhr.responseText);
        
        clubs[id] = data;
        updateDisplay(anime);
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
        
        updateDisplay(anime);
    });
    xhr.send(JSON.stringify({
        type: 'anime',
        id: id
    }));
}

function getUserData() {
    var username = document.getElementById('Username').value;
    
    anime = [];
    callJikan(1);
    
    function callJikan(page) {
        var xhr = new XMLHttpRequest();
        
        xhr.open('POST', '/jikan', true);
        xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
        xhr.addEventListener('load', () => {
            var data = JSON.parse(xhr.responseText);
            
            data.anime.forEach(a => {
                anime.push(a);
                animeById[a.mal_id] = a;
            });
            
            if (data.anime.length === 300) {
                callJikan(++page);
            } else {
                updateDisplay(anime);
            }
        });
        xhr.send(JSON.stringify({
            type: 'user',
            username: username,
            request: 'animelist',
            data: 'all',
            params: {
                page: page
            }
        }));
    }
}

function updateDisplay(list) {
    challenges = {
        'Bronze 1': [],
        'Bronze 2': [],
        'Bronze 3': [],
        'Bronze 4': [],
        'Bronze 5': []
    };
    
    list.forEach(checkChallenges);
    list.sort((a, b) => {
        return isNaN(a.rank) && !isNaN(b.rank) || a.rank > b.rank;
    });
    
    var table = document.getElementById('Anime');
    
    table.style.border = '#EBEBEB 1px solid';
    table.style.borderCollapse = 'collapse';
    table.style.margin = '0 auto';
    table.style.width = '100%';
    
    while (table.firstChild) {
        table.removeChild(table.firstChild);
    }
    
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
    th5.innerText = 'Pre-Reqs/Challenges';
    th5.style.borderBottom = '#EBEBEB 1px solid';
    th5.style.display = 'table-cell';
    th5.style.height = '36px';
    th5.style.paddingLeft = '8px';
    th5.style.textAlign = 'left';
    th5.style.verticalAlign = 'middle';
    
    var tbody = document.createElement('tbody');
    
    table.appendChild(tbody);
    
    list.filter(i => i.watching_status !== 2 && i.rank !== null && i.rank > 0 && i.challenges.length && !i.error).forEach((item, index) => {
        var itemStatus = item.watching_status === 1 ? 'Watching'
            : item.watching_status === 2 ? 'Completed'
            : item.watching_status === 3 ? 'On-Hold'
            : item.watching_status === 4 ? 'Dropped'
            : item.watching_status === 6 ? 'Plan to Watch'
            : '?'
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
        
        var preReqs = [];
        
        if (item.related && item.aired && item.aired.from) {
            Object.keys(item.related).forEach(type => {
                item.related[type].forEach(t => {
                    if (t.type === "anime") {
                        if (animeById[t.mal_id] && animeById[t.mal_id].aired && animeById[t.mal_id].aired.from) {
                            if (animeById[t.mal_id].watching_status !== 2 && new Date(animeById[t.mal_id].aired.from) < new Date(item.aired.from)) {
                                preReqs.push(animeById[t.mal_id]);
                            }
                        } else if (!animeById[t.mal_id] || !animeById[t.mal_id].error) {
                            pushTodo(['getAnime', t.mal_id]);
                        }
                    }
                });
            });
            
            if (preReqs.length) {
                preReqs.forEach(i => {
                    ul.style.backgroundColor = '#FAA';
                    
                    var li = document.createElement('li');
                    
                    ul.appendChild(li);
                    li.innerText = i.title;
                });
            } else {
                item.challenges.forEach(i => {
                    ul.style.backgroundColor = '#AFA';
                    
                    var li = document.createElement('li');
                    
                    ul.appendChild(li);
                    li.innerText = i;
                });
            }
        } else {
            pushTodo(['getAnime', item.mal_id]);
        }
        
        item.row = tr;
    });
    
    allChallenges = true;
    
    Object.keys(challenges).forEach(k => {
        allChallenges &= !!challenges[k].length;
    });
    
    if (!todo.length && !allChallenges) {
        console.log(challenges);
    }
    
    active = undefined;
    next();
}

function checkChallenges(item) {
    var noitaminA = [16, 322, 586, 953, 1142, 1592, 1698, 2246, 3001, 3710, 3613, 4021, 4477, 5155, 5630, 6211, 6774, 5690, 7588, 7785, 7724, 8129, 9314, 8426, 10163, 9989, 10162, 10161, 10798, 10793, 12321, 11285, 12531, 12883, 13409, 13585, 13601, 13599, 6594, 16918, 19367, 19365, 19363, 22135, 21561, 23283, 23281, 23273, 23277, 28617, 28619, 28621, 31043, 28623, 32947, 32948, 32949, 30727, 34543, 34542, 34984, 35968, 36649, 37779, 37426, 39533, 39491, 39942, 41120, 6927, 6372, 6637, 11531, 11001, 15039, 21339, 30585, 28725, 28625, 28211, 33519, 33520, 23279, 34537, 34792, 37407, 37440, 37441, 37442, 34544, 38594, 40858];
    var yatp = [10501, 10016, 10500, 10502, 13169, 13173, 13175, 13171, 13863, 14353, 14349, 14347, 20889, 20903, 20907, 20961, 29513, 29511, 29517, 30922, 30920, 33391, 29515, 30923, 30921, 33388, 33389, 33390, 35681, 35683, 35682, 35680, 38012, 38013, 38014, 38011, 40036, 40035, 40037];
    
    item.challenges = [];
    
    if (
        item.duration === undefined ||
        item.episodes === undefined ||
        item.type === undefined
    ) {
        pushTodo(['getAnime', item.mal_id]);
    } else if (!clubs[71894] || !clubs[41909] || !clubs[42215]) {
        pushTodo(['getClub', 71894]);
        pushTodo(['getClub', 41909]);
        pushTodo(['getClub', 42215]);
    } else if (new Date(item.aired.from) < new Date(2020, 0, 1) && (!item.aired.to || new Date(item.aired.to) < new Date(2020, 0, 1))) {    
        if (item.type === 'ONA') { item.challenges.push('Bronze 1'); challenges['Bronze 1'].push(item.mal_id); }
        if (item.episodes >= 10 && getDuration(item.duration) / 60 <= 15) { item.challenges.push('Bronze 2'); challenges['Bronze 2'].push(item.mal_id); }
        if (clubs[71894].anime_relations.filter(a => a.mal_id === item.mal_id).length) { item.challenges.push('Bronze 3'); challenges['Bronze 3'].push(item.mal_id); }
        if (noitaminA.includes(item.mal_id) || yatp.includes(item.mal_id)) { item.challenges.push('Bronze 4'); challenges['Bronze 4'].push(item.mal_id); }
        if (clubs[41909].anime_relations.filter(a => a.mal_id === item.mal_id).length || clubs[42215].anime_relations.filter(a => a.mal_id === item.mal_id).length) { item.challenges.push('Bronze 5'); challenges['Bronze 5'].push(item.mal_id); }
    }
}

function getDuration (str) {
    var hr = parseInt(str.match(/\d+ hr/) || 0);
    var min = parseInt(str.match(/\d+ min/) || 0);
    var sec = parseInt(str.match(/\d+ sec/) || 0);
    
    return (hr * 60 + min) * 60 + sec;
}

function pushTodo(item) {
    var exists = false;
    
    for (var r = 0; r < done.length && !exists; r++) {
        var same = true;
        
        for(var c = 0; c < done[r].length && same; c++) {
            same = done[r][c] === item[c];
        }
        
        exists = same;
    }
    
    for (var r = 0; r < todo.length && !exists; r++) {
        var same = true;
        
        for(var c = 0; c < todo[r].length && same; c++) {
            same = todo[r][c] === item[c];
        }
        
        exists = same;
    }
    
    if (!exists) todo.push(item);
}
