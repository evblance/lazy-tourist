// TODO: Add additional functionality
//       - Add a UI for tourist to select their interests
//          -- Locations array is then instead created based on the string and the array the geocoder returns
//             for each interest. Example: User ticks only garden and filters out Montreal from the cities
//             database -> placeId-1, placeId-2, ... then engage places service as currently implemented to
//             create markers related to these interests in the city of choice.
//          -- Callback to initMap will have to be removed from Google Maps API request script and instead
//             called on above form submission.

/* SUMMON JS SENSEI */
'use strict';

/* CONSTANTS */
var MARKER_ICON = 'icons/marker.png';
var NUM_PHOTOS = 10;

/* GLOBAL VARIABLES */
var $placesList = $('.places-ui__list');



/* GOOGLE MAPS MACHINERY */

// This function initialises the map
function initMap() {

  // clear initialisation function callback call timeout
  window.clearTimeout(mapsInitTimeout);

  // set a timeout for start of marker creation
  var markerInitTimeout = window.setTimeout(function() {
    window.alert('Error: App timed out on creating markers.');
  }, 3000);

  // sets notification text observable to suggest loading
  nbhVM.notificationText('<span class="loader"><i class="fa fa-2x fa-refresh fa-spin" aria-hidden="true"></i></span>');

  // hard-coded array of locations of interest
  var locations = [
    'Olympic Park Montreal',
    'Mont-Royal Montreal',
    'Vieux Montreal',
    'Garden Montreal',
    'Tower Montreal',
    'Circuit Gilles-Villeneuve',
    'Places des Arts Montreal',
    'Notre-Dame Basilica',
    'Chateau Dufresne',
    'Universite de Montreal'
  ];

  // array of custom map styles to remove default POIs from map
  var mapStyles = [
    {
      featureType: 'poi',
      stylers: [
        { visibility: 'off' }
      ]
    }
  ];

  // initialise map setting the centre on downtown Montreal
  var montreal = {lat: 45.501631, lng: -73.567002};
  nbhVM.map = new google.maps.Map(document.getElementById('map'),{
    center: montreal,
    zoom: 13,
    maxZoom: 13,
    mapTypeControl: false,
    styles: mapStyles
  });

  // create Geocoder Service instance
  var geocoder = new google.maps.Geocoder;

  // create Places Service instance
  var placesService = new google.maps.places.PlacesService(nbhVM.map);

  // property that stores a Bounds service instance
  nbhVM.mapBounds = new google.maps.LatLngBounds();

  // property that stores the infoWindow instance
  nbhVM.infoWindow = new google.maps.InfoWindow();

  // Function that initialises the markers
  function initMarkers() {

    var numLocs = locations.length;
    var markerTimer = function(i) {
      setTimeout(function() {
        createMarker(locations[i], i);
      }, 300 * i);
    };
    /* Creation of markers delayed by an appropriate interval so that
     * that Geocoder query rates are not exceeded
     */
    for (var i = 0; i < numLocs; i++) {
      markerTimer(i);
    }
  }

  // Function that registers markers based on their location name
  function createMarker(location, id) {

    var geocodeRequest = {
      address: location
    };

    geocoder.geocode(geocodeRequest, function(response, status) {
      if (status === 'OK') {
        var placeid = response[0].place_id;
        var placesRequest = {
          placeId: placeid
        };
        // var coords = response[0].geometry.location;
        var latitude = response[0].geometry.location.lat();
        var longitude = response[0].geometry.location.lng();
        var coords = {
          lat: latitude,
          lng: longitude
        };

        placesService.getDetails(placesRequest, function(response, status) {
          if (status === google.maps.places.PlacesServiceStatus.OK) {
            var marker = new google.maps.Marker({
              name: response.name,
              position: coords,
              map: nbhVM.map,
              animation: google.maps.Animation.DROP,
              icon: MARKER_ICON,
              images: [],
              infoData: '',
              address: response.formatted_address
            });

            marker.addListener('click', nbhVM.selectMarker);
            nbhVM.mapBounds.extend(coords);
            nbhVM.map.fitBounds(nbhVM.mapBounds);
            nbhVM.markers.push(marker);
            nbhVM.filteredMarkers.push(marker);
            nbhVM.map.maxZoom = 25;

            if (markerInitTimeout && nbhVM.markers.length < 1) {
              // clear marker initialisation timeout
              window.clearTimeout(markerInitTimeout);
            }

          } else {
            window.alert('Places Services had an error', status, 'while retrieving data.');
          }
        });

      } else {
        window.alert('Geocoder had an error', status, 'while retrieving data.');
      }
    });
  }

  // initialise markers
  initMarkers();

  // sets notification text observable to value for filtering state
  nbhVM.notificationText('no results');
}



/* VIEWMODEL */

var NeighbourhoodViewModel = function() {

  var self = this;

  // property that stores the Google Map instance
  this.map = undefined;

  // property that stores a Bounds service instance
  this.mapBounds = undefined;

  // property that stores the infoWindow instance
  this.infoWindow = undefined;

  // property that stores an array tracking the markers added to map
  this.markers = ko.observableArray([]);

  // property that tracks the filtering string entered by the user in the places UI
  this.filterString = ko.observable('');

  // property that stores an array tracking the markers that are currently filtered
  this.filteredMarkers = ko.observableArray([]);

  // method that helps monitor whether a marker is filtered
  this.isfilteredMarker = ko.computed(function(data) {
    for (var i = 0; i < self.filteredMarkers.length; i++) {
      if (self.filteredMarkers[i].name === data.name ) {
        return true;
      }
    }
    return false;
  });

  /* This method filters the places list based on the string passed
   * in a case insensitive manner
   */
  this.filterMarkers = function(string) {
    $('.places-ui__list').find('.places-ui__list-item').removeClass('selected');
    var reStr = new RegExp('(' + string.toLowerCase() + ')');
    self.filteredMarkers([]);
    return self.markers().filter(function(marker) {
      var check = marker.name.toLowerCase();
      var result = check.replace(reStr,'g');
      var found = (check !== result);
      if (found) {
        self.filteredMarkers().push(marker);
      }
      return found;
    });
  };

  // property that stores a tracked string for the places ui notifications text
  this.notificationText = ko.observable('');

  // locks map zoom to a maximum value
  this.lockMapZoom = function() {
    self.map.maxZoom = 18;
  };

  // unlock map zoom to fullest extent
  this.unlockMapZoom = function() {
    self.map.maxZoom = 25;
  };

  // This property tracks the selected place marker
  this.selectedMarker = ko.observable();

  /* This method helps ensure that only the selected place is highlighted
   * in the places UI
   */
  this.getSelectedMarker = function(marker) {
    if ( self.selectedMarker() ) {
      return (self.selectedMarker().name === marker.name);
    }
    return false;
  };

  // method for updating certain marker-related things
  this.updateMarkers = function() {
    self.markers().forEach(function(marker) {
      marker.setMap(null);
      self.infoWindow.close();
    });
    self.filteredMarkers().forEach(function(marker) {
      marker.setMap(self.map);
    });
  };

  // method for removing bounce animation from all markers
  this.unbounceAllMarkers = function() {
    self.markers().forEach(function(marker) {
      if (marker.getAnimation() !== null) {
        marker.setAnimation(null);
      }
    });
  };

  // method that recalculates map bounds to encompass only the currently filtered places
  this.refreshBounds = function() {
    self.filteredMarkers().forEach(function(marker) {
      self.mapBounds.extend({
        lat: marker.position.lat(),
        lng: marker.position.lng()
      });
    });
    self.map.fitBounds(self.mapBounds);
  };

  // method that handles execution on a marker click
  this.selectMarker = function() {

    var marker = this;

    // register the chosen marker
    self.selectedMarker(marker);

    // close previously open infoWindow
    self.infoWindow.close();
    self.infoWindow.map = null;

    // if marker already has additional data loaded...
    if (marker.infoData) {
      // ...load that data and show infowindow
      self.infoWindow.setContent(marker.infoData);
      self.infoWindow.open(self.map, marker);
    } else {
      // otherwise show some basic information while further data is loading
      var infoHTML = '';
      infoHTML += '<div class="loc-info">';
      infoHTML +=   '<h2 class="loc-heading">' + marker.name + '</h2>';
      infoHTML += '<h3 class="loc-address">' + marker.address + '</h3>';
      infoHTML +=   '<span class="loader"><i class="fa fa-2x fa-refresh fa-spin" aria-hidden="true"></i></span>';
      infoHTML += '</div>';
      marker.infoData = infoHTML;
      self.infoWindow.setContent(marker.infoData);
      self.infoWindow.open(self.map, marker);
    }

    // Only ask Flickr for images if no image urls already cached for this marker
    if (marker.images.length === 0) {
      var infoHTML = '';
      // Build the request url starting from base
      var flickrReqURL = 'https://api.flickr.com/services/rest/?api_key=4fbd721770420193baf71260f79454ac';
      // set return format to json and make sure a pure json object is returned
      flickrReqURL += '&format=json&nojsoncallback=1';
      // set to search for photos
      flickrReqURL += '&method=flickr.photos.search';
      // make sure no more than NUM_PHOTOS is returned
      flickrReqURL += '&per_page=' + NUM_PHOTOS;
      // set coordinates for improved accuracy
      flickrReqURL += '&lat=' + marker.position.lat();
      flickrReqURL += '&lon=' + marker.position.lng();
      // set to slightly better than city accuracy (11)
      flickrReqURL += '&accuracy=12';
      // return only photos
      flickrReqURL += '&content_type=1';
      // sorting by relevance
      flickrReqURL += '&sort=relevance';
      // pass the marker's name as the query text
      flickrReqURL += '&text=' + marker.name;

      // AJAX request for Flickr images related to this marker
      $.ajax({
        url: flickrReqURL,
        type: 'GET',
        datatype: 'json',
        beforeSend: function() {
          $('.loc-info').append('<span class="loader"><i class="fa fa-2x fa-refresh fa-spin" aria-hidden="true"></i></span>');
        },
        success: function(resp) {
          var farmId, serverId, id, secret, title, photoURL, thumbURL, owner;
          var infoHTML = '';
          var photoArr = resp.photos.photo;
          var numPhotos = photoArr.length;
          for (var i = 0; i < numPhotos; i++) {
            farmId = photoArr[i].farm;
            serverId = photoArr[i].server;
            id = photoArr[i].id;
            secret = photoArr[i].secret;
            owner = photoArr[i].owner;
            thumbURL = 'https:\/\/farm' + farmId + '.staticflickr.com/' + serverId + '/' + id + '_' + secret + '_t.jpg';
            photoURL = 'https:\/\/www.flickr.com/photos/' + owner + '/' + id;
            // add relevant photo urls to the marker's 'cache'
            marker.images.push({
              thumbURL: thumbURL,
              photoURL: photoURL
            });
          }

          // store additional data into the marker's information model
          infoHTML += '<div class="loc-info">';
          infoHTML += '<h2 class="loc-heading">' + marker.name + '</h2>';
          infoHTML += '<h3 class="loc-address">' + marker.address + '</h3>';
          infoHTML += '<ul class="loc-thumblist">';
          marker.images.forEach(function(image) {
            infoHTML += '<li class="loc-thumblist__item">';
            infoHTML += '<a href="' + image.photoURL + '" target="_blank">';
            infoHTML += '<img class="loc-thumb" src="' + image.thumbURL + '" alt="flickr img">';
            infoHTML += '</a>';
            infoHTML += '</li>';
          });
          infoHTML += '</ul>';
          infoHTML += '</div>';
          marker.infoData = infoHTML;
        },
        error: function(err) {

          alert('Flickr API returned an error with state', err.readyState);

        },
        complete: function() {
          // remove temporary loader icon and push new content to infoWindow
          $('.loader').remove();
          self.infoWindow.setContent(marker.infoData);
        }
      });
    }

    // push information from marker into infoWindow and show on map and marker
    self.infoWindow.setContent(marker.infoData);
    self.infoWindow.open(self.map, marker);

    // add 'closeclick' listener on the infoWindow
    self.infoWindow.addListener('closeclick', function() {
      self.infoWindow.map = null;
      self.infoWindow.marker = null;
      self.unbounceAllMarkers();
      $placesList.find('.places-ui__list-item').removeClass('selected');
    });

    // set only clicked marker to bounce
    self.unbounceAllMarkers();
    marker.setAnimation(google.maps.Animation.BOUNCE);

    // center the map on the clicked marker
    self.map.setCenter(marker.position);
  };

  // perform refresh of markers and bounds on map
  this.refreshMarkerDisplay = function(data) {
    self.updateMarkers();
    self.refreshBounds();
  };

};



/* MAIN */

// set a timeout for initial access to Google Maps API
var mapsInitTimeout = window.setTimeout(function() {
  window.alert('Error: App timed out on accessing Google Maps API.');
}, 3000);

// initialise ViewModel and bind it
var nbhVM = new NeighbourhoodViewModel();
ko.applyBindings(nbhVM);

// handle click events on menu toggle
$('.app__menu').on('click', '.app__menu-toggle', function() {
  if ( $('.places-ui').hasClass('places-ui--shown') ) {
    $('.places-ui').removeClass('places-ui--shown');
    $('.app__menu-toggle').attr('title', '☰');
  } else {
    $('.places-ui').addClass('places-ui--shown');
    $('.app__menu-toggle').attr('title', '❌');
  }
});
