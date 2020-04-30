var anime;
var animeById = {}
var todo = [];
var done = [];
var active;
var requestCount = 0;
var requestTime = 0;
var challenges = {};

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
        return console.log(':)');
    }
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
    
    list.filter(i => i.watching_status !== 2 && i.rank !== null && !i.error).forEach((item, index) => {
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
        
        if (Object.keys(item.challenges).length) {
            var preReqs = [];
            
            if (item.related && item.aired && item.aired.from) {
                Object.keys(item.related).forEach(type => {
                    item.related[type].forEach(t => {
                        if (animeById[t.mal_id] && animeById[t.mal_id].aired && animeById[t.mal_id].aired.from) {
                            if (new Date(animeById[t.mal_id].aired.from) < new Date(item.aired.from)) {
                                preReqs.push(animeById[t.mal_id]);
                            }
                        } else if (!animeById[t.mal_id] || !animeById[t.mal_id].error) {
                            pushTodo(['getAnime', t.mal_id]);
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
                    Object.keys(item.challenges).forEach(i => {
                        ul.style.backgroundColor = '#AFA';
                        
                        var li = document.createElement('li');
                        
                        ul.appendChild(li);
                        li.innerText = i;
                    });
                }
            } else {
                pushTodo(['getAnime', item.mal_id]);
            }
        }
        
        item.row = tr;
    });
    
    active = undefined;
    next();
}

function checkChallenges(item) {
    item.challenges = {};
    if (item.type === 'ONA') item.challenges['Bronze 1'] = true;
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
