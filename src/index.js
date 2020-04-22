function getUserData() {
    var username = document.getElementById('Username').value;
    var page = 1;
    var anime = [];
    
    callJikan();
    
    function callJikan() {
        var xhr = new XMLHttpRequest();
        
        xhr.open('POST', '/jikan', true);
        xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
        xhr.addEventListener('load', function () {
            var data = JSON.parse(this.responseText);
            
            data.anime.forEach(a => {
                anime.push(a);
            });
            
            if (data.anime.length === 300) {
                callJikan();
            } else {
                console.log(anime);
            }
        });
        xhr.send(JSON.stringify({
            type: 'user',
            username: username,
            request: 'animelist',
            data: 'all',
            params: {
                page: page++
            }
        }));
    }
}
