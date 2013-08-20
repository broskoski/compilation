var app = angular.module('compilationApp', ['ngResource', 'compilationServices']);

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
  var Channel = $resource('http://api.are.na/v2/channels/:slug');

  var playlists = Channel.get({slug: 'compilation'}, function(){
    $scope.lists = playlists.contents;
    currentPlaylist.set(false);
    currentSong.set(false);
  });

})

app.controller('PlaylistViewer', function($scope, $resource, $routeParams, currentPlaylist, currentSong) {

  $scope.player = null;

  var Channel = $resource('http://api.are.na/v2/channels/:slug');
  var songs = Channel.get({slug: $routeParams.slug}, function(){
    $scope.songs = songs.contents;
    currentPlaylist.set(songs);
    currentSong.set(false);
  });

  $scope.playSong = function(song){
    currentSong.set(song);
    $scope.currentSong = song;

    $scope.$apply()

    console.log('song id', $scope.getYoutubeId(song));

    if($scope.player && $scope.player.id){
      console.log('Player', $scope.player);
      $scope.player.destroy();
    }

    $scope.player = new YT.Player('hidden-player', {
      height: '390',
      width: '640',
      videoId: $scope.getYoutubeId(song),
      events: {
        'onReady': $scope.onPlayerReady,
        'onStateChange': $scope.onPlayerStateChange
      }
    });
  };

  $scope.onPlayerReady = function(event){
    console.log('onPlayerReady', event);
    event.target.playVideo();
  }

  $scope.onPlayerStateChange = function(event){
    console.log('state change')
    if(event.data == YT.PlayerState.ENDED){
      console.log('trying to play next vid');
      cur = $scope.songs.indexOf($scope.currentSong) + 1;
      if(cur == $scope.songs.length){
        cur = 0;
      }
      $scope.playSong($scope.songs[cur]);
    }
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
        console.log('set song', newSong);
        currentSong = newSong;
      }
    }
  })