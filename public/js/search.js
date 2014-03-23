function Track(title, url, query) {
  this.title = title;
  this.url = url;
  this.query = query;
}

Track.prototype.play = function(already_added) {
  $('#player div').hide().empty().append(
    $('<a></a>').attr({ href: this.url }).addClass('sc-player')
  ).scPlayer({ autoPlay: true });

  if (!already_added) $('#add-track').removeClass('added');
  else $('#add-track').addClass('added');
  $('.sc-pause, #player').removeClass('hidden');
};

$(document).ready(function() {

  var socket = io.connect(),
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

    currentTrack.play($(this).is('#user-tracks a'));
  });


  $('#add-track').click(function() {
    socket.emit('add-track', currentTrack, function(response) {
      $('#add-track').addClass('added');
    });
  });


  SC.initialize({
    client_id: 'YOUR_CLIENT_ID'
  });

  socket.emit('get-user-tracks');
  socket.on('user-tracks', function(tracks){
    if (tracks.length) containerRenderer($('#user-tracks'))(tracks);
  });
});
