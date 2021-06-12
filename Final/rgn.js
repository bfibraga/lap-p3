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
			this.getButtomStreet(this.latitude, this.longitude) +
			this.getButtonSameType(this.type) +
			"<br />&nbsp;&nbsp;VG1's Próximos: " + 
			"<SPAN id='total_nearby_VG1s' style='color:black'>"+ this.numOfNearbyVGs +"</b></SPAN>"
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
			//.addTo(this.lmap);
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
		this.showNearbyVG2s = null;
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
		this.showNearbyVG2 = 0;
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

	removeAltitudeCircles(){	
		this.lmap.removeLayer(this.altitudeCircles);
		this.lmap.off('click', function() {this.removeAltitudeCircles()});
		this.stopZoomControl = 1;
		this.showAltitude = 0
	}

	removeNearbyVG2s(){
		this.showNearbyVG2s.remove(this.lmap)
		this.lmap.off('click', function() {this.removeNearbyVG2s()})
		this.stopZoomControl = 1;
		this.showNearbyVG2s = 0;
	}

	addVisibleVGS(order){
		let vgs = []
		for(let i = 0; i < this.vgs.length; i++){
			if (this.visibleVGS.includes(this.vgs[i]) || parseInt(this.vgs[i].order) == order) vgs.push(this.vgs[i])
		}
		this.visibleVGS = vgs;
		this.getAltitudeCircles();
	}

	removeVisibleVGS(order){
		let vgs = []
		for(let i = 0; i < this.vgs.length; i++){
			if (parseInt(this.vgs[i].order) != order) vgs.push(this.vgs[i])
		}
		this.visibleVGS = vgs;
		this.getAltitudeCircles();
	}

	removeSameTypeCircles(){
		this.sameTypeCircles.remove(this.lmap)
		this.lmap.off('click', function() {this.removeSameTypeCircles()});
		this.stopZoomControl = 1;
		this.showSameType = 0;
	}

	getNearbyVGs(lat, long, vgs){
		let sum = 0
		for (let i = 0; i < vgs.length; i++){
			
				let distance = haversine(lat, long, vgs[i].latitude, vgs[i].longitude)
				if (distance != 0 && distance <= 30)
				sum++;
			
		}
		return sum;
	}

	getAltitudeCircles(){
		let circles = L.layerGroup();
		for(let pos = 0; pos < this.visibleVGS.length; pos++){
			if (this.clusteringVgs.hasLayer(this.visibleVGS[pos].marker)){
				let alt = Number(this.visibleVGS[pos].altitude);
				if (Number.isNaN(alt)) alt = 0;
				circles.addLayer(this.addCircle([this.visibleVGS[pos].latitude,
					 this.visibleVGS[pos].longitude], alt ,'orange', 'darkblue', "Altitude: " + alt));
				}	
			}
		
		this.altitudeCircles = circles;
		
	}

	zoomControl(){
		if(this.stopZoomControl == 0) {
		let zoomLevel = this.lmap.getZoom()	
		if (zoomLevel < 15 ) {
			if(this.showAltitude == 1) this.lmap.removeLayer(this.altitudeCircles)
			if(this.showNearbyVG2s == 1) this.lmap.removeLayer(this.showNearbyVG2s)
			if(this.showSameType == 1) this.lmap.removeLayer(this.sameTypeCircles)
		}

			else {
				if(this.showAltitude == 1) this.lmap.addLayer(this.altitudeCircles)
				if(this.showNearbyVG2s == 1) this.lmap.addLayer(this.showNearbyVG2s)
				if(this.showSameType == 1) this.lmap.addLayer(this.sameTypeCircles)
			}
		}
	}

	
}

/* FUNCTIONS for HTML */

function onLoad()
{
	map = new Map(MAP_CENTRE, 12);
	map.addCircle(MAP_CENTRE, 100,'yellow', 'orange', "FCT/UNL");
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
	for(let i = 1; i <= VG_ORDERS.length; i++){
		document.getElementById('amount_VG'+ i + 's').innerHTML = map.countByOrder[i-1];
	}
	
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
			map.addVisibleVGS(order);
		}else{
			map.clusteringVgs.removeLayer(orderGroup);
			span_content.innerHTML = parseInt(span_content.innerHTML) - sum;
			map.removeVisibleVGS(order);
		}
	if(map.lmap.hasLayer(map.altitudeCircles)){
		map.removeAltitudeCircles();
		map.getAltitudeCircles();
		showAltitude()}
	if(map.lmap.hasLayer(map.showNearbyVG2s)) showNearbyVG2s(map.lastUsedLat, map.lastUsedLong)
	if(map.lmap.hasLayer(map.sameTypeCircles)) circleSameType(map.lastUsedType)
	
}

function allOrderChecked() {
	VG_ORDERS.forEach(order => {
		document.getElementById(order).checked = true;
	});
}

function alertInvalidVGs() {
	alert("VGs Inválidos\nOrdem 1: " + calculateDistance(1, 30, 60) + 
	"\nOrdem 2: " + calculateDistance(2, 20, 30) +
	"\nOrdem 3: " + calculateDistance(3, 5, 10))
}

function calculateDistance(orderNumber, leftLimit, rightLimit) {
	//percorrer o layer
	let invalid = [];
	for(let i = 0; i < map.vgs.length; i++){
		let isValid = 0;
		let lat1 = map.vgs[i].latitude;
		let long1 = map.vgs[i].longitude;
		let distance;
		if(parseInt(map.vgs[i].order) == orderNumber){
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
		//alert(distance + " " + map.vgs[i].name)
		if (isValid == 0) {
			invalid.push(map.vgs[i].name);}
		}
	}
	if (invalid.length == 0) invalid.push("Vazio");
	return invalid;
}

function showAltitude(){
	map.altitudeCircles.addTo(map.lmap);
	map.lmap.on('click', function() {map.removeAltitudeCircles()});
	map.lmap.on('zoomend', function() {map.zoomControl();});
	map.stopZoomControl = 0;
	map.showAltitude = 1;
}

function openStreets(lat, long){
    let query = "http://maps.google.com/maps?q=&layer=c&cbll=";
    document.location = query + lat + "," + long;
}

function circleSameType(type){
	
	
	let circles = L.layerGroup();
	for(let i = 0; i < map.visibleVGS.length; i++){
		if (map.visibleVGS[i].type === type){
			let lat = map.visibleVGS[i].latitude;
			let long = map.visibleVGS[i].longitude;
			circles.addLayer(map.addCircle([lat, long],100,'lime', 'darkGreen', "Tipo: " + type))
		}
	}
	if(map.sameTypeCircles != null)
	map.lmap.removeLayer(map.sameTypeCircles);
	map.sameTypeCircles = circles;
	map.sameTypeCircles.addTo(map.lmap);
	map.lastUsedType = type;
	map.lmap.on('click', function() {map.removeSameTypeCircles();});
	map.lmap.on('zoomend', function() {map.zoomControl();})
	map.stopZoomControl = 0;
	map.showSameType = 1;
}

function getNearbyVG2s(lat, long){
	let circles = L.layerGroup();
	for (let i = 0; i < map.visibleVGS.length; i++){
		if (parseInt(map.visibleVGS[i].order) == 2){
			let lat2 = map.visibleVGS[i].latitude;
			let long2 = map.visibleVGS[i].longitude;
			let distance = haversine(lat, long, lat2, long2)
			if (distance != 0 && distance <= 30)
			circles.addLayer(map.addCircle([lat2, long2], 50, 'lightblue', 'darkGreen', "VG2 Proximo do selecionado"))
		}
	}
	if(map.showNearbyVG2s != null)
	map.lmap.removeLayer(map.showNearbyVG2s);
	map.showNearbyVG2s = circles;
	map.showNearbyVG2s.addTo(map.lmap);
	map.lastUsedLat = lat;
	map.lastUsedLong = long;
	map.lmap.on('click', function () {map.removeNearbyVG2s()}) 
	map.lmap.on('zoomend', function() {map.zoomControl();})
	map.stopZoomControl = 0;
	map.showNearbyVG2 = 1;
}

