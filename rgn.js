/*     Rede Geodésica Nacional

Aluno 1: 57747 Bruno Braga
Aluno 2: 57833 Bruno Cabrita

Comentario: Foram realizadas todas as funções propostas pelo enunciado

O ficheiro "rng.js" tem de incluir, logo nas primeiras linhas,
um comentário inicial contendo: o nome e número dos dois alunos que
realizaram o projeto; indicação de quais as partes do trabalho que
foram feitas e das que não foram feitas (para facilitar uma correção
sem enganos); ainda possivelmente alertando para alguns aspetos da
implementação que possam ser menos óbvios para o avaliador.

0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789

HTML DOM documentation: https://www.w3schools.com/js/js_htmldom.asp
Leaflet documentation: https://leafletjs.com/reference-1.7.1.html
*/



/* GLOBAL CONSTANTS */

const MAP_CENTRE =
	[38.661,-9.2044];  // FCT coordinates
const MAP_ID =
	"mapid";
const MAP_ATTRIBUTION =
	'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> '
	+ 'contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>';
const MAP_URL =
	'https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token='
	+ 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw'
const MAP_ERROR =
	"https://upload.wikimedia.org/wikipedia/commons/e/e0/SNice.svg";
const MAP_LAYERS =
	["streets-v11", "outdoors-v11", "light-v10", "dark-v10", "satellite-v9",
		"satellite-streets-v11", "navigation-day-v1", "navigation-night-v1"]
const RESOURCES_DIR =
	"resources/";
const VG_ORDERS =
	["order1", "order2", "order3", "order4"];
const RGN_FILE_NAME =
	"rgn.xml";
const FILL_COLOUR_CIRCLE_PER_ORDER =
	["orange", "darkGreen", "cyan", "darkGrey"]
const OUTLINE_COLOUR_CIRCLE_PER_ORDER =
	["red", "lime", "darkBlue", "black"]
const LEFT_LIMIT_DISTANCE_INTERVAL_PER_ORDER = // in Kms
	[30, 20, 5]
const RIGHT_LIMIT_DISTANCE_INTERVAL_PER_ORDER = // in Kms
	[60, 40, 10]

	const defaultColor = 
    "#add8e6";

const GOOGLE_MAPS_URL = "https://www.google.com/maps/@";
/* GLOBAL VARIABLES */

let map = null;
const ZOOM_LEVEL_TO_DELETE_ALTITUDE_CIRCLES = 13;
const ZOOM_LEVEL_TO_DELETE_REMAINING_CIRCLES = 12;

//let vgs = null;

/* USEFUL FUNCTIONS */

// Capitalize the first letter of a string.
function capitalize(str)
{
	return str.length > 0
			? str[0].toUpperCase() + str.slice(1)
			: str;
}

// Distance in km between to pairs of coordinates over the earth's surface.
// https://en.wikipedia.org/wiki/Haversine_formula
function haversine(lat1, lon1, lat2, lon2)
{
    function toRad(deg) { return deg * 3.1415926535898 / 180.0; }
    let dLat = toRad(lat2 - lat1), dLon = toRad (lon2 - lon1);
    let sa = Math.sin(dLat / 2.0), so = Math.sin(dLon / 2.0);
    let a = sa * sa + so * so * Math.cos(toRad(lat1)) * Math.cos(toRad(lat2));
    return 6372.8 * 2.0 * Math.asin (Math.sqrt(a))
}

function loadXMLDoc(filename)
{
	let xhttp = new XMLHttpRequest();
	xhttp.open("GET", filename, false);
	try {
		xhttp.send();
	}
	catch(err) {
		alert("Could not access the local geocaching database via AJAX.\n"
			+ "Therefore, no POIs will be visible.\n");
	}
	return xhttp.responseXML;	
}

function getAllValuesByTagName(xml, name)  {
	return xml.getElementsByTagName(name);
}

function getFirstValueByTagName(xml, name)  {
	return getAllValuesByTagName(xml, name)[0].childNodes[0].nodeValue;
}


/* POI */

class POI {
	constructor(xml){
		this.name = getFirstValueByTagName(xml, "name");
		this.latitude = getFirstValueByTagName(xml, "latitude");
		this.longitude = getFirstValueByTagName(xml, "longitude");
	}
}

class VGP extends POI {
	constructor(xml, icon){
		super(xml)
		this.altitude = getFirstValueByTagName(xml, "altitude");
		this.type = getFirstValueByTagName(xml, "type");
		this.order = getFirstValueByTagName(xml, "order");
		this.marker = this.createMarker(icon)
	}

	createMarker(icon){
		let marker = L.marker([this.latitude, this.longitude], {icon: icon});
		//this.markers.push(marker);
		marker
			.bindPopup("Nome do Local: " + this.name +
			"<br>Ordem: " + this.order +
			"<br>Tipo: " + this.type +
			"<br>Latitude: " + this.latitude + 
			"<br>Longitude: " + this.longitude + 
			"<br>Altitude: " + this.altitude +
			this.getButtomStreet(this.latitude, this.longitude) +
			this.getButtonSameType(this.type)
			)
			.bindTooltip(this.name);
			//.addTo(this.lmap);
		return marker;
	}

	getButtomStreet(lat, long) {
        let buttom = 
        "<br><INPUT TYPE='button' ID='streets'" +
		 "VALUE='Google Streets' ONCLICK='openStreets(" + lat + "," + long + ")'>";
        return buttom;
    }

	getButtonSameType(type){
		let button =
		"<br><INPUT TYPE='button' ID='sameType'" +  
		"VALUE='VGs com mesmo tipo' ONCLICK='circleSameType(\"" + type + "\")'>";
		return button;
	}
	

}

class VG1 extends VGP {
	constructor(xml, icon, num){
		super(xml, icon);
		this.numOfNearbyVGs = num;
		this.marker = this.createMarker(icon)
	}

	createMarker(icon){
		
		let marker = L.marker([this.latitude, this.longitude], {icon: icon});
		//this.markers.push(marker);
		marker
			.bindPopup("Nome do Local: " + this.name +
			"<br>Ordem: " + this.order +
			"<br>Tipo: " + this.type +
			"<br>Latitude: " + this.latitude + 
			"<br>Longitude: " + this.longitude + 
			"<br>Altitude: " + this.altitude +
			"<br/>VG's Próximos: <SPAN id='total_nearby_VG1s'" +
			"style='color:black'>"+ this.numOfNearbyVGs +"</b></SPAN>" +
			this.getButtomStreet(this.latitude, this.longitude) +
			this.getButtonSameType(this.type) 
			)
			.bindTooltip(this.name);
			//.addTo(this.lmap);
		return marker;
	}

}

class VG2 extends VGP {
	constructor(xml, icon){
		super(xml, icon);
	}
	createMarker(icon){
		let marker = L.marker([this.latitude, this.longitude], {icon: icon});
		//this.markers.push(marker);
		marker
			.bindPopup("Nome do Local: " + this.name +
			"<br>Ordem: " + this.order +
			"<br>Tipo: " + this.type +
			"<br>Latitude: " + this.latitude + 
			"<br>Longitude: " + this.longitude + 
			"<br>Altitude: " + this.altitude +
			this.getButtomStreet(this.latitude, this.longitude) +
			this.getButtonSameType(this.type) +
			"<br /><INPUT TYPE='button' ID='nearbyVG2s' VALUE='VG2s Proximos'" +
			"ONCLICK='getNearbyVG2s("+this.latitude + "," + this.longitude +")'>"
			)
			.bindTooltip(this.name);
		return marker;
	}
}

class VG3 extends VGP {
	constructor(xml, icon){
		super(xml, icon);
	}

}

class VG4 extends VGP {
	constructor(xml, icon){
		super(xml, icon);
		
	}

}


/* MAP */

class Map {
	constructor(center, zoom) {
		//this.markers = [];
		//Group of layers for each order of vg
		this.clusteringVgs = L.markerClusterGroup();
		this.order1_layerGroup = L.layerGroup();
		this.order2_layerGroup = L.layerGroup();
		this.order3_layerGroup = L.layerGroup();
		this.order4_layerGroup = L.layerGroup();
		this.countByOrder = [0,0,0,0];
		this.highestVG = null;
		this.lowestVG = null;
		this.showNearbyVG2s = L.layerGroup();
		this.lastUsedType = null;
		this.lastUsedLat = 0;
		this.lastUsedLong = 0;
		this.lmap = L.map(MAP_ID).setView(center, zoom);
		this.addBaseLayers(MAP_LAYERS);
		let icons = this.loadIcons(RESOURCES_DIR);
		this.vgs = this.loadRGN(RESOURCES_DIR + RGN_FILE_NAME, icons);
		this.visibleVGS = this.vgs;
		this.stopZoomControl = 0;
		this.showAltitude = 0;
		this.showVG2 = 0;
		this.showSameType = 0;
		this.populate();
		this.getAltitudeCircles();
		this.addClickHandler(e =>
			L.popup()
			.setLatLng(e.latlng)
			.setContent("You clicked the map at " + e.latlng.toString())
		);
		
	}

	makeMapLayer(name, spec) {
		let urlTemplate = MAP_URL;
		let attr = MAP_ATTRIBUTION;
		let errorTileUrl = MAP_ERROR;
		let layer =
			L.tileLayer(urlTemplate, {
					minZoom: 6,
					maxZoom: 19,
					errorTileUrl: errorTileUrl,
					id: spec,
					tileSize: 512,
					zoomOffset: -1,
					attribution: attr
			});
		return layer;
	}

	addBaseLayers(specs) {
		let baseMaps = [];
		for(let i in specs)
			baseMaps[capitalize(specs[i])] =
				this.makeMapLayer(specs[i], "mapbox/" + specs[i]);
		baseMaps[capitalize(specs[0])].addTo(this.lmap);
		L.control.scale({maxWidth: 150, metric: true, imperial: false})
									.setPosition("topleft").addTo(this.lmap);
		L.control.layers(baseMaps, {}).setPosition("topleft").addTo(this.lmap);
		return baseMaps;
	}

	loadIcons(dir) {
		let icons = [];
		let iconOptions = {
			iconUrl: "??",
			shadowUrl: "??",
			iconSize: [16, 16],
			shadowSize: [16, 16],
			iconAnchor: [8, 8],
			shadowAnchor: [8, 8],
			popupAnchor: [0, -6] // offset the determines where the popup should open
		};
		for(let i = 0 ; i < VG_ORDERS.length ; i++) {
			iconOptions.iconUrl = dir + VG_ORDERS[i] + ".png";
		    icons[VG_ORDERS[i]] = L.icon(iconOptions);
		}
		return icons;
	}

	loadRGN(filename, icons) {
		let xmlDoc = loadXMLDoc(filename);
		let xs = getAllValuesByTagName(xmlDoc, "vg"); 
		let vgs = [];
		if(xs.length == 0)
			alert("Empty file");
		else {
			for(let i = 0 ; i < xs.length ; i++){
				//vgs[i] = new VG(xs[i]);
				let a = getFirstValueByTagName(xs[i], "order")
				a = parseInt(a);
				switch (a){
					
					case 1: vgs[i] = new VG1(xs[i], icons['order'+ a]);
					break;
					case 2: vgs[i] = new VG2(xs[i], icons['order'+ a]);
					break;
					case 3: vgs[i] = new VG3(xs[i], icons['order'+ a]);
					break;
					case 4: vgs[i] = new VG4(xs[i], icons['order'+ a]);
					break;
				}
				if (this.highestVG == null || 
					Number(this.highestVG.altitude) < Number(vgs[i].altitude)) {
					this.highestVG = vgs[i];
				}
				if (this.lowestVG == null || 
					Number(this.lowestVG.altitude) > Number(vgs[i].altitude)) {
					this.lowestVG = vgs[i];
				}
			}
			for(let i = 0; i < vgs.length ; i++){
				if(parseInt(vgs[i].order) == 1){
					vgs[i] = new VG1(xs[i], icons['order1'],
					 this.getNearbyVGs(vgs[i].latitude, vgs[i].longitude, vgs))
				}
			}
		}
		return vgs;
	}

	/**
	 * Inserts all the VGs into the respective layer groups, dependent on its order values
	  and sums the respective counter by 1 per insert then insert the layers into the cluster
	  which then goes to the map
	 */
	
	populate()  {
		for(let i = 0 ; i < this.vgs.length ; i++) {
			switch (parseInt(this.vgs[i].order)){
				case 1: this.order1_layerGroup.addLayer(this.vgs[i].marker);
				break;
				case 2: this.order2_layerGroup.addLayer(this.vgs[i].marker);
				break;
				case 3: this.order3_layerGroup.addLayer(this.vgs[i].marker);
				break;
				case 4: this.order4_layerGroup.addLayer(this.vgs[i].marker);
				break;
			}
			let pos = parseInt(this.vgs[i].order) - 1;
			this.countByOrder[pos] = this.countByOrder[pos] + 1;
		}
		this.clusteringVgs.addLayer(this.order1_layerGroup);
		this.clusteringVgs.addLayer(this.order2_layerGroup);
		this.clusteringVgs.addLayer(this.order3_layerGroup);
		this.clusteringVgs.addLayer(this.order4_layerGroup);
		this.lmap.addLayer(this.clusteringVgs);
	}

	addClickHandler(handler) {
		let m = this.lmap;
		function handler2(e) {
			return handler(e).openOn(m);
		}
		return this.lmap.on('click', handler2);
	}

	/**
	 * Creates a circle on a given position and radius, with outline color and filling color provided
		and a popup if it exists to associate with the circle.
	 */
	addCircle(pos, radius,colour, fillcolour, popup) {
		let circle =
			L.circle(pos,
				radius*1.5,
				{color: colour, fillColor: fillcolour, fillOpacity: 0.4}
			);
		if( popup != "" )
			circle.bindPopup(popup);
		return circle;
	}

	/**
	 * Removes the circles that represent the alitude of each visible marker from the map.
	 * Turns off the event listener on single click that triggers this function
	 */
	removeAltitudeCircles(){	
		this.lmap.removeLayer(this.altitudeCircles);
		this.lmap.off('click', function() {this.removeAltitudeCircles()});
		this.stopZoomControl = 1;
		this.showAltitude = 0
	}

	/**
	 * Removes the circles that represent the VG of order 2 near the one selected from the map.
	 * Turns off the event listener on single click that triggers this function
	 */
	removeNearbyVG2s(){
		this.lmap.removeLayer(this.showNearbyVG2s)
		this.lmap.off('click', function() {this.removeNearbyVG2s()})
		this.stopZoomControl = 1;
		this.showVG2 = 0;
	}

	/**
	 * Updates the visible VGs vector to include the previous ones and the ones that have given order
	 * @param {*} order order of the VGs that were invisible before
	 */
	addVisibleVGS(order){
		let vgs = []
		for(let i = 0; i < this.vgs.length; i++){
			if (this.visibleVGS.includes(this.vgs[i]) || parseInt(this.vgs[i].order) == order) vgs.push(this.vgs[i])
		}
		this.visibleVGS = vgs;
	}

	/**
	 * Updates the visible VGs vector to include the previous ones that dont have the same given order
	 * @param {Number} order order of the VGs that are going to be invisible on the map
	 */
	removeVisibleVGS(order){
		let vgs = []
		for(let i = 0; i < this.vgs.length; i++){
			if (this.visibleVGS.includes(this.vgs[i]) && parseInt(this.vgs[i].order) != order) vgs.push(this.vgs[i])
		}
		this.visibleVGS = vgs;
	}

	/**
	 * Removes the circles from the map that represent the VGs that have the same type as the one previous selected one
	 * Turns off the event listener on single click that triggers this function
	 */
	removeSameTypeCircles(){
		this.sameTypeCircles.remove(this.lmap)
		this.lmap.off('click', function() {this.removeSameTypeCircles()});
		this.lmap.off('zoomend', function() {this.zoomControl()})
		this.stopZoomControl = 1;
		this.showSameType = 0;
	}

	/**
	 * Returns the amount of VGs that are close to the designated position on the Earth's globe
	 * @param {Number} lat Latitude of the selected VG
	 * @param {Number} long Longitude of the selected VG
	 * @param {Vector} vgs List of VGs that were given to the map to be represented
	 * @returns amount of VGs close to the selected VG by maximum distance of 60km
	 */
	getNearbyVGs(lat, long, vgs){
		let sum = 0
		for (let i = 0; i < vgs.length; i++){
			
				let distance = haversine(lat, long, vgs[i].latitude, vgs[i].longitude)
				if (distance != 0 && distance <= 60)
				sum++;
			
		}
		return sum;
	}

	/**
	 * Updates the variable "altitudeCircles" dependant on what is currently visible in the map,
	 * which is basically creating a circle with colours (dependant on its order) on each marker
	 * with a radius depedant on its altitude value times a constant (in this case 2)
	 */
	getAltitudeCircles(){
		let circles = L.layerGroup();
		for(let pos = 0; pos < this.visibleVGS.length; pos++){
			
				let alt = Number(this.visibleVGS[pos].altitude);
				if (Number.isNaN(alt)) alt = 0;
				let order = parseInt(this.visibleVGS[pos].order)
				circles.addLayer(this.addCircle([this.visibleVGS[pos].latitude,
					 this.visibleVGS[pos].longitude], alt*2 ,
					 OUTLINE_COLOUR_CIRCLE_PER_ORDER[order-1],
					 FILL_COLOUR_CIRCLE_PER_ORDER[order-1], "Altitude: " + alt));
				
			}
		
		this.altitudeCircles = circles;
		
	}
	
	/**
	 * Updates the variable "showNearbyVG2s" dependant on what is currently visible in the map,
	 * which creates a circle on each marker that is within 30kms of a given position in the globe
	 * @param {Number} lat Latitude of the selected VG of order 2
	 * @param {Number} long Longitude of the selected VG of order 2
	 */
	getNearbyVG2s(lat, long){
		let circles = L.layerGroup();
		for (let i = 0; i < this.visibleVGS.length; i++){
			let order = parseInt(this.visibleVGS[i].order)
			if (order == 2){
				let lat2 = this.visibleVGS[i].latitude;
				let long2 = this.visibleVGS[i].longitude;
				let distance = haversine(lat, long, lat2, long2)
				if (distance != 0 && distance <= 30)
				circles.addLayer(this.addCircle([lat2, long2],
					150, 'orange', 'yellow', "VG2 Proximo do selecionado"))
				}
			}
		this.showNearbyVG2s = circles;
		}

	/**
	 * Updates the variable "sameTypeCircles" dependant on what it currently visible in the map,
	 * which creates a circle on each marker on the map that has the same VG type as the one given
	 * @param {String} type Type of the selected VG
	 */
	getSameType(type){
			let circles = L.layerGroup();
		for(let i = 0; i < this.visibleVGS.length; i++){
			if (this.visibleVGS[i].type === type){
				let lat = this.visibleVGS[i].latitude;
				let long = this.visibleVGS[i].longitude;
				circles.addLayer(this.addCircle([lat, long],200,
					'purple', 'red', "Tipo: " + type))
			}
		}
		this.sameTypeCircles = circles;
	}

	/**
	 * Updates the map dependant on the zoom level the map is currently on
	 * which is responsible of adding/removing the circles to/from the map
	 */
	zoomControl(){
		if(this.stopZoomControl == 0) {
		let zoomLevel = this.lmap.getZoom()	
		if (zoomLevel < ZOOM_LEVEL_TO_DELETE_ALTITUDE_CIRCLES ) {
			if(this.showAltitude == 1) this.lmap.removeLayer(this.altitudeCircles)}
			 else if(this.showAltitude == 1) this.lmap.addLayer(this.altitudeCircles)
		
		if (zoomLevel < ZOOM_LEVEL_TO_DELETE_REMAINING_CIRCLES ) {
			if(this.showVG2 == 1) this.lmap.removeLayer(this.showNearbyVG2s)
			if(this.showSameType == 1) this.lmap.removeLayer(this.sameTypeCircles)}
			 else {
				if(this.showVG2 == 1) this.lmap.addLayer(this.showNearbyVG2s)
				if(this.showSameType == 1) this.lmap.addLayer(this.sameTypeCircles)
		
			 }
			
		}
	}

	
}

/* FUNCTIONS for HTML */

/**
 * Initializes the map and required statistics of the map to display on the website
 * The colour is set to "lightblue" but it may be changed with the colour header customization
 */
function onLoad()
{
	map = new Map(MAP_CENTRE, 12);
	// adds a circle where FCT/UNL is located
	map.lmap.addLayer(map.addCircle(MAP_CENTRE, 100,'yellow', 'orange', "FCT/UNL")); 
	allOrderChecked(); // checks all checkboxes to show all the markers on the map when loading the page
	// Displays the amount of VGs that the map loaded into it
	document.getElementById('total_caches').innerHTML = map.vgs.length;
	// Displays the amount of VGs that are visible on the map
	document.getElementById('visible_caches').innerHTML = map.visibleVGS.length;
	// Displays the amount of VGs loaded on the map per order
	for(let i = 1; i <= VG_ORDERS.length; i++){
		document.getElementById('amount_VG'+ i + 's').innerHTML = map.countByOrder[i-1];
	}
	// Displays the VG loaded on the map with the highest alitude
	document.getElementById('highest_vg').innerHTML = map.highestVG.name;
	// Displays the VG loaded on the map with the lowest alitude
	document.getElementById('lowest_vg').innerHTML = map.lowestVG.name;
	// The colour header where the user can change the colour of the rectangle on the left
	let colorWell = document.getElementById('color_header');
    colorWell.value = defaultColor;
    colorWell.addEventListener("input", updateFirst);
	// Turns on an event listener to be updating the map according to the zoom level its located on
	// and either delete the circles when less zoomed in or make them appear when less zoomed out
	map.lmap.on('zoomend', function() {map.zoomControl();});
}

/**
 * Changes the background of the div HTML element to the given colour on update
 * @param {Event} event 
 */
function updateFirst(event) {
    let p = document.querySelector("div");

    p ? p.style.background = event.target.value : alert("Erro de cor");
  }

  /**
   * When a checkbox is checked/unchecked, we check which one it belongs to (by VG's order)
   *  and then do the respective operations which are, if it was checked, then we add the
   *  VGs of that order to the map.
   * If it was unchecked, then we need to remove the markers of that order from the map
   * to make them invisible, then update the visible number on the website.
   * @param {HTML} document The checkbox that triggered this function
   */
function checkboxUpdate(document){
	let orderStr = document.id;
	let order = parseInt(orderStr.slice(5));
	let orderGroup = null;

	let span_content = this.document.getElementById('visible_caches');
	switch (order){
			case 1: orderGroup = map.order1_layerGroup;
			break;
			case 2: orderGroup = map.order2_layerGroup;
			break;
			case 3: orderGroup = map.order3_layerGroup;
			break;
			case 4: orderGroup = map.order4_layerGroup;
			break;
		}

		if(document.checked){
			map.clusteringVgs.addLayer(orderGroup);
			map.addVisibleVGS(order);
		}else{
			map.clusteringVgs.removeLayer(orderGroup);
			map.removeVisibleVGS(order);	
		}
		span_content.innerHTML = map.visibleVGS.length;
		// If there was circles present on the map when the check/uncheck happened,
		// we need to update the circles to be according to the VGs visible on the map
	if(map.lmap.hasLayer(map.altitudeCircles)) showAltitude()
	if(map.lmap.hasLayer(map.showNearbyVG2s)) getNearbyVG2s(map.lastUsedLat, map.lastUsedLong)
	if(map.lmap.hasLayer(map.sameTypeCircles)) circleSameType(map.lastUsedType)
	
}
/**
 * Sets all checkboxes present on the website to checked state
 */
function allOrderChecked() {
	VG_ORDERS.forEach(order => {
		document.getElementById(order).checked = true;
	});
}

/**
 * When called, brings up an alert to display the amount of VGs that dont follow the given
 * definitions of its order( for example, a VG of order1 not having another VG of the same
 *  order within 30KM to 60KM of the first)
 */
function alertInvalidVGs() {
	alert("VGs Inválidos\nOrdem 1: " + calculateDistance(1, 30, 60) + 
	"\nOrdem 2: " + calculateDistance(2, 20, 30) +
	"\nOrdem 3: " + calculateDistance(3, 5, 10))
}

/**
 * Provides a list of VGs that dont respect their given distance intervals with others
 * of the same given order
 * @param {Number} orderNumber Order that is being tested
 * @returns 
 */
function calculateDistance(orderNumber) {
	let invalid = [];
	//Go through all the VGs lodaded on the map
	for(let i = 0; i < map.vgs.length; i++){
		let isValid = 0;
		let lat1 = map.vgs[i].latitude;
		let long1 = map.vgs[i].longitude;
		let distance;
		let leftLimit = LEFT_LIMIT_DISTANCE_INTERVAL_PER_ORDER[orderNumber-1];
		let rightLimit = RIGHT_LIMIT_DISTANCE_INTERVAL_PER_ORDER[orderNumber-1]
		// If the selected VG has the same order as the one we're looking at
		if(parseInt(map.vgs[i].order) == orderNumber){
			// We compare it with others that are at the same order
		for(let j = 0; j < map.vgs.length; j++){
			if (parseInt(map.vgs[j].order) == orderNumber){
				let lat2 = map.vgs[j].latitude
				let long2 = map.vgs[j].longitude
				distance = haversine(lat1, long1, lat2 , long2);
				
				if ((distance != 0) && (distance >= leftLimit) && (distance <= rightLimit)){
					isValid = 1;
					break;
				}
			}
		}
		// If the selected VG leaves the second for without having isValid at 1, means that
		// it doesn't have any other VG of the same order in the distance interval
		if (isValid == 0) {
			invalid.push(map.vgs[i].name);}
		}
	}
	// If there isn't any invalid VGs loaded on the map, then we display that it's empty
	if (invalid.length == 0) invalid.push("Vazio");
	return invalid;
}

	/**
	 * Displays the circles that represent the altitude of each marker
	 */
function showAltitude(){
	map.removeAltitudeCircles()
	map.getAltitudeCircles()
	map.altitudeCircles.addTo(map.lmap);
	map.lmap.on('click', function() {map.removeAltitudeCircles()});
	map.stopZoomControl = 0;
	map.showAltitude = 1;
	map.zoomControl();
}

/**
 * Opens a link to Google Maps Street view on given latitude and longitude
 * @param {Number} lat Latitude of the point
 * @param {Number} long Longitude of the point
 */
function openStreets(lat, long){
    let query = "http://maps.google.com/maps?q=&layer=c&cbll=";
    document.location = query + lat + "," + long;
}
/**
 * Displays the circles that represent the VGs have the same given type
 * @param {*} type Type of the selected VG
 */
function circleSameType(type){
	
	
	
	if(map.showSameType == 1) map.lmap.removeLayer(map.sameTypeCircles)
	map.getSameType(type);
	map.sameTypeCircles.addTo(map.lmap);
	map.lastUsedType = type;
	map.lmap.on('click', function() {map.removeSameTypeCircles();});
	map.stopZoomControl = 0;
	map.showSameType = 1;
	map.zoomControl();
}

/**
 * Displays the circles that represent the VGs of order 2 that are
 *  near the given position on the globe
 * @param {*} lat Latitude of the selected VG of order 2
 * @param {*} long Longitude of the selected VG of order 2
 */
function getNearbyVG2s(lat, long){
	
	if(map.showVG2 == 1) map.lmap.removeLayer(map.showNearbyVG2s)
	map.getNearbyVG2s(lat, long);
	map.lmap.addLayer(map.showNearbyVG2s);
	map.lastUsedLat = lat;
	map.lastUsedLong = long;
	map.lmap.on('click', function () {map.removeNearbyVG2s()}) 
	map.stopZoomControl = 0;
	map.showVG2 = 1;
	map.zoomControl();
}

