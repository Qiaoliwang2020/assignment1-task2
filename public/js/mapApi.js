"use strict";

function initMap() {
    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer();
    const map = new google.maps.Map(document.getElementById("map"), {
        zoom: 6,
        center: {
            lat: 41.85,
            lng: -87.65
        }
    });

    // Create the search box and link it to the UI element.
    const inputStart = document.getElementById("start");
    const currentLocation = new google.maps.places.SearchBox(inputStart);

    const inputEnd = document.getElementById(("end"));
    const destination = new google.maps.places.SearchBox(inputEnd);


    // Bias the SearchBox results towards current map's viewport.
    map.addListener("bounds_changed", () => {
        currentLocation.setBounds(map.getBounds());
        destination.setBounds(map.getBounds());
    });

    // Listen for the event fired when the user selects a prediction and retrieve
    currentLocation.addListener("places_changed", () => {
        const places = currentLocation.getPlaces();

        if (places.length == 0) {
            return;
        }
        addMarkers(map,places);

        // get the curPosition
        let curPosition = '';
        places.forEach((place)=>{
            curPosition = place.geometry.location;
        })

        const service = new google.maps.places.PlacesService(map);

        // Perform a nearby search.
        if(curPosition){
            service.nearbySearch(
                { location: curPosition, radius: 500, type: "parking" },
                (results, status) => {
                    if (status !== "OK") return;
                    createMarkers(results, map);
                }
            );
        }
    });
    destination.addListener("places_changed", () => {
        const places = destination.getPlaces();

        if (places.length == 0) {
            return;
        }
        addMarkers(map,places);
    });

    directionsRenderer.setMap(map);

    document.getElementById("submit").addEventListener("click", () => {
        calculateAndDisplayRoute(directionsService, directionsRenderer);
    });
}

function calculateAndDisplayRoute(directionsService, directionsRenderer) {

    directionsService.route(
        {
            origin: document.getElementById("start").value,
            destination: document.getElementById("end").value,
            optimizeWaypoints: false,
            travelMode: google.maps.TravelMode.DRIVING
        },
        (response, status) => {
            if (status === "OK") {
                directionsRenderer.setDirections(response);
                const route = response.routes[0];
                const summaryPanel = document.getElementById("directions-panel");

                summaryPanel.innerHTML = ""; // For each route, display summary information.

                for (let i = 0; i < route.legs.length; i++) {
                    const routeSegment = i + 1;
                    summaryPanel.innerHTML +=
                        "<b>Route Segment: " + routeSegment + "</b><br>";
                    summaryPanel.innerHTML += route.legs[i].start_address + " to ";
                    summaryPanel.innerHTML += route.legs[i].end_address + "<br>";
                    summaryPanel.innerHTML +=
                        route.legs[i].distance.text + "<br><br>";
                }

            } else {
                window.alert("Directions request failed due to " + status);
            }
        }
    );
}

// add markers
let markers = [];
function addMarkers(map,places){
    // Clear out the old markers.
    markers.forEach(marker => {
        marker.setMap(null);
    });
    markers = [];
    // For each place, get the icon, name and location.
    const bounds = new google.maps.LatLngBounds();
    places.forEach(place => {
        if (!place.geometry) {
            console.log("Returned place contains no geometry");
            return;
        }
        const icon = {
            url: place.icon,
            size: new google.maps.Size(71, 71),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(17, 34),
            scaledSize: new google.maps.Size(25, 25)
        };
        // Create a marker for each place.
        markers.push(
            new google.maps.Marker({
                map,
                icon,
                title: place.name,
                position: place.geometry.location
            })
        );

        if (place.geometry.viewport) {
            // Only geocodes have viewport.
            bounds.union(place.geometry.viewport);
        } else {
            bounds.extend(place.geometry.location);
        }
    });
    map.fitBounds(bounds);
}

function createMarkers(places, map) {
    const bounds = new google.maps.LatLngBounds();

    for (let i = 0, place; (place = places[i]); i++) {
        const image = {
            url: 'https://cdn.iconscout.com/icon/free/png-512/car-vehicle-travel-transport-side-view-29587.png',
            size: new google.maps.Size(71, 71),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(17, 34),
            scaledSize: new google.maps.Size(25, 25)
        };
        new google.maps.Marker({
            map,
            icon: image,
            title: place.name,
            position: place.geometry.location
        });
        bounds.extend(place.geometry.location);
    }

    map.fitBounds(bounds);
}


