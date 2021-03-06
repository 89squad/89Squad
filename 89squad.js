(function() {
    'use strict';

    function plugReady() {
        return typeof API !== 'undefined' && API.enabled && typeof jQuery !== 'undefined' && typeof require !== 'undefined';
    }
    function autoReload() {
        if (!plugReady()) {
            setTimeout(autoReload, 200);
        } else {
            init();
        }
    }
    function init() {
        var pl = {}, media = {}, APIKey = localStorage.getItem('yt-api-key');

        if (APIKey == null) {
            APIKey = 'AIzaSyD--___tekD3NI_-Sj8cAnNyuDKFmdtOkM';
            API.chatLog('Ютуб не работает, введи /key [ТВОЙ КЛЮЧ]');
        } 
        window.gapi.client.setApiKey(APIKey);

        function convert_time(duration) {
            var a = duration.match(/\d+/g),
                indexOfH = duration.indexOf('H'),
                indexOfM = duration.indexOf('M'),
                indexOfS = duration.indexOf('S');

            switch(true) {
                case indexOfM >= 0 && indexOfH == -1 && indexOfS == -1:
                    a = [0, a[0], 0];
                    break;

                case indexOfH >= 0 && indexOfM == -1:
                    a = [a[0], 0, a[1]];
                    break;

                case indexOfH >= 0 && indexOfM == -1 && indexOfS == -1:
                    a = [a[0], 0, 0];
                    break;
            }

            duration = 0;

            switch(a.length) {
                case 1:
                    duration = duration + parseInt(a[0]);
                    break;

                case 2:
                    duration = duration + parseInt(a[0]) * 60;
                duration = duration + parseInt(a[1]);
                    break;

                case 3:
                    duration = duration + parseInt(a[0]) * 3600;
                    duration = duration + parseInt(a[1]) * 60;
                    duration = duration + parseInt(a[2]);
                    break;
            }

            return duration;
        }
        function completeMedia() {
            $.ajax({
                url: `https://www.googleapis.com/youtube/v3/videos?id=${media.cid}&key=${gapi.config.get().client.apiKey}&part=snippet,contentDetails`,
                type: 'GET',
                success: (data) => {
                    media.author = data.items[0].snippet.title.split('-');

                    if (media.author.length === 1) {
                        media.title = media.author[0].trim();
                        media.author = data.items[0].snippet.channelTitle;
                    } else {
                        var tempAuthor = media.author.shift().trim();
                        media.title = media.author.join('-').trim();
                        media.author = tempAuthor;
                    }

                    media.image = data.items[0].snippet.thumbnails.default.url;
                    media.duration = convert_time(data.items[0].contentDetails.duration);
                    media.format = 1;
                    media.id = -1;

                    addMedia();
                },
                error: (err) => {
                    if (err.responseJSON.error.message.indexOf('Daily Limit') > -1 ||
                       (err.responseJSON.error.errors &&
                       err.responseJSON.error.errors[0].reason == "quotaExceeded")) {
                        alert('The current API Key has exceeded its quota.\nTry setting your own by typing "/key [YOUR KEY HERE]" in the chat');
                    } else {
                        console.error('[YT-WORKAROUND]', err);

                        if (err.responseJSON.error.message) {
                            alert("YouTube error: " + err.responseJSON.error.message);
                        } else {
                            alert("Something went wrong with YouTube. You can check the console for more info.");
                        }
                    }
                }
            });
        }
        function addMedia() {
            $.ajax({
                url: `/_/playlists/${pl.id}/media/insert`,
                type: 'POST',
                data: JSON.stringify({
                    media: [media],
                    "append": false
                }),
                contentType: 'application/json',
                success: () => alert('Media added!\nIf you don\'t see it, try switching playlists or refreshing.'),
                error: (err) => {
                    if (err.responseJSON.status === 'maxItems') {
                        alert('This playlist is full!');
                    } else alert('Sorry, the media couldn\'t be added.');
                }
            });
        }
        function extractCID(cid) {
            return cid.replace(/(?:https?:)?(?:\/\/)?(?:[0-9A-Z-]+\.)?(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/\S*?[^\w\s-])((?!videoseries)[\w-]{11})(?=[^\w-]|$)(?![?=&+%\w.-]*(?:['"][^<>]*>|<\/a>))[?=&+%\w.-]*/gi, '$1');
        }
        function askCID() {
            media.cid = prompt(`Importing in ${pl.name}:\nVideo's link:`);
            if (!!media.cid === false) return;

            media.cid = extractCID(media.cid);
            completeMedia(media);
        }

        

        var $grabBtn = $('<div id="playlist-add-button" class="button" title="YouTube Grab+">'+
                             '<i class="fa fa-plus-square"></i>'+
                         '</div>');

        var playlists = _.find(require.s.contexts._.defined, (m)=>m&&m.activeMedia);
        $grabBtn.click(function() {
            playlists.models.forEach((model) => {
                model = model.toJSON();
                if (model.visible) {
                    if (model.count === 200) {
                        alert(`${model.name} is full!`);
                    } else {
                        pl = model;
                        askCID();
                    }
                }
            });
        });

        $('.playlist-buttons-container .playlist-edit-group').prepend($grabBtn);

        function chatCmd(cmd) {
            cmd = cmd.split(' ');

            if (cmd[0] === '/key' && cmd.length == 2) {
                if (/AIza[0-9A-z\-_]{35}/.test(cmd[1]) === false) {
                    API.chatLog('This is not a valid YT API Key!');
                    return;
                }

                window.gapi.client.setApiKey(cmd[1]);
                localStorage.setItem('yt-api-key', cmd[1]);
                API.chatLog('Ключ сохранен!');
            } else {
                API.chatLog('Please use this format: /key [KEY] (do not include the square brackets obviously)');
            }
        }
        API.on(API.CHAT_COMMAND, chatCmd);

        API.chatLog('YT-workaround fully loaded! Refresh to de-activate it.');
    }

    autoReload();
})();

