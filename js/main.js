var map = null;
var mbox = {
	"mapBoxLayerId":"spatialdev.i23e4gom"
}
var mzoom = 16;
var mpad = {paddingTopLeft:[20,20], paddingBottomRight:[300,20]};
var hq_ll = {lat:47.66897646697106, lng:-122.38491654396057};
var mapLayers = {};
var geocodeResults = [];
var directionsResults = [];

// panel
var open = 0;
$(".trigger" ).click(function() {
    if (open == 0) {
    	//$('#start-input').focus();
    	$(".trigger" ).animate({ "right": "+=300px" }, "slow" );
        $(".block" ).animate({ "right": "+=300px" }, "slow", function(){
        	$('#start-input').focus();
        });
        
        open = 1;
    }
    else if (open == 1) {
        $(".block" ).animate({ "right": "-=300px" }, "slow" );
        $(".trigger" ).animate({ "right": "-=300px" }, "slow" );
        open = 0;
    }
});

// set to geocode on enter keypress
$('#start-input').keypress(function(e) {
    if(e.which == 13) {
        geocodeIt($(this).val());
    }
})

// geocoder
function geocodeIt(searchString){
	$('#steps').empty();
	mapLayers.hq.eachLayer(function(m) {
	 	m.closePopup();
	});
	mapLayers.start.setGeoJSON([]);
	mapLayers.routePreview.setGeoJSON([]);
	mapLayers.selectedRoute = {};
	mapLayers.selectedRoutePreview.setGeoJSON([]);
	mapLayers.selectedRouteGeo.setGeoJSON([]);
	if (map.hasLayer(mapLayers.stepPreview)){
		map.removeLayer(mapLayers.stepPreview);
	}
	var geocodeResults = [];

	$('.results-item').off('click');
	$('.results-item').off('mouseover');
	$('.results-item').off('mouseout');

	var geocodeRequest = "http://api.tiles.mapbox.com/v3/" + mbox.mapBoxLayerId + "/geocode/" + searchString + ".json";

	$.ajax({
		url: geocodeRequest,
		success: function(data, textStatus, jqXHR){
			$('#start-input').val('');
			if (data.results && data.results[0] && data.results[0][0].lat){
				var geocodeResults = data.results;
				var template = _.template("<ul class='results-list'><% _.each(locations, function(location) { %>"+
												"<li class='results-item' data-lat='<%= location[0].lat %>' data-lng='<%= location[0].lon %>'>"+
													"<% _.each(location, function(subloc,idx,sl) { %>"+
														"<%= subloc.name %><% if(idx !=sl.length-1){ %>"+
															", "+
														"<% } %>"+
													"<% }); %>"+
												"</li>"+
											"<% }); %></ul>");
				compiled = template({locations:geocodeResults});

				$('#search-results').html(compiled);
				$('.results-item').on('click', function(e){
					locationSelect(e.target);
				});
				$('.results-item').on('mouseover', function(e){
					var item = $(e.target);
					var latlng = {lat:item.data('lat'),lng:item.data('lng')};
					map.setView(latlng, 10, mpad);
				});
				$('.results-item').on('mouseout', function(e){
					map.setView(hq_ll, mzoom, mpad);
				});
			};
		},
		error: function(jqXHR, textStatus, errorThrown) {
			//onErrorCallback(jqXHR);
			console.log(textStatus);
		}
	});
}

function locationSelect(item){
	var $item = $(item);
	var latlng = {lat:$item.data('lat'),lng:$item.data('lng')};
	$('#search-results').empty();
	mapLayers.start.setGeoJSON({
	    type: "FeatureCollection",
	    features: [{
	        type: "Feature",
	        geometry: {
	            type: "Point",
	            coordinates: [latlng.lng,latlng.lat]
	        },
	        properties: {
	        	title: $item.html(),
		        'marker-color': '#a3e46b',
		        'marker-size': 'large',
		      	'marker-symbol': 'star'
		    }
	    }]
	});
	var startPt = L.latLng(latlng.lat, latlng.lng),
	endPt = L.latLng(hq_ll.lat, hq_ll.lng),
	bounds = L.latLngBounds(startPt, startPt);
	bounds.extend(endPt);
	map.fitBounds(bounds,mpad);
	getDirections(latlng.lng,latlng.lat,hq_ll.lng,hq_ll.lat);
};

function getDirections(originLng,originLat,destinationLng,destinationLat){
	mapLayers.routePreview.setGeoJSON([]);
	$('.routes-item').off('mouseover');
	$('.routes-item').off('mouseout');

	var directionsRequest = "http://api.tiles.mapbox.com/v3/" + mbox.mapBoxLayerId + "/directions/driving/" + originLng + "," + originLat + ";" + destinationLng + "," + destinationLat + ".json";

	$.ajax({
		url: directionsRequest,
		success: function(data, textStatus, jqXHR){
			var directionsResults = data.routes;
			var template = _.template("<ul class='routes-list'><% _.each(routes, function(route, idx) { %>"+
											"<li class='routes-item' data-routeindex='<%= idx %>'>"+
													"<%= route.summary %>"+
											"</li>"+
										"<% }); %></ul>");
			compiled = template({routes:directionsResults});

			$('#route-results').html(compiled);
			$('.routes-item').on('click', function(e){
				var idx = $(e.target).data('routeindex');
				var route = directionsResults[idx];
				routeSelect(route);
			});
			$('.routes-item').on('mouseover', function(e){
				var item = $(e.target);
				var idx = item.data('routeindex');
				mapLayers.routePreview.setGeoJSON({
				    type: "FeatureCollection",
				    features: [{
				        type: "Feature",
				        properties: {
					      "stroke": "#fc4353",
					      "stroke-width": 4
					    },
				        geometry: directionsResults[idx].geometry
				    }]
				});
			});
			$('.routes-item').on('mouseout', function(e){
				mapLayers.routePreview.setGeoJSON([]);
			});
		},
		error: function(jqXHR, textStatus, errorThrown) {
			//onErrorCallback(jqXHR);
			console.log(textStatus);
		}
	});
};

function routeSelect(route){
	$('#route-results').empty();
	mapLayers.selectedRoute = route;
	mapLayers.selectedRouteGeo.setGeoJSON({
	    type: "FeatureCollection",
	    features: [{
	        type: "Feature",
	        properties: {
		      "stroke": "#2D91CD",
		      "stroke-width": 4
		    },
	        geometry: mapLayers.selectedRoute.geometry
	    }]
	});
	console.log(mapLayers.selectedRoute.steps);
	var template = _.template("<ul class='route-steps'><% _.each(steps, function(step, idx) { %>"+
									"<li class='route-step'"+
									"data-lat='<%= step.maneuver.location.coordinates[1] %>'"+
									"data-lng='<%= step.maneuver.location.coordinates[0] %>'>"+
											"<%= step.maneuver.instruction %>"+
									"</li>"+
								"<% }); %></ul>");
	compiled = template({steps:mapLayers.selectedRoute.steps});

	$('#steps').html(compiled);

	$('.route-step').on('click', function(e){
		$('.route-step').removeClass('selected');
		$(e.target).addClass('selected');
		stepPreview(e.target);
	})
};

function stepPreview(item){
	var stepMarkerOptions = {
	    radius: 8,
	    fillColor: "#2f4352",
	    color: "#fff",
	    weight: 2,
	    opacity: 1,
	    fillOpacity: 1
	};

	var $item = $(item);
	var latlng = {lat:$item.data('lat'),lng:$item.data('lng')};
	if (map.hasLayer(mapLayers.stepPreview)){
		mapLayers.stepPreview.setLatLng(latlng);
	} else {
		mapLayers.stepPreview = L.circleMarker(latlng,stepMarkerOptions).addTo(map);
	}
	
	map.setZoom(16).panTo(latlng);
};

// map
map = L.map('map')
    .setView(hq_ll, mzoom, mpad)
    .addLayer(L.mapbox.tileLayer(mbox.mapBoxLayerId, {
        detectRetina: true
    }));

mapLayers.hq = L.mapbox.featureLayer({
	type: 'Feature',
	geometry: {
	    type: 'Point',
	    coordinates: [hq_ll.lng,hq_ll.lat]
	},
	properties: {
		directions: 'finish',
	    title: 'SpatialDev World Headquarters',
	    description: '2208 NW Market St., Suite 202,<br>Seattle, WA 98107<br>(206) 923-9627',
	    'marker-color': '#2f4352',
	    'marker-size': 'large',
	  	'marker-symbol': 'heart'

	}
}).addTo(map);
mapLayers.start = L.mapbox.featureLayer().addTo(map);
mapLayers.routePreview = L.mapbox.featureLayer().addTo(map);
mapLayers.selectedRoutePreview = L.mapbox.featureLayer().addTo(map);
mapLayers.selectedRouteGeo = L.mapbox.featureLayer().addTo(map);

mapLayers.hq.eachLayer(function(m) {
 	m.openPopup();
});