var ViewModel = function() {

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
        chosenMarkers[i].map = null;
        self.chosenMarkers.splice(i,1);
        return;
      }
    }
  };

};
var viewModel = new ViewModel();
ko.applyBindings(viewModel);



function initMap() {

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

  var montreal = {lat: 45.501631, lng: -73.567002};

  var map = new google.maps.Map(document.getElementById('map'),{
    center: montreal,
    zoom: 13,
    mapTypeControl: false
  });

  // var placesSearchBox = new google.maps.places.SearchBox(document.getElementById('places-search'));

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
              animation: google.maps.Animation.DROP
            });

            marker.addListener('click', function(event) {

              var streetViewUrl = 'https://maps.googleapis.com/maps/api/streetview?key=AIzaSyBKC_eBqbyWzVOm2d8KEY5IC4NYxb2f4cA';
              streetViewUrl += '&location=' + coords.lat + ',' + coords.lng;
              streetViewUrl += '&size=200x200';

              infoHtml = '';
              infoWindow.close();
              infoWindow.setContent('<div id="loc-info"><h2 class="loc-heading">' + marker.name + '</h2><img class="loc-thumb" src="' + streetViewUrl + '" alt="location thumbnail"></div>');
              infoWindow.open(map, marker);
              infoWindow.addListener('closeclick', function() {
                infoWindow.map = null;
                infoWindow.marker = null;
              });

            });
            bounds.extend(coords);
            map.fitBounds(bounds);
            viewModel.markers.push(marker);
            viewModel.chosenMarkers.push(marker);

          } else {
            window.alert('Places Services had an error');
          }
        });

      } else {
        window.alert('Geocoder had an error');
      }
    });

// TODO: re-center map everytime the user selects a new marker





  }

  // map.addListener('bounds_changed', function() {
  //   console.log('Map bounds changed');
  //   placesSearchBox.setBounds(map.getBounds());
  // });

  // map.addListener('click', function(event) {
  //   createMarker(event.latLng.lat(), event.latLng.lng());
  // });

  // placesSearchBox.addListener('places_changed', function() {
  //   console.log(this);
  // });

  initMarkers();


}
