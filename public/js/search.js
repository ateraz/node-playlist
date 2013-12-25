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


  $( 'body' ).on('click', 'a.set-track', function() {
    currentTrack = {
      title: $(this).attr('data-title'),
      permalink_url: $(this).attr('data-url'),
      query: $('#search').val()
    };

    $('#player div').hide().empty().append(
      $('<a></a>').attr({ href: currentTrack.permalink_url }).addClass('sc-player')
    ).scPlayer({ autoPlay: true });

    $('#add-track').removeClass('added');
    $('#player').show();
  });


  $('#add-track').click(function() {
    socket.emit('add-track', currentTrack, function(response) {
      $('#add-track').addClass('added');
    });
  });


  SC.initialize({
    client_id: 'YOUR_CLIENT_ID'
  });

});
