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
	constructor(xml){
		super(xml)
		this.altitude = getFirstValueByTagName(xml, "altitude");
		this.type = getFirstValueByTagName(xml, "type");
		this.order = getFirstValueByTagName(xml, "order");
	}

}

class VG1 extends VGP {
	constructor(xml){
		super(xml);
	}

}

class VG2 extends VGP {
	constructor(xml){
		super(xml);
	}
}

class VG3 extends VGP {
	constructor(xml){
		super(xml);
	}
}

class VG4 extends VGP {
	constructor(xml){
		super(xml);
	}

}

class VG {
	constructor(xml) {
		this.name = getFirstValueByTagName(xml, "name");
		this.latitude = getFirstValueByTagName(xml, "latitude");
		this.longitude = getFirstValueByTagName(xml, "longitude");
		this.order = getFirstValueByTagName(xml, "order");
		this.altitude = getFirstValueByTagName(xml, "altitude");
		this.type = getFirstValueByTagName(xml, "type");
	}
}


/* MAP */

class Map {
	constructor(center, zoom) {
		//this.markers = [];
		//Group of layers for each order of vg
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
		let vgs = this.loadRGN(RESOURCES_DIR + RGN_FILE_NAME);
		this.populate(icons, vgs);
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

	loadRGN(filename) {
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
					case 1: vgs[i] = new VG1(xs[i]);
					break;
					case 2: vgs[i] = new VG2(xs[i]);
					break;
					case 3: vgs[i] = new VG3(xs[i]);
					break;
					case 4: vgs[i] = new VG4(xs[i]);
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

	populate(icons, vgs)  {
		for(let i = 0 ; i < vgs.length ; i++) {
			switch (parseInt(vgs[i].order)){
				case 1: this.order1_layerGroup.addLayer(this.addMarker(icons, vgs[i]));
				break;
				case 2: this.order2_layerGroup.addLayer(this.addMarker(icons, vgs[i]));
				break;
				case 3: this.order3_layerGroup.addLayer(this.addMarker(icons, vgs[i]));
				break;
				case 4: this.order4_layerGroup.addLayer(this.addMarker(icons, vgs[i]));
				break;
			}
			let pos = parseInt(vgs[i].order) - 1;
			this.countByOrder[pos] = this.countByOrder[pos] + 1;
		}
		this.order1_layerGroup.addTo(this.lmap);
		this.order2_layerGroup.addTo(this.lmap);
		this.order3_layerGroup.addTo(this.lmap);
		this.order4_layerGroup.addTo(this.lmap);
	}

	addMarker(icons, vg) {
		let marker = L.marker([vg.latitude, vg.longitude], {icon: icons['order'+vg.order]});
		//this.markers.push(marker);
		marker
			.bindPopup("Nome do Local: " + vg.name +
			"<br>Ordem: " + vg.order +
			"<br>Tipo: " + vg.type +
			"<br>Latitude: " + vg.latitude + 
			"<br>Longitude: " + vg.longitude + 
			"<br>Altitude: " + vg.altitude
			)
			.bindTooltip(vg.name);
			//.addTo(this.lmap);
		return marker;
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
				radius,
				{color: 'yellow', fillColor: 'orange', fillOpacity: 0.4}
			);
		circle.addTo(this.lmap);
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
	let opacity = document.checked ? 1 : 0;

	let span_content = this.document.getElementById('visible_caches');
	switch (order){
			case 1: 
				if (document.checked) {
					map.order1_layerGroup.addTo(map.lmap);
					span_content.innerHTML = parseInt(span_content.innerHTML) + map.countByOrder[0];
				} else {
					map.order1_layerGroup.remove(map.lmap);
					span_content.innerHTML = parseInt(span_content.innerHTML) - map.countByOrder[0];
				}
			break;
			case 2: 
				if (document.checked) {
					map.order2_layerGroup.addTo(map.lmap);
					span_content.innerHTML = parseInt(span_content.innerHTML) + map.countByOrder[1];
				} else {
					map.order2_layerGroup.remove(map.lmap);
				span_content.innerHTML = parseInt(span_content.innerHTML) - map.countByOrder[1];
				}
			break;
			case 3:
				if (document.checked) {
					map.order3_layerGroup.addTo(map.lmap);
					span_content.innerHTML = parseInt(span_content.innerHTML) + map.countByOrder[2];
				} else {
					map.order3_layerGroup.remove(map.lmap);
					span_content.innerHTML = parseInt(span_content.innerHTML) - map.countByOrder[2];
				}
			break;
			case 4: 
				if (document.checked) {
					map.order4_layerGroup.addTo(map.lmap);
					span_content.innerHTML = parseInt(span_content.innerHTML) + map.countByOrder[3];
				} else {
					map.order4_layerGroup.remove(map.lmap);
					span_content.innerHTML = parseInt(span_content.innerHTML) - map.countByOrder[3];
				}
			break;
		}
}

function allOrderChecked() {
	VG_ORDERS.forEach(order => {
		document.getElementById(order).checked = true;
	});
}

function alertTalefes() {
	let vg_names = calculateTalefes();
	alert("Ordem 1: " + calculateTalefes() + 
	"\nOrdem 2: " + calculateBolembreanosGrandes() +
	"\nOrdem 3: " + calculateBolembreanosMedios());
}

//Ordem 1
function calculateTalefes() {
	//percorrer o layer
	let invalid = [];
	map.order1_layerGroup.eachLayer(function (layer1) {
		let isValid = 0;
		map.order1_layerGroup.eachLayer(function (layer2) {
			let distance = map.lmap.distance(layer1.getLatLng(), layer2.getLatLng());
			if (!layer1.getLatLng().equals(layer2.getLatLng()) && distance >= 30000 && distance <= 60000) {
				isValid = 1;
				return;
			} 
		})
		if (isValid == 0) invalid.push(layer1.getTooltip().toString());
	});

	return invalid;
}

//Ordem 2
function calculateBolembreanosGrandes() {
	//percorrer o layer
	let invalid = [];
	map.order2_layerGroup.eachLayer(function (layer1) {
		let isValid = 0;
		map.order2_layerGroup.eachLayer(function (layer2) {
			let distance = map.lmap.distance(layer1.getLatLng(), layer2.getLatLng());
			if (!layer1.getLatLng().equals(layer2.getLatLng()) && distance >= 20000 && distance <= 30000) {
				isValid = 1;
				return;
			} 
		})
		if (isValid == 0) invalid.push(layer1.getTooltip());
	});

	return invalid;
}

//Ordem 3
function calculateBolembreanosMedios() {
	//percorrer o layer
	let invalid = [];
	map.order3_layerGroup.eachLayer(function (layer1) {
		let isValid = 0;
		map.order3_layerGroup.eachLayer(function (layer2) {
			//Distancia em metros
			let distance = map.lmap.distance(layer1.getLatLng(), layer2.getLatLng());
			if (!layer1.getLatLng().equals(layer2.getLatLng()) && distance >= 5000 && distance <= 10000) {
				isValid = 1;
				return;
			} 
		})
		if (isValid == 0) invalid.push(layer1.getTooltip());
	});

	return invalid;
}