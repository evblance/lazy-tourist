/* VIEWMODEL */

var NeighbourhoodViewModel = function() {

  var self = this;

  this.markers = ko.observableArray([]);

  this.chosenMarkers = ko.observableArray([]);

  this.haveChosenPlaces = ko.computed(function() {
    return this.chosenMarkers().length > 0;
  }, this);

  this.unchooseMarker = function(data) {
    chosenMarkers = self.chosenMarkers();
    numChosenMarkers = chosenMarkers.length;
    for (var i = 0; i < numChosenMarkers; i++) {
      if (data.name === chosenMarkers[i].name) {
        chosenMarkers[i].setMap(null);
        self.chosenMarkers.splice(i,1);
        return;
      }
    }
  };

  this.unbounceAllMarkers = function() {
    self.markers().forEach(function(m) {
      if (m.getAnimation() !== null) {
        m.setAnimation(null);
      }
    });
  };

 // function to show a clicked marker
 this.showMarker = function(marker) {
   // use the marker data to locate the correct marker form the ko arrays then update it to have the correct map
   console.log(marker);
   console.log(map);
 };


  // function that recalculates map bounds to encompass only the currently selected places
  this.refreshBounds = function() {
    // TODO: THis should also be handled by Google Maps API
  };

  // function that centers the map on marker if it was clicked
  this.centreMapOnMarker = function() {
    // TODO: This goes does not belong in the viewModel, but rather should be click event listener on the markers
  };

};

var nbhVM = new NeighbourhoodViewModel();
ko.applyBindings(nbhVM);

// ko.bindingHandlers.neighbourhoodMap = {
//   init: function(document.getElementById('map'), )
// }


/* MAP STUFF */

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

  var map = new google.maps.Map(document.getElementById('map'),{
    center: montreal,
    zoom: 13,
    mapTypeControl: false,
    styles: mapStyles
  });

  var infoWindow = new google.maps.InfoWindow();

  var geocoder = new google.maps.Geocoder;

  var placesService = new google.maps.places.PlacesService(map);

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
              map: map,
              animation: google.maps.Animation.DROP,
              icon: MARKER_ICON
            });

            marker.addListener('click', function(event) {

              var streetViewUrl = 'https://maps.googleapis.com/maps/api/streetview?key=AIzaSyBKC_eBqbyWzVOm2d8KEY5IC4NYxb2f4cA';
              streetViewUrl += '&location=' + coords.lat + ',' + coords.lng;
              streetViewUrl += '&size=200x200';

              // push data into info window
              var infoHtml = '<div id="loc-info"><h2 class="loc-heading">' + marker.name + '</h2><img class="loc-thumb" src="' + streetViewUrl + '" alt="location thumbnail"></div>';
              infoWindow.close();
              infoWindow.setContent(infoHtml);
              infoWindow.open(map, marker);
              infoWindow.addListener('closeclick', function() {
                infoWindow.map = null;
                infoWindow.marker = null;
                nbhVM.unbounceAllMarkers();
              });

              // set only clicked marker to bounce
              nbhVM.unbounceAllMarkers();
              marker.setAnimation(google.maps.Animation.BOUNCE);

              // center the map on the clicked marker
              map.setCenter(coords);

            });
            bounds.extend(coords);
            map.fitBounds(bounds);
            nbhVM.markers.push(marker);
            nbhVM.chosenMarkers.push(marker);

          } else {
            window.alert('Places Services had an error');
          }
        });

      } else {
        window.alert('Geocoder had an error');
      }
    });

  }

  map.addListener('click', function(event) {
    infoWindow.close();
    nbhVM.unbounceAllMarkers();
  });

  initMarkers();

}
