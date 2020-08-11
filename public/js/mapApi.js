"use strict";

let timer;

function initMap() {

    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer({ suppressMarkers: true });

    const map = new google.maps.Map(document.getElementById("map"), {
        zoom: 6,
        center: {
            lat: 41.85,
            lng: -87.65
        }
    });
    let curPosition = '';
    let nearbyPosition = '';

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
                    nearbyPosition = results[0].geometry.location;
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

        // if we have current position , calculate and display route
        if (curPosition){
            calculateAndDisplayRoute(directionsService, directionsRenderer);
        }

    });

    // find a ride
    document.getElementById("submit").addEventListener("click", () => {

        createLine(map,nearbyPosition,curPosition);

        // start to count down the timer
        timer = setInterval("CountDown()", 1000);
    });

    directionsRenderer.setMap(map);
}

function calculateAndDisplayRoute(directionsService, directionsRenderer) {

    let start = document.getElementById("start").value;
    let end = document.getElementById("end").value;

    directionsService.route(
        {
            origin: start,
            destination: end,
            optimizeWaypoints: false,
            travelMode: google.maps.TravelMode.DRIVING
        },
        (response, status) => {
            console.log(response,'res');
            if (status === "OK") {
                directionsRenderer.setDirections(response);

            } else {
                window.alert("Directions request failed due to " + status);
            }
        }
    );
}

// add markers for current and destination
let markers = [];
function addMarkers(map,places){

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
                position: place.geometry.location,
                label: {
                    color: 'red',
                    text: place.name,
                    fontSize: '14px',
                },
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

// create Markers for nearby parking (driver)
function createMarkers(places, map) {
    const bounds = new google.maps.LatLngBounds();

    for (let i = 0, place; (place = places[i]); i++) {
        const image = {
            url: 'https://cdn.iconscout.com/icon/free/png-512/car-vehicle-travel-transport-side-view-29587.png',
            size: new google.maps.Size(71, 71),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(17, 34),
            scaledSize: new google.maps.Size(40, 40)
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

let lineSymbol, line;
// create line for the driver to rider
function  createLine(map,driverLocation,currentLocation) {

    lineSymbol = {}; line = null;

    lineSymbol = {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 3,
        strokeColor: "blue"
    };
    // Create the polyline and add the symbol to it via the 'icons' property.
    line = new google.maps.Polyline({
        path: [
            driverLocation,
            currentLocation
        ],
        icons: [
            {
                icon: lineSymbol,
                offset: "100%"
            }
        ],
        map: map
    });
    animateCircle(line);
}

function animateCircle(line) {
    let count = 0;
    window.setInterval(() => {
        count = (count + 1) % 200;
        const icons = line.get("icons");
        icons[0].offset = count / 2 + "%";
        line.set("icons", icons);
    }, 20);
}


let minues = Math.floor(Math.random() * 3) + 1; // returns a random integer from 1 to 3
let maxtime = parseInt(minues) * 60;  // 1 hour = 60*60

function CountDown() {
    if (maxtime >= 0) {
        let minutes = Math.floor(maxtime / 60),
            seconds = Math.floor(maxtime % 60),
            msg = `The driver has ${ minutes} minutes and ${seconds} seconds to reach your position`;
        document.all["timer"].innerHTML = msg;
        --maxtime;
    } else{
        clearInterval(timer);
        document.all["timer"].innerHTML = `The driver has arrived`;
    }
}





