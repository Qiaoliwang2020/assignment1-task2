"use strict";


const findRide = document.getElementById("findRide");

let timer;
let minutes = Math.floor(Math.random() * 2) + 1; // returns a random integer from 1 to 2
let maxTime = parseInt(minutes) * 60;  // 1 hour = 60*60

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

    findRide.disabled = true;

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
        addLocationMarkers(map,places);

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
                    if (status !== "OK") {
                        alert('Oops! there may not be a driver in the current area, please enter an urban address.');
                        return
                    };
                    nearbyPosition = results[0].geometry.location;
                    createDriverMarkers(results, map);
                }
            );
        }
    });

    destination.addListener("places_changed", () => {

        const places = destination.getPlaces();

        if (places.length == 0) {
            return;
        }
        addLocationMarkers(map,places);

        // if we have current position , calculate and display route
        if (curPosition){

            let start = document.getElementById("start").value;
            let end = document.getElementById("end").value;

            calculateAndDisplayRoute(directionsService, directionsRenderer,start,end,function() {
                directionsRenderer.setMap(map);
            });
        }
        findRide.disabled = false;
    });

    // find a ride
    findRide.addEventListener("click", () => {

        calculateAndDisplayRoute(directionsService, directionsRenderer,nearbyPosition,curPosition,function (res) {

            createPickUpLine(map,res);
            // console.log(res.routes[0].legs[0].distance.text,'distance');
            // console.log(res.routes[0].legs[0].duration.text,'time')
            directionsRenderer.setMap(map);
            // get the timer element
            let timerEle = document.getElementById('timer');
            // put it in the map
            map.controls[google.maps.ControlPosition.TOP_LEFT].push(timerEle);
            // start to count time
            timer = setInterval('CountTimeDown()', 1000);

        });

        findRide.disabled = true;

    });

}

function calculateAndDisplayRoute(directionsService, directionsRenderer, start, end, callback) {

    directionsService.route(
        {
            origin: start,
            destination: end,
            optimizeWaypoints: false,
            travelMode: google.maps.TravelMode.DRIVING
        },
        (response, status) => {

            if (status === "OK") {

                directionsRenderer.setDirections(response);

                callback(response);

            } else {
                window.alert("Directions request failed due to " + status);
            }
        }
    );
}

// add markers for current and destination
function addLocationMarkers(map, places){

    let markers = [];
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
function createDriverMarkers(places, map) {
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


// create line for the driver to rider
function createPickUpLine(map,route) {

    let lineSymbol, line;
    lineSymbol = {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 3,
        strokeColor: "black",
    };
    // Create the polyline and add the symbol to it via the 'icons' property.
    line = new google.maps.Polyline({
        path: [],
        icons: [
            {
                icon: lineSymbol,
                offset: "100%"
            }
        ],
        map: map
    });


    let bounds = new google.maps.LatLngBounds();


    let legs = route.routes[0].legs;

    for (let i = 0; i < legs.length; i++) {
        let steps = legs[i].steps;
        for (let j = 0; j < steps.length; j++) {
            let nextSegment = steps[j].path;
            for (let k = 0; k < nextSegment.length; k++) {
                line.getPath().push(nextSegment[k]);
                bounds.extend(nextSegment[k]);
            }
        }
    }

    line.setMap(map);

    animateCircle(line);
}

let lineCircleAnimation = '';
function animateCircle(line) {
    let count = 0;
    lineCircleAnimation =setInterval(() => {
        // make sure the circle in the pick up location
        if(count < 199){
            count = (count+1) % 200;
        }
        else{
            count -1;
        }

        const icons = line.get("icons");
        icons[0].offset = count / 2 + "%";
        line.set("icons", icons);

        // console.log(count,'count')
    },200);



    console.log(count,'count:time');
}

function CountTimeDown() {
    if (maxTime >= 0) {
        let min = Math.floor(maxTime / 60),
            seconds = Math.floor(maxTime % 60),
            msg = `The driver has ${ min} minutes and ${seconds} seconds to reach your position`;
        document.getElementById('timer').innerHTML = msg;
        --maxTime;
        console.log(maxTime,'maxtime');
    } else{
        clearInterval(timer);
        clearInterval(lineCircleAnimation);
        document.getElementById('timer').innerHTML = `The driver has arrived`;
    }
}





