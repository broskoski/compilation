var app = angular.module('compilationApp', ['ngResource', 'compilationServices']);

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

app.controller('Main', function($scope, currentPlaylist, currentSong, isLoading){
  $scope.currentPlaylist = currentPlaylist;
  $scope.currentSong = currentSong;
  $scope.loading = isLoading;
})

app.controller('PlaylistLister', function($scope, $resource, currentPlaylist, isLoading) { 
  var Channel = $resource('http://api.are.na/v2/channels/:slug?sort=created_at&direction=desc&s=' + new Date().getTime());
  isLoading.set('active');

  var playlists = Channel.get({slug: 'mac-are-na'}, function(){
    $scope.lists = playlists.contents;
    isLoading.set('');
    currentPlaylist.set(false);
    currentSong.set(false);
  });

  $scope.isRecent = function(list){
    var ONE_WEEK = 1000 * 60 * 60 * 24 * 7;
    myDate = Date.parse(list.connected_at);
    return ((new Date) - myDate) < ONE_WEEK;
  }
})

app.controller('PlaylistViewer', function($scope, $resource, $routeParams, currentPlaylist, currentSong, mediaClassifier, isLoading) {

  $scope.player = null;

  isLoading.set('active');

  var Channel = $resource('http://api.are.na/v2/channels/:slug?s=' + new Date().getTime());
  var songs = Channel.get({slug: $routeParams.slug}, function(){
    $scope.songs = songs.contents;
    isLoading.set('');
    currentPlaylist.set(songs);
    currentSong.set(false);
  });

  $scope.playSong = function(song){
    type = mediaClassifier.getType(song);

    console.log('type', type);

    currentSong.set(song);
    $scope.currentSong = song;

    $scope.$apply();

    if($scope.player){
      console.log('Player', $scope.player);
      $scope.player.destroy();
    }

    if($scope.mp3){
      $scope.mp3.destruct();
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

        $scope.mp3 = sm.createSound({
          id: 'aSound',
          url: song.attachment.url
        });

        $scope.mp3.play({
          onfinish: function() {
            $scope.mp3.destruct();
            $scope.mp3 = null;
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
    html = decodeURIComponent(song.embed.html);
    return reg.exec(html)[1];
  }

  $scope.showSong = function(song){
     return song.title && (song.class == 'Media' || song.class == 'Attachment');
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
  .factory('isLoading', function($rootScope){
    var cssClass = '';
    return {
      set: function(newClass){
        cssClass = newClass;
      },
      get: function(){
        return cssClass;
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
