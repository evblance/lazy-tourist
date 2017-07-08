// TODO: Add OpenWeatherMap data for locality and display somewhere in UI

function initMap() {

  MARKER_ICON = 'icons/marker.png';

  var locations = [
    {
      lat: 45.500023,
      lng: -73.566740
    },
    {
      lat: 45.507933,
      lng: -73.565259
    },
    {
      lat: 45.508309,
      lng: -73.566439
    },
    {
      lat: 45.504813,
      lng: -73.567877
    },
    {
      lat: 45.503527,
      lng: -73.564873
    },

  ];

  var mapStyles = [
    {
      featureType: 'poi',
      stylers: [
        { visibility: 'off' }
      ]
    }
  ];

  var montreal = {lat: 45.501631, lng: -73.567002};

  var nbhMap = new google.maps.Map(document.getElementById('map'),{
    center: montreal,
    zoom: 13,
    mapTypeControl: false,
    styles: mapStyles
  });

  var infoWindow = new google.maps.InfoWindow();

  var geocoder = new google.maps.Geocoder;

  var placesService = new google.maps.places.PlacesService(nbhMap);

  var bounds = new google.maps.LatLngBounds();


  function initMarkers() {
    locations.forEach(function(location) {
      createMarker(location.lat, location.lng);
    });
  }

  // this function registers markers based on their name and coordinates
  function createMarker(latitude, longitude) {

    var coords = {lat: latitude, lng: longitude};

    var geocodeRequest = {
      location: coords
    };
    geocoder.geocode(geocodeRequest, function(response, status) {
      if (status === 'OK') {
        var placeid = response[0].place_id;
        var placesRequest = {
          placeId: placeid
        };
        placesService.getDetails(placesRequest, function(response, status) {
          if (status === google.maps.places.PlacesServiceStatus.OK) {
            var marker = new google.maps.Marker({
              name: response.name,
              position: coords,
              map: nbhMap,
              animation: google.maps.Animation.DROP,
              icon: MARKER_ICON
            });

            function markerListener(event) {
              var streetViewUrl = 'https://maps.googleapis.com/maps/api/streetview?key=AIzaSyBKC_eBqbyWzVOm2d8KEY5IC4NYxb2f4cA';
              streetViewUrl += '&location=' + coords.lat + ',' + coords.lng;
              streetViewUrl += '&size=200x200';

              // push data into info window
              var infoHtml = '<div id="loc-info"><h2 class="loc-heading">' + marker.name + '</h2><img class="loc-thumb" src="' + streetViewUrl + '" alt="location thumbnail"></div>';
              infoWindow.close();
              infoWindow.setContent(infoHtml);
              infoWindow.open(nbhMap, marker);
              infoWindow.addListener('closeclick', function() {
                infoWindow.map = null;
                infoWindow.marker = null;
                nbhVM.unbounceAllMarkers();
              });

              // set only clicked marker to bounce
              nbhVM.unbounceAllMarkers();
              marker.setAnimation(google.maps.Animation.BOUNCE);

              // center the map on the clicked marker
              nbhMap.setCenter(coords);
            }

            marker.addListener('click', markerListener);
            bounds.extend(coords);
            nbhMap.fitBounds(bounds);
            nbhVM.markers.push(marker);
            nbhVM.loadedMarkers.push(marker);

          } else {
            window.alert('Places Services had an error');
          }
        });

      } else {
        window.alert('Geocoder had an error');
      }
    });

  }

  nbhMap.addListener('click', function(event) {
    infoWindow.close();
    nbhVM.unbounceAllMarkers();
  });


  /* VIEWMODEL */

  var NeighbourhoodViewModel = function() {

    var self = this;

    this.map = nbhMap;

    this.markers = ko.observableArray([]);

    this.loadedMarkers = ko.observableArray([]);

    this.haveLoadedMarkers = ko.computed(function() {
      return this.loadedMarkers().length > 0;
    }, this);

    this.unchooseMarker = function(data) {
      var loadedMarkers = self.loadedMarkers();
      var numLoadedMarkers = loadedMarkers.length;
      for (var i = 0; i < numLoadedMarkers; i++) {
        if (data.name === loadedMarkers[i].name) {
          // hide marker
          loadedMarkers[i].setMap(null);
          // remove the marker from chosen array
          self.loadedMarkers.splice(i,1);
          return;
        }
      }
    };

    this.updateMarkers = function() {
      self.markers().forEach(function(marker) {
        marker.setMap(null);
      });
      console.log('hello');
      self.loadedMarkers().forEach(function(marker) {
        marker.setMap(self.map);
      });
    };

    this.chooseMarker = function(data) {
      self.markers().forEach(function(marker) {
        if (marker.name === data.name) {
          marker.setMap(self.map);
        }
      });
    };

    this.unbounceAllMarkers = function() {
      self.markers().forEach(function(marker) {
        if (marker.getAnimation() !== null) {
          marker.setAnimation(null);
        }
      });
    };

   // function to show a clicked marker
   this.selectMarker = function(marker) {
     // use the marker data to locate the correct marker form the ko arrays then update it to have the correct map
    self.unbounceAllMarkers();
    marker.setAnimation(google.maps.Animation.BOUNCE);
    self.map.setCenter({ lat: marker.position.lat(), lng: marker.position.lng() });
    self.markers().forEach(function(m) {
      if (m.name === marker.name) {
        m.setMap(self.map);
      }
    });
   };

   // function to check if marker is selected
   this.chosenMarker = function(data) {
     self.loadedMarkers().forEach(function(marker) {
       if (marker === data) {
         return true;
       }
     });
     return false;
   };

    // function that recalculates map bounds to encompass only the currently selected places
    this.refreshBounds = function() {
      var bounds = new google.maps.LatLngBounds();
      self.loadedMarkers().forEach(function(marker) {
        bounds.extend({lat: marker.position.lat(), lng: marker.position.lng()});
      });
      self.map.fitBounds(bounds);
      self.map.setZoom(18);
    };

    this.placesListClick = function() {
      self.updateMarkers();
      self.refreshBounds();
    };

  };


  var nbhVM = new NeighbourhoodViewModel();
  ko.applyBindings(nbhVM);

  initMarkers();
}

// check visibility instead of toggling to avoid bug on user resize
$('.hamburger').on('click', 'span', function() {
  if ( $('form').is(':visible') ) {
    $('form').removeClass('ui-shown');
    $('.hamburger').removeClass('hamburger-on');
  } else {
    $('.hamburger').addClass('hamburger-on');
    $('form').addClass('ui-shown');
  }
});
