/*     Rede Geodésica Nacional

Aluno 1: 57747 Bruno Braga
Aluno 2: 57833 Bruno Cabrita

Comentario:

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

const GOOGLE_MAPS_URL = "https://www.google.com/maps/@";
/* GLOBAL VARIABLES */

let map = null;
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
			this.getButtomStreet(this.latitude, this.longitude)
			)
			.bindTooltip(this.name);
			//.addTo(this.lmap);
		return marker;
	}

	getButtomStreet(lat, long) {
        let buttom = 
        "<br><INPUT TYPE='button' ID='streets' VALUE='Google Streets' ONCLICK='openStreets(" + lat + "," + long + ")'>";
        return buttom;
    }
	

}

class VG1 extends VGP {
	constructor(xml, icon){
		super(xml, icon);
	}

	

}

class VG2 extends VGP {
	constructor(xml, icon){
		super(xml, icon);
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
		this.lmap = L.map(MAP_ID).setView(center, zoom);
		this.addBaseLayers(MAP_LAYERS);
		let icons = this.loadIcons(RESOURCES_DIR);
		this.vgs = this.loadRGN(RESOURCES_DIR + RGN_FILE_NAME, icons);
		this.populate();
		this.getAltitudeCircles();
		this.addClickHandler(e =>
			L.popup()
			.setLatLng(e.latlng)
			.setContent("You clicked the map at " + e.latlng.toString())
		);
		
	}

	removeCircles(){	
		this.altitudeCircles.remove(this.lmap)
		this.lmap.off('click', function() {this.removeCircles()});
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

	getAltitudeCircles(){
		let circles = L.layerGroup();
		for(let pos = 0; pos < this.vgs.length; pos++){
			if (this.clusteringVgs.hasLayer(this.vgs[pos].marker)){
				let alt = Number(this.vgs[pos].altitude);
				if (Number.isNaN(alt)) alt = 0;
				circles.addLayer(this.addCircle([this.vgs[pos].latitude, this.vgs[pos].longitude], alt));
				}	
			}
		
		this.altitudeCircles = circles;
		
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
		}
		return vgs;
	}

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

	addCircle(pos, radius, popup) {
		let circle =
			L.circle(pos,
				radius*1.5,
				{color: 'lightgrey', fillColor: 'lightblue', fillOpacity: 0.4}
			);
		if( popup != "" )
			circle.bindPopup(popup);
		return circle;
	}
	
}

/* FUNCTIONS for HTML */

function onLoad()
{
	map = new Map(MAP_CENTRE, 12);
	map.addCircle(MAP_CENTRE, 100, "FCT/UNL");
	allOrderChecked();
	//document.getElementById('visible_caches').innerHTML = vgs.length;
	function sumVGs() {
		let sum = 0;
		map.countByOrder.forEach(e => {
			sum += e;
		});
		return sum;
	};
	document.getElementById('total_caches').innerHTML = sumVGs();
	document.getElementById('visible_caches').innerHTML = sumVGs();
	document.getElementById('highest_vg').innerHTML = map.highestVG.name;
	document.getElementById('lowest_vg').innerHTML = map.lowestVG.name;
	
}

function checkboxUpdate(document){
	let orderStr = document.id;
	let order = parseInt(orderStr.slice(5));
	let orderGroup = null;
	let sum = 0;

	let span_content = this.document.getElementById('visible_caches');
	switch (order){
			case 1: 
				orderGroup = map.order1_layerGroup;
				sum = map.countByOrder[0];
			break;
			case 2: 
				orderGroup = map.order2_layerGroup;
				sum = map.countByOrder[1];
			break;
			case 3:
				orderGroup = map.order3_layerGroup;
				sum = map.countByOrder[2];
			break;
			case 4: 
				orderGroup = map.order4_layerGroup;
				sum = map.countByOrder[3];
			break;
		}

		if(document.checked){
			map.clusteringVgs.addLayer(orderGroup);
			span_content.innerHTML = parseInt(span_content.innerHTML) + sum;
		}else{
			map.clusteringVgs.removeLayer(orderGroup);
			span_content.innerHTML = parseInt(span_content.innerHTML) - sum;
		}
	map.getAltitudeCircles();
}

function allOrderChecked() {
	VG_ORDERS.forEach(order => {
		document.getElementById(order).checked = true;
	});
}

function alertInvalidVGs() {
	alert("Ordem 1: " + calculateDistance(1, 30, 60) + 
	"\nOrdem 2: " + calculateDistance(2, 20, 40) +
	"\nOrdem 3: " + calculateDistance(3, 5, 10))
}

function calculateDistance(orderNumber, leftLimit, rightLimit) {
	//percorrer o layer
	let invalid = [];
	for(let i = 0; i < map.vgs.length; i++){
		let isValid = 0;
		if(parseInt(map.vgs[i].order) == orderNumber){
		for(let j = i; j < map.vgs.length; j++){
			if (parseInt(map.vgs[j].order) == orderNumber){
			let distance = haversine(map.vgs[i].latitude, map.vgs[i].longitude, map.vgs[j].latitude, map.vgs[j].longitude);
			if ((distance != 0) && (distance >= leftLimit) && (distance <= rightLimit)){
				isValid = 1;
				break;
				}
			}
		}
		if (isValid == 0) invalid.push(map.vgs[i].name);
		}
	}
	if (invalid.length == 0) invalid.push("Vazio");
	return invalid;
}

function showAltitude(){
	map.lmap.on('click', function() {map.removeCircles();});
	map.altitudeCircles.addTo(map.lmap);
	
}

function openStreets(lat, long){
    let query = "http://maps.google.com/maps?q=&layer=c&cbll=";
    document.location = query + lat + "," + long;
}

