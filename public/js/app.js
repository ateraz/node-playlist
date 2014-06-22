var playlist = angular.module('playlist', []);

function PlaylistController($scope, $document) {

  var audio = $document[0].createElement('audio'),
    player = {
      playing: false,
      paused: false,
      play: function(track) {
        $scope.currentTrack = track;
        if (player.paused != $scope.currentTrack) audio.src = $scope.currentTrack.stream_url + '?client_id=YOUR_CLIENT_ID';
        audio.play();
        player.playing = $scope.currentTrack;
        player.paused = false;
      },
      pause: function() {
        audio.pause();
        if (player.playing) {
          player.paused = $scope.currentTrack;
          player.playing = false;
        };
      }
    };

  audio.addEventListener('timeupdate', function() {
    $scope.$apply(function() {
      $scope.currentTime = (audio.currentTime * 1000).toFixed();
      $scope.duration = (audio.duration * 1000).toFixed();
    });
  }, false);

  $scope.currentTrack = null;
  $scope.player = player;
  $scope.currentTime = 0;
  $scope.duration = 0;
}

function SearchController($scope, $timeout, $rootScope) {
  SC.initialize({
    client_id: 'YOUR_CLIENT_ID'
  });

  $scope.query = '';
  var timer = false,
    updateTracks = function (tracks) {
      $scope.$apply(function () {
        $scope.tracks = tracks;
      });
    };

  $scope.$watch('query', function() {
    if(timer){
      $timeout.cancel(timer)
    }  
    timer = $timeout(function() {
      scSeach($scope.query, updateTracks);
    }, 500);
  });
}


function scSeach(query, callback) {
  if (query) {
    SC.get('/tracks', { q: query, limit: 5, order: 'hotness' }, callback);
  }
}

/*

Track.prototype.isInTracks = function(tracks) {
  var _this = this;
  return tracks.some(function(track){;
    return _this.permalink_url == track.permalink_url;
  });
};

/*
$(document).ready(function() {
  $('body').on('click', 'a.set-track', function() {
    currentTrack = new Track(
      $(this).attr('data-title'),
      $(this).attr('data-url'),
      $('#search').val()
    );

    var alreadyAdded = $(this).is('#user-tracks a') || currentTrack.isInTracks(userTracks);
    currentTrack.play(alreadyAdded);
  });


  $('#add-track').click(function() {
    socket.emit('add-track', currentTrack, function(response) {
      $('#add-track').addClass('added');
      socket.emit('get-user-tracks');
    });
  });

  socket.emit('get-user-tracks');
  socket.on('user-tracks', function(tracks) {
    if (tracks.length) {
      var render = containerRenderer($('#user-tracks'));
          lastFiveReversed = tracks.slice(Math.max(tracks.lenght - 5, 1)).reverse();
      userTracks = tracks;
      render(lastFiveReversed );
    }
  });
});
*/