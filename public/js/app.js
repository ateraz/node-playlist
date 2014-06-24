var app = angular.module('playlist', []);

app.factory('socket', function ($rootScope) {
  var socket = io.connect();
  return {
    on: function (eventName, callback) {
      socket.on(eventName, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          callback.apply(socket, args);
        });
      });
    },
    emit: function (eventName, data, callback) {
      socket.emit(eventName, data, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          if (callback) {
            callback.apply(socket, args);
          }
        });
      })
    }
  };
});

app.factory('player', function($document, $http) {
  var audio = $document[0].createElement('audio'),
    clientID = 'YOUR_CLIENT_ID';
    observer = null,
    player = {
      playing: false,
      paused: false,
      track: null,
      currentTime: null,
      play: function(track) {
        this.track = track;
        if (player.paused != track) audio.src = track.stream_url + '?client_id=' + clientID;
        audio.play();
        this.playing = track;
        this.paused = false;
      },
      pause: function() {
        audio.pause();
        if (player.playing) {
          player.paused = player.track;
          player.playing = false;
        };
      },
      search: function(query, callback) {
        if(!query) return;
        var params = { client_id: clientID, limit: 5, order: 'hotness', q: query};
        $http.get('//api.soundcloud.com/tracks.json', { params: params }).success(callback);
      },
      notifyTimeUpdate: function() {
        observer();
      },
      setTimeObserver: function(_observer) {
        observer = _observer;
      }
    };

  audio.addEventListener('timeupdate', function() {
    player.currentTime = (audio.currentTime * 1000).toFixed();
    player.duration = (audio.duration * 1000).toFixed();
    player.notifyTimeUpdate();
  }, false);

  return player;
});

app.controller('PlaylistController', function($scope, $document, socket, player) {
  socket.emit('get-user-tracks');
  socket.on('user-tracks', function(tracks) {
    $scope.userTracks = tracks;
  });

  $scope.player = player;
  $scope.currentTime = 0;
  player.setTimeObserver(function() {
    $scope.$apply(function () {
      $scope.currentTime = player.currentTime;
    });
  });
});

app.controller('SearchController', function($scope, $timeout, $http) {
  $scope.query = '';
  var timer = false;

  $scope.$watch('query', function() {
    if(timer){
      $timeout.cancel(timer)
    }  
    timer = $timeout(function() {
      $scope.player.search($scope.query, function (tracks) {
        $scope.tracks = tracks;
      });
    }, 500);
  });
});


app.controller('AddTrackController', function($scope, socket) {
  $scope.addTrack = function() {
    socket.emit('add-track', $scope.player.track, function(response) {
      socket.emit('get-user-tracks');
    });
  }
});
