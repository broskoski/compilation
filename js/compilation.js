var app = angular.module('compilationApp', ['ngResource', 'compilationServices']);

var sc = SC.initialize({
  client_id: "52827056452bfe16056d4fa66a137529"
});

var sm = soundManager.setup({
  url: '/js/swf/'
});

app.config(function($routeProvider, $locationProvider) {
  $routeProvider.when('/', {
    templateUrl: 'js/templates/lister.html',
    controller: 'PlaylistLister'
  });
  $routeProvider.when('/:slug', {
    templateUrl: 'js/templates/viewer.html',
    controller: 'PlaylistViewer'
  });
  }
);

app.controller('Main', function($scope, currentPlaylist, currentSong){
  $scope.currentPlaylist = currentPlaylist;
  $scope.currentSong = currentSong;
})

app.controller('PlaylistLister', function($scope, $resource, currentPlaylist) { 
  var Channel = $resource('http://api.are.na/v2/channels/:slug?s=' + new Date().getTime());

  var playlists = Channel.get({slug: 'compilation'}, function(){
    $scope.lists = playlists.contents;
    currentPlaylist.set(false);
    currentSong.set(false);
  });

})

app.controller('PlaylistViewer', function($scope, $resource, $routeParams, currentPlaylist, currentSong, mediaClassifier) {

  $scope.player = null;

  var Channel = $resource('http://api.are.na/v2/channels/:slug?s=' + new Date().getTime());
  var songs = Channel.get({slug: $routeParams.slug}, function(){
    $scope.songs = songs.contents;
    currentPlaylist.set(songs);
    currentSong.set(false);
  });

  $scope.playSong = function(song){
    type = mediaClassifier.getType(song);

    console.log('type', type);

    currentSong.set(song);
    $scope.currentSong = song;

    $scope.$apply();

    if($scope.player && $scope.player.id){
      console.log('Player', $scope.player);
      $scope.player.destroy();
    }



    switch(type){
      case "soundcloud":
        var widgetIframe = document.getElementById('sc-widget'),
            widget       = SC.Widget(widgetIframe),
            newSoundUrl  = song.source.url;

        widget.load(newSoundUrl, {
          auto_play: true
        });

        widget.bind(SC.Widget.Events.FINISH, function() {
          console.log('scope', $scope);
          $scope.nextSong();
        });

        widget.bind(SC.Widget.Events.ERROR, function() {
          $scope.nextSong();
        });


        break;

      case "youtube":
        $scope.player = new YT.Player('hidden-player', {
          height: '390',
          width: '640',
          videoId: $scope.getYoutubeId(song),
          events: {
            'onReady': $scope.onYTPlayerReady,
            'onStateChange': $scope.onYTPlayerStateChange
          }
        });
        break;

      case "mp3":
        console.log('this is the song', song);

        var mySound = sm.createSound({
          id: 'aSound',
          url: song.attachment.url
        });

        mySound.play({
          onfinish: function() {
            $scope.nextSong();
          }
        });

        break;

      default: 

        console.log('not supported');
        break;
    }

  };

  $scope.onYTPlayerReady = function(event){
    event.target.playVideo();
  }

  $scope.onYTPlayerStateChange = function(event){
    if(event.data == YT.PlayerState.ENDED){
      $scope.nextSong();
    }
  }

  $scope.nextSong = function(){
    cur = $scope.songs.indexOf($scope.currentSong) + 1;
    if(cur == $scope.songs.length){
      cur = 0;
    }
    $scope.playSong($scope.songs[cur]);
  }

  $scope.getYoutubeId = function(song){
    reg = new RegExp('(?:https?://)?(?:www\\.)?(?:youtu\\.be/|youtube\\.com(?:/embed/|/v/|/watch\\?v=))([\\w-]{10,12})', 'g');
    return reg.exec(song.embed.html)[1];
  }

  $scope.currentSong = null;

})

angular.module('compilationServices', [])
  .factory('currentPlaylist', function($rootScope){
    var currentPlaylist = false;
    return {
      title: function(){
        return currentPlaylist.title;
      },
      username: function(){
        return currentPlaylist.user.username;
      },
      set: function(newPlaylist){
        currentPlaylist = newPlaylist;
      }
    }
  })
  .factory('currentSong', function($rootScope){
    var currentSong = false;
    return {
      title: function(){
        return currentSong.title;
      },
      set: function(newSong){
        currentSong = newSong;
      }
    }
  })
  .factory('mediaClassifier', function($rootScope){
    return {
      getType: function(song){
        if(song.class == "Attachment" && song.attachment.extension == "mp3"){
          return "mp3";
        }else if(song.class == "Media"){
          if(song.source.url.indexOf('soundcloud') > 0){
            return "soundcloud";
          }else if(song.source.url.indexOf('youtube') > 0){
            return "youtube";
          }
        }else{
          return "not supported";
        }
      }
    }
  })

var players = {
  mp3:{
    play: function(song){

    }
  },
  youtube:{
    play: function(song){

    }
  },
  soundcloud: {
    play: function(song){

    }
  }
}
