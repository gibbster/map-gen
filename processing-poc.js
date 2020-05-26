let squareSize = 10;
let widthInSquares = 100;
let heightInSquares = 100;
let xSquare, ySquare;

let mapTypeIndex = 0;
let mapTypeArray = ['altitude', 'water', 'waterFlow', 'combined'];
let mapTypes = {
  altitude: [],
  water: [],
  waterFlow: [],
  erosion: [],
}

let colorPalettes = {
  altitude: [
    [0, [0, 0, 0]],
    [25, [25, 25, 25]],
    [37, [37, 37, 37]],
    [50, [50, 50, 50]],
    [62, [62, 62, 62]],
    [75, [75, 75, 75]],
    [87, [87, 87, 87]],
    [100, [100, 100, 100]],
    [112, [112, 112, 112]],
    [125, [125, 125, 125]],
    [137, [137, 137, 137]],
    [150, [150, 150, 150]],
    [162, [162, 162, 162]],
    [200, [200, 200, 200]]
  ],
  water: [
    [0, [0, 0, 0]],
    [5, [10, 10, 50]],
    [10, [20, 20, 100]],
    [15, [30, 30, 150]],
    [20, [40, 40, 200]]
  ],
  waterFlow: [
    [-1000, [50, 50, 250]],
    [-0.10, [40, 40, 200]],
    [-0.05, [30, 30, 150]],
    [-0.02, [20, 20, 100]],
    [-0.01, [10, 10, 50]],
    [0.00, [40, 40, 40]],
    [0.01, [50, 10, 10]],
    [0.02, [100, 20, 20]],
    [0.05, [150, 30, 30]],
    [0.10, [200, 40, 40]]
  ],
}

function initializeMap(map, noiseScale, heightScale, defaultHeight) {
  noiseSeed(Date.now())
  let height;
  let i, j;
  for (i = 0; i < widthInSquares; i++) {
    let mapColumn = [];
    for (j = 0; j < heightInSquares; j++) {
      height = Math.floor(defaultHeight + heightScale * noise(i * noiseScale, j * noiseScale));
      mapColumn.push(height);
    }
    mapTypes[map].push(mapColumn);
  }
}

function getColorFromPalette(map, altitude) {
  let color;
  let paletteEntry;
  for (paletteEntry of colorPalettes[map]) {
    if (altitude > paletteEntry[0]) {
      color = paletteEntry[1];
    } else {
      break;
    }
  }
  if (!color) {
    console.log("map: ", map);
    console.log("altitude: ", altitude);
  }
  return color;
}

function displayMap(type) {
  let color;
  if (type === 'combined') {
    for (i = 0; i < widthInSquares; i++) {
      for (j = 0; j < heightInSquares; j++) {
        if (mapTypes.water[i][j] > 1.0) {
          color = getColorFromPalette('water', mapTypes.water[i][j])       
        } else {
          color = getColorFromPalette('altitude', mapTypes.altitude[i][j])
        }
        fill(color);
        square(i * squareSize, j * squareSize, squareSize);
      }
    }
  } else {
    displayMapPalette(type)
  }
}

function displayMapPalette(type) {
  //console.log("displaying map of type: ", type);
  let i, j;
  let color;
  stroke(100, 50);
  for (i = 0; i < widthInSquares; i++) {
    for (j = 0; j < heightInSquares; j++) {
      color = getColorFromPalette(type, mapTypes[type][i][j])
      fill(color);
      square(i * squareSize, j * squareSize, squareSize);
    }
  }
}

function updateErosion(xFrom, yFrom, xTo, yTo, flowRate) {
  const erosionRate = 5.50;
  const depositRate = 0.1;
  const minDeposit = 0.01;
  if (flowRate > 0) {
    const erosion = erosionRate * flowRate * flowRate;
    mapTypes.erosion[xTo][yTo] += erosion;
    mapTypes.altitude[xFrom][yFrom] -= erosion;
  }
  
  let deposit = depositRate * mapTypes.erosion[xFrom][yFrom];
  
  if (deposit < minDeposit) {
    mapTypes.altitude[xFrom][yFrom] += mapTypes.erosion[xFrom][yFrom]
    mapTypes.erosion[xFrom][yFrom] = 0.0;
  }
  else {
    mapTypes.erosion[xFrom][yFrom] -= deposit;
    mapTypes.altitude[xFrom][yFrom] += deposit;
  }


  
  
  
  //let erosionRate = 0.01 * (flow - 0.1);
  /*
    const waterCarryingCapacity = Math.sqrt(Math.abs(flowRate));
  const solidMatter = mapTypes.erosion[xFrom][yFrom];
  const depositRate = 0.5
  if (solidMatter > waterCarryingCapacity) {
    mapTypes.erosion[xFrom][yFrom] = depositRate * waterCarryingCapacity + (1 - depositRate) * solidMatter;
    mapTypes.erosion[xFrom][yFrom] 
  if (flow > 0.05) {
    //fast water: eroding from terrain - altitude goes down, erosion on that square
    //let e = 0.1 * (Math.erosion[i][j] - Math.sqrt(Math.abs(flow)))
    mapTypes.altitude[i][j] += e
    mapTypes.erosion[i + s][j + t] -= e;
  } else if ((flow > 0) && (flow < 0.05)) {
    // slow water: adding to terrain, erosion goes down
    mapTypes.altitude[i][j] += Math.min(0.1, mapTypes.erosion[i][j]);
    mapTypes.erosion[i][j] -= Math.min(0.1, mapTypes.erosion[i][j]);
    
  }*/
}


function calculateFlow() {
  let totalHeight, waterHeight;
  let compareTotalHeight, compareWaterHeight;
  let i, j, s, t;
  let flowRate = 0.1;
  let distanceMult = 1;
  let flow;
  //reset everything to 0
  for (i = 0; i < widthInSquares; i++) {
    for (j = 0; j < heightInSquares; j++) {
      mapTypes.waterFlow[i][j] = 0;
    }
  }

  for (i = 0; i < widthInSquares; i++) {
    for (j = 0; j < heightInSquares; j++) {
      waterHeight = mapTypes.water[i][j];
      totalHeight = waterHeight + mapTypes.altitude[i][j];
      //console.log("Examining square: ", i, j);
      //console.log("Water height is: ", waterHeight);
      //console.log("Total height is: ", totalHeight);
      for (s = -1; s <= 1; s++) {
        for (t = -1; t <= 1; t++) {
          if ((s === 0 && t === 0) || ((i + s) < 0) || ((j + t) < 0) || ((i + s) >= widthInSquares) || ((j + t) >= heightInSquares)) {
            continue;
          }
          //console.log("coordinates: ", i + s, j + t);
          compareWaterHeight = mapTypes.water[i + s][j + t];
          compareTotalHeight = compareWaterHeight + mapTypes.altitude[i + s][j + t];
          if ((s === 1 || s === -1) && (t === 1 || t === -1)) {
            distanceMult = 0.7;
          } else {
            distanceMult = 1;
          }
          //console.log("Comparing square to: ", i+s, j+t);
          //console.log("Water height is: ", compareWaterHeight);
          //console.log("type of compareWaterHeight: ", typeof(compareWaterHeight));
          //console.log("Total height is: ", compareTotalHeight);
          //console.log("Difference in total heights: ", totalHeight - compareTotalHeight);
          //console.log("Difference in total heights, limited to waterHeight: ", Math.min(totalHeight - compareTotalHeight, waterHeight));

          flow = flowRate * distanceMult * Math.min(totalHeight - compareTotalHeight, waterHeight);
          //console.log("Flow is: ", flow);
          // calculate outbound flow only
          if (flow > 0.0001) {
            //console.log("Flow is greater than 0.01, so adding it");
            mapTypes.waterFlow[i][j] += flow;
            //console.log("waterFlow at ", i, j,", is now :", mapTypes.waterFlow[i][j]);
            mapTypes.waterFlow[i + s][j + t] -= flow;
            //console.log("waterFlow at ", i+s, j+t,", is now :", mapTypes.waterFlow[i+s][j+t]);
          }
          updateErosion(i, j, i+s, j+t, flow);
        }
      }
    }
  }
}

function rain() {
  let totalWater = 0.0;
  const evaporationRate = 1.0;
  for (i = 0; i < widthInSquares; i++) {
    for (j = 0; j < heightInSquares; j++) {
      let evaporation = Math.min(mapTypes.water[i][j], evaporationRate);
      mapTypes.water[i][j] -= evaporation;
      totalWater += evaporation;
    }
  }
  const rainAmount = totalWater / (widthInSquares * heightInSquares);
  for (i = 0; i < widthInSquares; i++) {
    for (j = 0; j < heightInSquares; j++) {
      mapTypes.water[i][j] += rainAmount;
    }
  }
}

function updateWater() {
  calculateFlow();
  for (i = 0; i < widthInSquares; i++) {
    for (j = 0; j < heightInSquares; j++) {
      mapTypes.water[i][j] -= mapTypes.waterFlow[i][j];
    }
  }
}

function currentMap() {
  return mapTypeArray[mapTypeIndex];
}

function setup() {
  createCanvas(squareSize * widthInSquares, squareSize * heightInSquares);
  initializeMap('altitude', 0.05, 150, 50);
  initializeMap('water', 0.2, 3, 3);
  initializeMap('waterFlow', 0.2, 0, 0);
  initializeMap('erosion', 0.2, 0, 0);
  updateWater();
  displayMap(currentMap());
}

function mouseClicked() {
  mapTypeIndex = (mapTypeIndex + 1) % mapTypeArray.length;
}

function draw() {
  let newXSquare = Math.min(Math.floor(mouseX / squareSize), widthInSquares - 1);
  let newYSquare = Math.min(Math.floor(mouseY / squareSize), heightInSquares - 1);
  let refresh = true;
  if (mouseIsPressed) {
    refresh = true;
  }

  if ((newXSquare !== xSquare) || (newYSquare !== ySquare)) {
    xSquare = newXSquare;
    ySquare = newYSquare;
    refresh = true;
  }
  updateWater();
  rain();
  if (refresh) {
    try {
      let altitude = mapTypes.altitude[xSquare][ySquare];
      let water = mapTypes.water[xSquare][ySquare];
      let waterFlow = mapTypes.waterFlow[xSquare][ySquare];
      let erosion = mapTypes.erosion[xSquare][ySquare];
      displayMap(currentMap());

      textSize(20);
      fill(220);
      text('altitude: ' + altitude + '\nwater: ' + water + '\ntotal height ' + (altitude + water) + '\nwaterFlow: ' + waterFlow + '\nerosion: ' + erosion, 10, 30);
    } catch (error) {
      console.log(error);
      console.log("mouseX: ", mouseX);
      console.log("mouseY: ", mouseY);
      console.log("xSquare: ", xSquare);
      console.log("ySquare: ", ySquare);
      console.log(mapTypes.altitude);
    }
  }
}