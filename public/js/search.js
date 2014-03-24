function Track(title, url, query) {
  this.title = title;
  this.permalink_url = url;
  this.query = query;
}

Track.prototype.play = function(alreadyAdded) {
  $('#player div').hide().empty().append(
    $('<a></a>').attr({ href: this.permalink_url }).addClass('sc-player')
  ).scPlayer({ autoPlay: true });

  if (!alreadyAdded) {
    $('#add-track').removeClass('added');
  } else {
    $('#add-track').addClass('added');
  }
  $('.sc-pause, #player').removeClass('hidden');
};

Track.prototype.isInTracks = function(tracks) {
  var _this = this;
  return tracks.some(function(track){;
    return _this.permalink_url == track.permalink_url;
  });
};

$(document).ready(function() {

  var socket = io.connect(),
      userTracks = [],
      currentTrack,
      thread;


  function containerRenderer( $container) {
    return function(res) {
      var $tracks = $container.hide().empty(),
          template = $('#track-tpl').html();
      res.map(function(track) {
        $tracks.append(
          Mustache.to_html(template, track)
        );
      });
      $tracks.show();
    }
  }


  function scSeach(query) {
    SC.get(
      '/tracks',
      { q: query, limit: 5, order: 'hotness' },
      containerRenderer( $('#tracks') )
    );
  }


  $('#search').keyup(function() {
    clearTimeout(thread);
    var $this = $(this);
    thread = setTimeout(function() {
      if($this.val()) scSeach($this.val())
    }, 500);
  });


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


  SC.initialize({
    client_id: 'YOUR_CLIENT_ID'
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
