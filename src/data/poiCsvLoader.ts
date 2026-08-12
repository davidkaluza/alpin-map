import { AlpinePOI, POIType } from '../types';

// Embedded raw CSV string representation for instant synchronous client & server access without network dependencies
export const RAW_TOSCANA_AND_ALPINE_CSV = `id,name,type,categoryLabel,lat,lng,ele,region,description,facilities,openingSeason,capacity,googleMapsUrl
poi-monte-prado,"Monte Prado / Prato (2.054m)",peak,Berggipfel,44.2505,10.4075,2054,"Appennino Tosco-Emiliano / Toskana","Höchster Berggipfel der Toskana an der Grenze zwischen Lucca und Reggio Emilia im Nationalpark Appennino Tosco-Emiliano. Spektakuläre Rundumsicht.","Gipfelkreuz;Nationalparkpfad;Panoramablick",Ganzjährig begehbar,,"https://www.google.com/maps/search/?api=1&query=Monte+Prado+2054m"
poi-monte-pisanino,"Monte Pisanino (1.946m)",peak,Berggipfel,44.1350,10.2195,1946,"Alpi Apuane / Garfagnana (Toskana)","Höchster Gipfel der Apuanischen Alpen (Alpi Apuane) mit steilen Felsflanken und Blick übers Ligurische Meer.","Gipfelsteig;Alpiner Pfad;Aussichtspunkt",Sommer & Frühherbst,,"https://www.google.com/maps/search/?api=1&query=Monte+Pisanino"
poi-pania-della-croce,"Pania della Croce (1.858m)",peak,Berggipfel,44.0378,10.3236,1858,"Alpi Apuane / Toskana","Königin der Apuanischen Alpen (Regina delle Apuane), spektakulärer Panoramagipfel nahe Rifugio Rossi mit Fernsicht bis Korsika.","Gipfelkreuz;Aussichtsplateau;Gipfelbuch",Sommer / Frühling,,"https://www.google.com/maps/search/?api=1&query=Pania+della+Croce"
poi-pizzo-duccello,"Pizzo d'Uccello (1.781m)",peak,Berggipfel,44.1388,10.1783,1781,"Alpi Apuane / Massa-Carrara (Toskana)","Das Matterhorn der Apuanischen Alpen mit einer berühmten 700m hohen Nordwand.","Klettersteig;Alpiner Steig;Aussichtspunkt",Juni – Oktober,,"https://www.google.com/maps/search/?api=1&query=Pizzo+dUccello"
poi-monte-tambura,"Monte Tambura (1.895m)",peak,Berggipfel,44.1033,10.2292,1895,"Alpi Apuane / Toskana","Zweithöchster Gipfel der Apuanischen Alpen. Historischer Vandelli-Passweg führt über die Flanke.","Vandelli-Pfad;Gipfelgrat;Panorama",Frühjahr – Herbst,,"https://www.google.com/maps/search/?api=1&query=Monte+Tambura"
poi-monte-sagro,"Monte Sagro (1.749m)",peak,Berggipfel,44.1205,10.1260,1749,"Marmor-Alpen / Carrara (Toskana)","Direkt über den berühmten Marmorbrüchen von Carrara gelegen mit freiem Blick auf das Mittelmeer.","Marmor-Panoramen;Aussichtspunkt",Ganzjährig,,"https://www.google.com/maps/search/?api=1&query=Monte+Sagro"
poi-monte-forato,"Monte Forato (1.230m)",peak,Naturwunder / Felsbogen,44.0202,10.3340,1230,"Alpi Apuane / Stazzema (Toskana)","Weltberühmter natürlicher Felsbogen in den Apuanischen Alpen. Die Sonne geht zweimal im Jahr exakt durch das Felsloch unter.","Naturfelsbogen;Rundweg;Fotospot",Ganzjährig,,"https://www.google.com/maps/search/?api=1&query=Monte+Forato"
poi-rifugio-rossi,"Rifugio Enrico Rossi alla Pania (1.609m)",refugio,"Schutzhütte (CAI)",44.0436,10.3275,1609,"Pania della Croce / Alpi Apuane (Toskana)","Historisches Refugio des CAI Lucca mitten im Herz der Apuanischen Alpen nahe der Pania della Croce.","Toscana-Küche;Übernachtung;Notfallfunk",Sommer & Wochenenden im Winter,22 Schlafplätze,"https://www.google.com/maps/search/?api=1&query=Rifugio+Enrico+Rossi+alla+Pania"
poi-rifugio-carrara,"Rifugio Carrara - Campocecina (1.320m)",refugio,"Schutzhütte (CAI)",44.1102,10.0880,1320,"Campocecina / Marmor-Alpen (Toskana)","Refugio des CAI Carrara auf der Hochebene von Campocecina mit spektakulärem Meerblick auf den Golf von La Spezia.","Toskanische Spezialitäten;Marmor-Blick;Familienfreundlich",Ganzjährig geöffnet,36 Betten,"https://www.google.com/maps/search/?api=1&query=Rifugio+Carrara+Campocecina"
poi-rifugio-donegani,"Rifugio Val Serenaia / Donegani (1.150m)",refugio,Schutzhütte / Refugio,44.1485,10.2105,1150,"Val Serenaia / Minucciano (Toskana)","Ausgangspunkt für Besteigungen von Monte Pisanino und Pizzo d'Uccello im apuanischen Tal Val Serenaia.","Garfagnana-Küche;Parkplatz;Klettergarten",Mai – Oktober,40 Schlafplätze,"https://www.google.com/maps/search/?api=1&query=Rifugio+Donegani"
poi-rifugio-orto-di-donna,"Rifugio Orto di Donna (1.500m)",refugio,"Schutzhütte (CAI)",44.1412,10.2052,1500,"Val Serenaia / Alpi Apuane","Moderne Berghütte in einem der spektakulärsten Zirkustäler der Apuanischen Alpen.","Hüttenessen;Warmwasser;Terrasse",Juni – September,30 Schlafplätze,"https://www.google.com/maps/search/?api=1&query=Rifugio+Orto+di+Donna"
poi-rifugio-del-freo,"Rifugio Guelfo Del Freo (1.180m)",refugio,"Schutzhütte (CAI)",44.0322,10.2988,1180,"Mosceta / Alpi Apuane (Toskana)","Wunderschöne CAI-Schutzhütte auf der Mosceta-Wiese am Fuß der Pania della Croce.","Bewirtschaftet;Schlafplätze;Quellwasser",Mai – Oktober,48 Betten,"https://www.google.com/maps/search/?api=1&query=Rifugio+Guelfo+Del+Freo"
poi-rifugio-puliti,"Rifugio Adelmo Puliti (1.010m)",refugio,"Schutzhütte (CAI)",44.0620,10.2640,1010,"Arni / Stazzema (Toskana)","Schutzhütte im malerischen Dorf Arni mit Blick auf die apuanischen Gipfel.","Toskanischer Wein;Gemütliche Stube",Mai – November,20 Betten,"https://www.google.com/maps/search/?api=1&query=Rifugio+Adelmo+Puliti"
poi-rifugio-alto-matanna,"Rifugio Alto Matanna (1.030m)",refugio,"Schutzhütte (CAI)",43.9961,10.3375,1030,"Alpi Apuane / Stazzema (Toskana)","Historische Schutzhütte und Berggasthof direkt unter den imposanten Felswänden von Monte Nona und Monte Matanna.","Schlafplätze;Restaurant;Terrasse;Parkplatz",Ganzjährig geöffnet,35 Betten,"https://www.google.com/maps/search/?api=1&query=Rifugio+Alto+Matanna"
poi-rifugio-forte-dei-marmi,"Rifugio Forte dei Marmi (865m)",refugio,"Schutzhütte (CAI)",43.9875,10.3325,865,"Alpi Apuane / Stazzema (Toskana)","Malerische CAI-Schutzhütte unter den spektakulären Klettertürmen des Monte Procinto.","Übernachtung;CAI-Küche;Blick aufs Meer",Mai – Oktober,25 Schlafplätze,"https://www.google.com/maps/search/?api=1&query=Rifugio+Forte+dei+Marmi"
poi-rifugio-nello-conti,"Rifugio Nello Conti - Resceto (1.442m)",refugio,"Schutzhütte (CAI)",44.1015,10.2310,1442,"Alpi Apuane / Resceto (Toskana)","Alpines Schutzhaus des CAI Massa am historischen Vandelli-Passweg nahe Monte Tambura.","Panorama-Terrasse;Speisen;Matratzenlager",Sommer & Wochenenden,24 Betten,"https://www.google.com/maps/search/?api=1&query=Rifugio+Nello+Conti"
poi-rifugio-buca-del-fiore,"Rifugio Buca del Fiore (950m)",refugio,Schutzhütte,44.0820,10.3150,950,"Alpi Apuane / Pescaglia (Toskana)","Romantisch gelegenes Schutzhaus im Buchenwald nahe den Apuanischen Höhlenwelten.","Rastplatz;Quellbrunnen;Übernachtung",Mai – Oktober,16 Betten,"https://www.google.com/maps/search/?api=1&query=Rifugio+Buca+del+Fiore"
poi-monte-amiata,"Monte Amiata (1.738m)",peak,Vulkangipfel,42.8875,11.6261,1738,"Südtoskana / Grosseto-Siena","Erloschener Vulkankegel in der Südtoskana, der höchste Berg südlich des Apennin mit monumentalem Eisenkreuz am Gipfel.","Gipfelkreuz;Skipisten;Buchenurwald;Gastronomie",Ganzjährig,,"https://www.google.com/maps/search/?api=1&query=Monte+Amiata"
poi-rifugio-cantore,"Rifugio Cantore - Monte Amiata (1.415m)",refugio,Schutzhütte / Berggasthof,42.8940,11.6275,1415,"Monte Amiata (Toskana)","Gemütliche Schutzhütte am Berghang des Monte Amiata inmitten uralter Kastanien- und Buchenwälder.","Toskanische Trüffelgerichte;Kamin;Übernachtung",Ganzjährig,30 Betten,"https://www.google.com/maps/search/?api=1&query=Rifugio+Cantore+Monte+Amiata"
poi-rifugio-general-cantore,"Rifugio General Cantore Abbadia (1.390m)",refugio,Schutzhütte,42.8910,11.6310,1390,"Monte Amiata (Toskana)","Berghütte an den Wanderwegen des Monte Amiata nahe Abbadia San Salvatore.","Kastanienspezialitäten;Rastplatz",Ganzjährig,,"https://www.google.com/maps/search/?api=1&query=Rifugio+General+Cantore"
poi-monte-capanne,"Monte Capanne (1.019m)",peak,Inselgipfel,42.7667,10.1667,1019,"Insel Elba (Toskana)","Höchster Berg der Insel Elba und des toskanischen Archipels mit 360-Grad-Panorama auf Korsika und das Festland.","Gondelbahn;Panoramagipfel;Wanderwege",Ganzjährig,,"https://www.google.com/maps/search/?api=1&query=Monte+Capanne+Elba"
poi-monte-giovo,"Monte Giovo (1.991m)",peak,Berggipfel,44.1330,10.5920,1991,"Appennino Modenese / Lucca (Toskana)","Imposanter Apennin-Gipfel mit dem Gletscherkar Lago Santo Parmense an seinen Füßen.","Karsee-Blick;Gipfelgrat",Mai – November,,"https://www.google.com/maps/search/?api=1&query=Monte+Giovo"
poi-monte-rondenara,"Monte Rondinaio (1.964m)",peak,Berggipfel,44.1280,10.6120,1964,"Garfagnana / Apennin (Toskana)","Mächtiger Felsberg nahe dem Bergsee Lago Baccio.","Fernsicht;Gipfelkreuz",Juni – Oktober,,"https://www.google.com/maps/search/?api=1&query=Monte+Rondinaio"
poi-rifugio-vittorio-baratozzi,"Rifugio Vittoria - Lago Santo (1.501m)",refugio,Schutzhütte,44.1380,10.5780,1501,"Lago Santo / Lucca (Toskana)","Traditionsreiche Schutzhütte direkt am kristallklaren Bergsee Lago Santo Garfagnino.","Seeufer-Terrasse;Polenta & Pilze;Schlafplätze",Ganzjährig geöffnet,25 Betten,"https://www.google.com/maps/search/?api=1&query=Rifugio+Vittoria+Lago+Santo"
poi-monte-cimone,"Monte Cimone (2.165m)",peak,Berggipfel,44.1936,10.7000,2165,"Grenze Toskana / Emilia-Romagna","Höchster Gipfel des Nördlichen Apennin direkt an der toskanischen Grenze nahe Abetone.","Wetterobservatorium;Panorama-Fernblick;Gipfelpfad",Ganzjährig,,"https://www.google.com/maps/search/?api=1&query=Monte+Cimone"
poi-rifugio-scaffaiolo,"Rifugio Duca degli Abruzzi - Lago Scaffaiolo (1.787m)",refugio,"Schutzhütte (CAI)",44.1195,10.8033,1787,"Passo della Calabaia / Toskana-Emilia","Ältestes Schutzhaus im Apennin (1902 erbaut) direkt am Ufer des Bergsees Lago Scaffaiolo nahe Abetone.","Bergsee-Blick;Toskanische Suppen;Trockenraum",Ganzjährig geöffnet,40 Schlafplätze,"https://www.google.com/maps/search/?api=1&query=Rifugio+Duca+degli+Abruzzi+Lago+Scaffaiolo"
poi-zugspitze,"Zugspitze (2.962m)",peak,Berggipfel,47.4211,10.9853,2962,"Wettersteingebirge / Bayern-Tirol","Höchster Berg Deutschlands mit vergoldetem Gipfelkreuz und Blick auf 4 Länder.","Gipfelkreuz;Seilbahn;Panorama-Restaurant",Ganzjährig,,"https://www.google.com/maps/search/?api=1&query=Zugspitze"
poi-alpspitze,"Alpspitze (2.628m)",peak,Berggipfel,47.4300,11.0472,2628,"Garmisch-Partenkirchen","Wahrzeichen von Garmisch mit der markanten Pyramidenform und AlpspiX Aussichtsplattform.","AlpspiX Aussichtsplattform;Klettersteig",Juni – Oktober,,"https://www.google.com/maps/search/?api=1&query=Alpspitze"
poi-muenchner-haus,"Münchner Haus (2.959m)",refugio,"Schutzhütte (DAV)",47.4210,10.9850,2959,"Zugspitzgipfel / Wetterstein","Höchstgelegene Schutzhütte Deutschlands direkt unterhalb des Zugspitzgipfels.","DAV-Küche;Schlafplätze;Meterologisches Observatorium",Mai – Oktober,30 Betten,"https://www.google.com/maps/search/?api=1&query=Muenchner+Haus"
poi-knorrhuette,"Knorrhütte (2.052m)",refugio,"Schutzhütte (DAV)",47.4115,11.0118,2052,"Zugspitzplatt / Wetterstein","Traditionelle DAV-Hütte auf dem Zugspitzplatt als wichtige Etappe beim Aufstieg durch das Reintal.","Tiroler Küche;Übernachtung;Terrasse",Juni – Oktober,108 Betten,"https://www.google.com/maps/search/?api=1&query=Knoerrhuette"
poi-watzmann-mittelspitze,"Watzmann Mittelspitze (2.713m)",peak,Berggipfel,47.5543,12.9221,2713,"Berchtesgadener Alpen","Höchster Gipfel des Watzmann-Massivs und eines der spektakulärsten Bergmassive der Ostalpen.","Gipfelkreuz;Watzmann-Überschreitung",Juni – Oktober,,"https://www.google.com/maps/search/?api=1&query=Watzmann+Mittelspitze"
poi-watzmannhaus,"Watzmannhaus (1.930m)",refugio,"Schutzhütte (DAV)",47.5645,12.9288,1930,"Watzmann-Nordhang / Berchtesgaden","Mächtiges Schutzhaus des DAV München am Falzköpfl unterhalb der Watzmann-Horts.","Bayrische Gerichte;Matratzenlager;Terrasse",Juni – Oktober,210 Betten,"https://www.google.com/maps/search/?api=1&query=Watzmannhaus"
poi-monte-corchia,"Monte Corchia (1.677m)",peak,Berggipfel,44.0255,10.3112,1677,"Alpi Apuane / Stazzema (Toskana)","Spektakulärer Panoramagipfel mit dem größten Höhlensystem Italiens (Antro del Corchia).","Panoramagipfel;Marmorwege;Höhlensystem",Ganzjährig,,"https://www.google.com/maps/search/?api=1&query=Monte+Corchia"
poi-monte-nona,"Monte Nona (1.297m)",peak,Berggipfel,43.9980,10.3340,1297,"Alpi Apuane / Stazzema","Mächtige Felswand und Aussichtsberg direkt über dem Rifugio Alto Matanna.","Gipfelkreuz;Kletterwand;Aussicht",Ganzjährig,,"https://www.google.com/maps/search/?api=1&query=Monte+Nona"
poi-monte-matanna,"Monte Matanna (1.317m)",peak,Berggipfel,43.9920,10.3420,1317,"Alpi Apuane / Lucca (Toskana)","Einer der schönsten Aussichtsberge im Südteil der Apuanischen Alpen mit Blick bis zum Meer.","Gipfelwiese;Rundumblick;Krokusswiesen",Ganzjährig,,"https://www.google.com/maps/search/?api=1&query=Monte+Matanna"
poi-monte-sumbra,"Monte Sumbra (1.765m)",peak,Berggipfel,44.0750,10.2830,1765,"Alpi Apuane / Garfagnana","Imposanter Kalkstock mit einer über 500m hohen Steilwand über dem Turrite-Secca-Tal.","Klettersteig;Alpiner Pfad;Panoramablick",Mai – November,,"https://www.google.com/maps/search/?api=1&query=Monte+Sumbra"
poi-monte-cavallo,"Monte Cavallo (1.888m)",peak,Berggipfel,44.1160,10.2220,1888,"Alpi Apuane (Toskana)","Schmaler Gratgipfel im Hauptkamm der Apuanischen Alpen nahe Val Serenaia.","Gipfelgrat;Fernsicht;Alpinstieg",Sommer & Herbst,,"https://www.google.com/maps/search/?api=1&query=Monte+Cavallo+Apuane"
poi-monte-falco,"Monte Falco (1.658m)",peak,Berggipfel,43.8780,11.7030,1658,"Foreste Casentinesi / Toskana","Höchster Gipfel des Nationalparks Foreste Casentinesi an der Grenze Florenz/Arezzo.","Urwaldpfad;Gipfelplateau;Naturschutzgebiet",Ganzjährig,,"https://www.google.com/maps/search/?api=1&query=Monte+Falco"
poi-monte-falterona,"Monte Falterona (1.654m)",peak,Berggipfel,43.8780,11.6880,1654,"Casentino / Florenz (Toskana)","Berühmter Berg der Toskana; am Hang liegt 'Capo d'Arno', die historische Quelle des Arno-Flusses.","Arno-Quelle;Buchenurwald;Aussichtspunkt",Ganzjährig,,"https://www.google.com/maps/search/?api=1&query=Monte+Falterona"
poi-monte-cusna,"Monte Cusna (2.121m)",peak,Berggipfel,44.2883,10.4000,2121,"Appennino Tosco-Emiliano","Zweithöchster Gipfel des Nördlichen Apennin, bekannt als 'Il Gigante' (Der schlafende Riese).","Gipfelkreuz;Rundblick;Gratwanderung",Mai – November,,"https://www.google.com/maps/search/?api=1&query=Monte+Cusna"
poi-marmolada,"Marmolada - Punta Penia (3.343m)",peak,Berggipfel,46.4344,11.8514,3343,"Dolomiten / Trentino-Südtirol","Die 'Königin der Dolomiten' mit dem größten Gletscher der Dolomiten und höchstem Gipfel.","Gletscher;Gipfelkreuz;Dolomiten-Panorama",Sommer / Alpin,,"https://www.google.com/maps/search/?api=1&query=Marmolada+Punta+Penia"
poi-drei-zinnen,"Drei Zinnen / Tre Cime (2.999m)",peak,Berggipfel,46.6186,12.3083,2999,"Dolomiten / Südtirol","Weltberühmtes Felsmassiv der Sextener Dolomiten und Wahrzeichen der Alpen.","Weltkulturerbe;Kletterwände;Rundweg",Sommer & Herbst,,"https://www.google.com/maps/search/?api=1&query=Drei+Zinnen"
poi-ortler,"Ortler (3.905m)",peak,Berggipfel,46.5083,10.5422,3905,"Südtirol / Vinschgau","Höchster Berg der historischen Grafschaft Tirol und Ortler-Gruppe mit Eiswänden.","Eisgipfel;Gipfelkreuz;Hochalpine Route",Juni – September,,"https://www.google.com/maps/search/?api=1&query=Ortler"
poi-großglockner,"Großglockner (3.798m)",peak,Berggipfel,47.0742,12.6947,3798,"Hohe Tauern / Österreich","Höchster Berg Österreichs mit der berühmten Pallavicini-Rinne und der Pasterze.","Gipfelkreuz;Gletscher;Alpin-Klassiker",Juni – September,,"https://www.google.com/maps/search/?api=1&query=Grossglockner"
poi-matterhorn,"Matterhorn / Cervino (4.478m)",peak,Berggipfel,45.9763,7.6586,4478,"Walliser Alpen / Schweiz-Italien","Der berühmteste Pyramidenberg der Erde an der Grenze zwischen Zermatt und Breuil-Cervinia.","Felspyramide;Gipfelfahne;Alpin-Ikone",Juli – September,,"https://www.google.com/maps/search/?api=1&query=Matterhorn"
poi-mont-blanc,"Mont Blanc / Monte Bianco (4.807m)",peak,Berggipfel,45.8326,6.8652,4807,"Westalpen / Italien-Frankreich","Der höchste Gipfel der gesamten Alpen und Westeuropas mit ewiger Eiskuppel.","Gletschereis;Dach der Alpen;Hochalpin",Sommer,,"https://www.google.com/maps/search/?api=1&query=Mont+Blanc"`;

export function parsePOICsv(csvContent: string): AlpinePOI[] {
  const lines = csvContent.trim().split('\n');
  if (lines.length <= 1) return [];

  const results: AlpinePOI[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Simple robust regex CSV line splitter supporting quoted values
    const regex = /(?:^|,)(?:"([^"]*)"|([^,]*))/g;
    const matches: string[] = [];
    let match: RegExpExecArray | null;

    while ((match = regex.exec(line))) {
      // Group 1 is quoted, Group 2 is unquoted
      let val = match[1] !== undefined ? match[1] : match[2];
      if (val === undefined) val = '';
      matches.push(val.trim());
    }

    if (matches.length >= 8) {
      const [
        id,
        name,
        typeStr,
        categoryLabel,
        latStr,
        lngStr,
        eleStr,
        region,
        description,
        facilitiesStr,
        openingSeason,
        capacity,
        googleMapsUrl
      ] = matches;

      const lat = parseFloat(latStr) || 0;
      const lng = parseFloat(lngStr) || 0;
      const ele = parseInt(eleStr, 10) || 0;
      const facilities = facilitiesStr ? facilitiesStr.split(';').map((f) => f.trim()).filter(Boolean) : [];

      results.push({
        id: id || `csv-poi-${i}`,
        name: name || 'Gipfel / Schutzhütte',
        type: (typeStr as POIType) || 'peak',
        categoryLabel: categoryLabel || 'Berggipfel',
        lat,
        lng,
        ele,
        region: region || 'Toskana / Alpen',
        description: description || `Wanderziel in der Region ${region || 'Toskana'}.`,
        facilities,
        openingSeason: openingSeason || undefined,
        capacity: capacity || undefined,
        googleMapsUrl: googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`
      });
    }
  }

  return results;
}

export const TOSCANA_AND_ALPINE_CSV_POIS: AlpinePOI[] = parsePOICsv(RAW_TOSCANA_AND_ALPINE_CSV);

/**
 * Searches the CSV table for a POI matching the given query or name/coordinates
 */
export function lookupPOIFromCSV(name: string, region?: string): AlpinePOI | undefined {
  const cleanQuery = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  return TOSCANA_AND_ALPINE_CSV_POIS.find((poi) => {
    const cleanPoiName = poi.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    return cleanPoiName.includes(cleanQuery) || cleanQuery.includes(cleanPoiName);
  });
}
