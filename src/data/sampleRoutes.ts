import { Tour, MapLayerConfig } from '../types';

const envToken = typeof import.meta !== 'undefined' && (import.meta as any).env ? (import.meta as any).env.VITE_MAPBOX_TOKEN : undefined;
const MAPBOX_ACCESS_TOKEN = envToken || 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3ifQ.rJcFIG214AriISLbB6B5aw';

export const MAP_LAYERS: MapLayerConfig[] = [
  {
    id: 'mapbox-standard',
    name: 'Mapbox Standard (Klassisch & Vektorklar)',
    category: 'base',
    url: `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/256/{z}/{x}/{y}?access_token=${MAPBOX_ACCESS_TOKEN}`,
    subdomains: [],
    attribution: '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 22,
    maxNativeZoom: 19,
    minZoom: 2,
    description: 'Offizielle Mapbox Standard-Karte mit gestochen scharfem Vektordesign und klaren Straßen & Pfaden.'
  },
  {
    id: 'mapbox-outdoors',
    name: 'Mapbox Outdoors (Topografie & Höhenlinien)',
    category: 'base',
    url: `https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/tiles/256/{z}/{x}/{y}?access_token=${MAPBOX_ACCESS_TOKEN}`,
    subdomains: [],
    attribution: '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 22,
    maxNativeZoom: 19,
    minZoom: 2,
    description: 'Spezialisierter Mapbox Outdoor-Stil mit Reliefschattierung, Höhenlinien und ausgewiesenen Wanderwegen.'
  },
  {
    id: 'carto-voyager',
    name: 'CartoDB Voyager (Blitzschneller Vektor-Stil)',
    category: 'base',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
    subdomains: ['a', 'b', 'c', 'd'],
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 20,
    maxNativeZoom: 19,
    minZoom: 2,
    description: 'Moderne, superschnell geladene Vektor-Rasterkarte mit klaren Höhenwegen und Konturen.'
  },
  {
    id: 'esri-topo',
    name: 'Esri World Topo (HD Topografie & Geländehöhen)',
    category: 'base',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    subdomains: [],
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, IGN, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community',
    maxZoom: 20,
    maxNativeZoom: 18,
    minZoom: 2,
    description: 'Globales schnelles Esri-Toponetz mit präzisem Geländerelief und Berghütten.'
  },
  {
    id: 'maperitive-topo',
    name: 'Maperitive Hiking Topo (Alpine Vektor- & Wanderkarte)',
    category: 'base',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    subdomains: ['a', 'b', 'c'],
    attribution: '&copy; Maperitive / OpenTopoMap & OpenStreetMap contributors',
    maxZoom: 19,
    maxNativeZoom: 17,
    minZoom: 3,
    description: 'Spezialisierter Maperitive-Outdoorstil mit plastischer Schattierung, Höhenlinien, Hütten & SAC-Wanderwegen.'
  },
  {
    id: 'opentopo',
    name: 'OpenTopoMap (Klassische Höhenlinien)',
    category: 'base',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    subdomains: ['a', 'b', 'c'],
    attribution: 'Kartendaten: &copy; <a href="https://openstreetmap.org">OpenStreetMap</a>, SRTM | Darstellung: &copy; <a href="http://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)',
    maxZoom: 18,
    maxNativeZoom: 17,
    minZoom: 3,
    description: 'Traditionelles topografisches Relief mit detaillierten Höhenmetern.'
  },
  {
    id: 'carto-positron',
    name: 'CartoDB Positron (Hell & Kontrastreich)',
    category: 'base',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
    subdomains: ['a', 'b', 'c', 'd'],
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 20,
    maxNativeZoom: 19,
    minZoom: 2,
    description: 'Maximale Ladegeschwindigkeit und hoher Kontrast für Routen.'
  },
  {
    id: 'cyclosm',
    name: 'CyclOSM / Outdoor',
    category: 'base',
    url: 'https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
    subdomains: ['a', 'b', 'c'],
    attribution: '&copy; <a href="https://www.cyclosm.org">CyclOSM</a> & OpenStreetMap',
    maxZoom: 19,
    maxNativeZoom: 18,
    minZoom: 3,
    description: 'Hervorragende Lesbarkeit für Rad- & Wandertouren mit Oberflächenangaben.'
  },
  {
    id: 'esri-sat',
    name: 'Esri Luftbild (HD Satellit)',
    category: 'base',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    subdomains: [],
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 20,
    maxNativeZoom: 18,
    minZoom: 3,
    description: 'Echte HD-Satellitenaufnahmen zur optischen Erkundung des Terrains.'
  },
  {
    id: 'waymarked-hiking',
    name: 'Wanderwege-Overlay (Waymarked Trails)',
    category: 'overlay',
    url: 'https://tile.waymarkedtrails.org/hiking/{z}/{x}/{y}.png',
    subdomains: ['a', 'b', 'c'],
    attribution: '&copy; <a href="https://hiking.waymarkedtrails.org">Waymarked Trails</a>',
    maxZoom: 19,
    maxNativeZoom: 17,
    minZoom: 3,
    description: 'Farbige Hervorhebung markierter lokaler und Fernwanderwege.'
  }
];

export const SAMPLE_TOURS: Tour[] = [
  {
    id: 'eibsee-zugspitze',
    title: 'Eibsee-Rundweg & Zugspitz-Blick',
    region: 'Bayerische Alpen / Garmisch',
    difficulty: 'Einfach',
    distanceKm: 7.4,
    ascentM: 120,
    descentM: 120,
    estimatedHours: 2.2,
    description: 'Malerischer Rundweg um den kristallklaren Eibsee direkt am Fuße der Zugspitze. Traumhafte Ausblicke auf das Zugspitzmassiv und kleine Inseln.',
    waypoints: [
      {
        id: 'wp-e1',
        name: 'Eibsee Seegarten (Start/Ziel)',
        category: 'parking',
        lat: 47.4578,
        lng: 10.9931,
        ele: 975,
        description: 'Großer Wanderparkplatz und Seerestaurant Eibsee.'
      },
      {
        id: 'wp-e2',
        name: 'Aussichtspunkt Braxe',
        category: 'viewpoint',
        lat: 47.4599,
        lng: 10.9754,
        ele: 980,
        description: 'Freier Blick auf die Insel Braxe und die Zugspitz-Nordwand.'
      },
      {
        id: 'wp-e3',
        name: 'Kotbach-Brücke',
        category: 'water',
        lat: 47.4532,
        lng: 10.9688,
        ele: 978,
        description: 'Idyllischer Gebirgsbachlauf mit Trinkwasserqualität.'
      },
      {
        id: 'wp-e4',
        name: 'Unterstand Eibsee-Nordost',
        category: 'hut',
        lat: 47.4615,
        lng: 10.9855,
        ele: 982,
        description: 'Überdachte Schutzhütte mit Bänken.'
      }
    ],
    coordinates: [
      { lat: 47.4578, lng: 10.9931, ele: 975 },
      { lat: 47.4592, lng: 10.9902, ele: 977 },
      { lat: 47.4610, lng: 10.9850, ele: 982 },
      { lat: 47.4618, lng: 10.9790, ele: 981 },
      { lat: 47.4605, lng: 10.9740, ele: 979 },
      { lat: 47.4570, lng: 10.9690, ele: 977 },
      { lat: 47.4532, lng: 10.9688, ele: 978 },
      { lat: 47.4505, lng: 10.9735, ele: 985 },
      { lat: 47.4490, lng: 10.9810, ele: 990 },
      { lat: 47.4520, lng: 10.9880, ele: 980 },
      { lat: 47.4555, lng: 10.9920, ele: 976 },
      { lat: 47.4578, lng: 10.9931, ele: 975 }
    ]
  },
  {
    id: 'watzmann-kuehroint',
    title: 'Watzmann-Alm & Kühroint-Hütte',
    region: 'Berchtesgadener Alpen',
    difficulty: 'Mittel',
    distanceKm: 12.8,
    ascentM: 840,
    descentM: 840,
    estimatedHours: 4.5,
    description: 'Anspruchsvolle Bergwanderung von Hammerstiel über die Schappbachalm zur Kührointhütte unter der imposanten Watzmann-Ostwand.',
    waypoints: [
      {
        id: 'wp-w1',
        name: 'Parkplatz Hammerstiel',
        category: 'parking',
        lat: 47.5954,
        lng: 12.9612,
        ele: 760,
        description: 'Gebührenpflichtiger Wanderparkplatz Schönau am Königssee.'
      },
      {
        id: 'wp-w2',
        name: 'Schappbachalm',
        category: 'hut',
        lat: 47.5750,
        lng: 12.9480,
        ele: 1070,
        description: 'Gemütliche Rastgelegenheit im Schappbachtal.'
      },
      {
        id: 'wp-w3',
        name: 'Kührointhütte (1.420m)',
        category: 'hut',
        lat: 47.5622,
        lng: 12.9430,
        ele: 1420,
        description: 'Bewirtschaftete Hütte mit grandioser Aussicht auf Kleinen Watzmann.'
      },
      {
        id: 'wp-w4',
        name: 'Aussichtspunkt Archenkanzel',
        category: 'viewpoint',
        lat: 47.5580,
        lng: 12.9560,
        ele: 1340,
        description: 'Spektakulärer Tiefblick auf den smaragdgrünen Königssee und St. Bartholomä.'
      }
    ],
    coordinates: [
      { lat: 47.5954, lng: 12.9612, ele: 760 },
      { lat: 47.5890, lng: 12.9580, ele: 850 },
      { lat: 47.5820, lng: 12.9530, ele: 960 },
      { lat: 47.5750, lng: 12.9480, ele: 1070 },
      { lat: 47.5690, lng: 12.9450, ele: 1220 },
      { lat: 47.5622, lng: 12.9430, ele: 1420 },
      { lat: 47.5580, lng: 12.9560, ele: 1340 },
      { lat: 47.5640, lng: 12.9620, ele: 1150 },
      { lat: 47.5780, lng: 12.9650, ele: 920 },
      { lat: 47.5954, lng: 12.9612, ele: 760 }
    ]
  },
  {
    id: 'bastei-schwedenloecher',
    title: 'Basteibrücke & Schwedenlöcher Schluchtenweg',
    region: 'Sächsische Schweiz / Rathen',
    difficulty: 'Mittel',
    distanceKm: 8.6,
    ascentM: 340,
    descentM: 340,
    estimatedHours: 3.0,
    description: 'Atemberaubende Sandstein-Felsenlandschaft mit der berühmten Basteibrücke, dem Amselsee und den engen Klammen der Schwedenlöcher.',
    waypoints: [
      {
        id: 'wp-b1',
        name: 'Kurort Rathen Fährstelle',
        category: 'parking',
        lat: 50.9575,
        lng: 14.0788,
        ele: 125,
        description: 'Startpunkt an der Elbefähre Rathen.'
      },
      {
        id: 'wp-b2',
        name: 'Basteibrücke ( Aussicht )',
        category: 'viewpoint',
        lat: 50.9623,
        lng: 14.0718,
        ele: 305,
        description: 'Historische Steinbrücke über der Elbe.'
      },
      {
        id: 'wp-b3',
        name: 'Felsenburg Neurathen',
        category: 'info',
        lat: 50.9615,
        lng: 14.0735,
        ele: 290,
        description: 'Mittelalterliche Burganlage in den Sandsteinfelsen.'
      },
      {
        id: 'wp-b4',
        name: 'Schwedenlöcher Schlucht',
        category: 'danger',
        lat: 50.9650,
        lng: 14.0780,
        ele: 210,
        description: 'Schmale Stufen-Schlucht zwischen überhängenden Felswänden.'
      },
      {
        id: 'wp-b5',
        name: 'Amselsee Bootsstation',
        category: 'water',
        lat: 50.9620,
        lng: 14.0840,
        ele: 140,
        description: 'Malerischer Stausee mit Ruderbootverleih.'
      }
    ],
    coordinates: [
      { lat: 50.9575, lng: 14.0788, ele: 125 },
      { lat: 50.9592, lng: 14.0750, ele: 190 },
      { lat: 50.9623, lng: 14.0718, ele: 305 },
      { lat: 50.9615, lng: 14.0735, ele: 290 },
      { lat: 50.9642, lng: 14.0740, ele: 280 },
      { lat: 50.9650, lng: 14.0780, ele: 210 },
      { lat: 50.9665, lng: 14.0830, ele: 155 },
      { lat: 50.9620, lng: 14.0840, ele: 140 },
      { lat: 50.9585, lng: 14.0815, ele: 130 },
      { lat: 50.9575, lng: 14.0788, ele: 125 }
    ]
  },
  {
    id: 'brocken-goetheweg',
    title: 'Brockensturm via Goetheweg',
    region: 'Nationalpark Harz / Torfhaus',
    difficulty: 'Mittel',
    distanceKm: 16.2,
    ascentM: 420,
    descentM: 420,
    estimatedHours: 5.0,
    description: 'Der Klassiker im Harz: Von Torfhaus entlang des Reitstieg und Goethewegs durch das Moor hinauf auf den Brocken (1.141m).',
    waypoints: [
      {
        id: 'wp-br1',
        name: 'Nationalpark-Besucherzentrum Torfhaus',
        category: 'info',
        lat: 51.8028,
        lng: 10.5360,
        ele: 810,
        description: 'Großer Wandererparkplatz und Infostation.'
      },
      {
        id: 'wp-br2',
        name: 'Abbruech-Moorsteg',
        category: 'viewpoint',
        lat: 51.7950,
        lng: 10.5650,
        ele: 830,
        description: 'Holzbohlenweg durch urzeitliches Hochmoor.'
      },
      {
        id: 'wp-br3',
        name: 'Bahnhof Goetheweg (Harzer Schmalspurbahn)',
        category: 'info',
        lat: 51.7890,
        lng: 10.5920,
        ele: 960,
        description: 'Kreuzungspunkt mit der Dampfeisenbahn.'
      },
      {
        id: 'wp-br4',
        name: 'Brockengipfel (1.141m)',
        category: 'peak',
        lat: 51.7991,
        lng: 10.6155,
        ele: 1141,
        description: 'Höchster Punkt Norddeutschlands mit Brockenhaus und Wetterstation.'
      }
    ],
    coordinates: [
      { lat: 51.8028, lng: 10.5360, ele: 810 },
      { lat: 51.7995, lng: 10.5520, ele: 815 },
      { lat: 51.7950, lng: 10.5650, ele: 830 },
      { lat: 51.7905, lng: 10.5800, ele: 880 },
      { lat: 51.7890, lng: 10.5920, ele: 960 },
      { lat: 51.7930, lng: 10.6050, ele: 1060 },
      { lat: 51.7991, lng: 10.6155, ele: 1141 },
      { lat: 51.7980, lng: 10.6000, ele: 1020 },
      { lat: 51.8010, lng: 10.5700, ele: 850 },
      { lat: 51.8028, lng: 10.5360, ele: 810 }
    ]
  },
  {
    id: 'feldberg-steig',
    title: 'Feldberg-Steig & Feldsee',
    region: 'Schwarzwald',
    difficulty: 'Mittel',
    distanceKm: 12.3,
    ascentM: 520,
    descentM: 520,
    estimatedHours: 4.0,
    description: 'Premiumpfad durch das Höchste des Schwarzwalds: Vom Haus der Natur über das Bismarkdenkmal, den Feldberggipfel (1.493m) und den dunklen Karsee Feldsee.',
    waypoints: [
      {
        id: 'wp-f1',
        name: 'Haus der Natur Feldberg',
        category: 'parking',
        lat: 47.8601,
        lng: 8.0360,
        ele: 1280,
        description: 'Startpunkt mit Busstation und Parkhaus.'
      },
      {
        id: 'wp-f2',
        name: 'Bismarckdenkmal & Seebuck',
        category: 'viewpoint',
        lat: 47.8638,
        lng: 8.0210,
        ele: 1448,
        description: 'Aussichtsturm über dem Feldsee.'
      },
      {
        id: 'wp-f3',
        name: 'Feldberggipfel (1.493m)',
        category: 'peak',
        lat: 47.8739,
        lng: 8.0042,
        ele: 1493,
        description: 'Höchster Gipfel Deutschlands außerhalb der Alpen.'
      },
      {
        id: 'wp-f4',
        name: 'St. Wilhelmer Hütte',
        category: 'hut',
        lat: 47.8780,
        lng: 7.9940,
        ele: 1380,
        description: 'Höchstgelegene Almhütte Baden-Württembergs.'
      },
      {
        id: 'wp-f5',
        name: 'Raimartihof am Feldsee',
        category: 'hut',
        lat: 47.8605,
        lng: 8.0425,
        ele: 1120,
        description: 'Traditioneller 300 Jahre alter Gasthof am Carsee.'
      }
    ],
    coordinates: [
      { lat: 47.8601, lng: 8.0360, ele: 1280 },
      { lat: 47.8638, lng: 8.0210, ele: 1448 },
      { lat: 47.8739, lng: 8.0042, ele: 1493 },
      { lat: 47.8780, lng: 7.9940, ele: 1380 },
      { lat: 47.8720, lng: 8.0120, ele: 1310 },
      { lat: 47.8650, lng: 8.0350, ele: 1180 },
      { lat: 47.8605, lng: 8.0425, ele: 1120 },
      { lat: 47.8601, lng: 8.0360, ele: 1280 }
    ]
  }
];
