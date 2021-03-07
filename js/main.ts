"use strict";
// Data Structures
const { Track, Tracks } = require("./../js/containers/track.js");
const { Battalion, Battalions } = require("./../js/containers/battalion.js");
const { Brigades } = require("./../js/containers/brigade.js");
const { Target } = require("./../js/containers/target.js");
const { Engager } = require("./../js/containers/engager.js");
const { Engagements } = require("./../js/containers/engagement.js");
const util = require("util");

// Load dependencies
const L = require("leaflet");
const turf = require("../Plugins/turf/turf.min.js");
const mysql = require("mysql");
var { PythonShell } = require("python-shell");
var fs = require("fs");


var data: string;
const configuration = JSON.parse(data);

// Set configurations
const dbName = configuration["database_name"];

// Tiles Url
const baseTiles: string = configuration["tiles_base"];
const darkTiles: string = configuration["tiles_dark"];
const heightsTiles: string = configuration["tiles_heights"];
const roadTiles: string = configuration["tiles_roads"];
const borderTiles: string = configuration["tiles_borders"];
const nameTiles: string = configuration["tiles_names"];
const fullTiles: string = configuration["tiles_full"];

const dbConfig = {
  host: configuration["host"],
  user: configuration["user"],
  password: configuration["password"],
};

var con;

function establishConnectionToDB() {
  con = mysql.createConnection(dbConfig); // Recreate the con, since the old one cannot be reused.
  con.connect(function onConnect(err) {
    // The server is either down
    if (err) {
      // or restarting (takes a while sometimes).
      console.log("error when connecting to db:", err);
      setTimeout(establishConnectionToDB, 10000); // We introduce a delay before attempting to reconnect,
    } else {
      loadInitialState();
      setInterval(tick, 1000);
    } // to avoid a hot loop, and to allow our node script to
  }); // process asynchronous requests in the meantime.
  con.on("error", function onError(err) {
    console.log("db error", err);
    if (err.code == "PROTOCOL_CONNECTION_LOST") {
      // Connection to the MySQL server is usually
      setTimeout(establishConnectionToDB, 5000); // lost due to either server restart, or a
    } else {
      // connnection idle timeout (the wait_timeout
      throw err; // server variable configures this)
    }
  });
}
establishConnectionToDB();

// Plugin options and setup
const gridOptions = {
  interval: 20,
  showOriginLabel: true,
  zoomIntervals: [
    { start: 0, end: 3, interval: 50 },
    { start: 4, end: 5, interval: 5 },
    { start: 6, end: 20, interval: 1 },
  ],
};

const polylineMeasureOptions = {
  clearMeasurementsOnStop: false,
  showClearControl: true,
  showUnitControl: true,
  position: "bottomleft",
};

const grid = L.simpleGraticule(gridOptions);

const polylineMeasure = L.control.polylineMeasure(polylineMeasureOptions);

const scaleControl = L.edgeScaleBar();

const baseLayer = L.tileLayer.wms(baseTiles);
const darkLayer = L.tileLayer.wms(darkTiles);
const heightsLayer = L.tileLayer.wms(heightsTiles);
const roadsLayer = L.tileLayer.wms(roadTiles);
const borderLayer = L.tileLayer.wms(borderTiles);
const namesLayer = L.tileLayer.wms(nameTiles);
const fullLayer = L.tileLayer.wms(fullTiles);

const visibleLayers = [baseLayer];

const map = L.map("mapid", {
  layers: visibleLayers,
  zoomControl: false,
  attributionControl: false,
  doubleClickZoom: false,
}).setView([26.8206, 30.8025], 8); // EDIT! : Map options(view, zoom)

// default values
const defaultZoom = map.getZoom();
const defaultIconScale = 1.5; // EDIT! : Icon scale
const defaultIconSize = [
  defaultIconScale * defaultZoom,
  defaultIconScale * defaultZoom,
];
const defaultAnchorScale = [
  (defaultIconScale * defaultZoom) / 2,
  (defaultIconScale * defaultZoom) / 2,
];

// Tracks data
const tracksContainer: typeof Tracks = Tracks.getInstance();
var tracksFeatureGroup = tracksContainer.showTracks();
tracksFeatureGroup.on("click", trackMarkerClick);
var trackTypes = [];

// Battalion data
const battalionsContainer = Battalions.getInstance();
var battalionFeatureGroup = battalionsContainer.showBattalions();
battalionFeatureGroup.on("click", battalionMarkerClick);
var battalionTypes = [];
var battalionParameters = [];

// Brigade data
const brigadesContainer = Brigades.getInstance();
var brigadesFeatureGroup = brigadesContainer.showBrigades();
brigadesFeatureGroup.on("click", brigadeMarkerClick);

// Engagements Container
var engagementsContainer = Engagements.getInstance();
var highLevelCommands = [];
var battalionCommands = [];
var ferCommands = [];
var brigadeReplyCommands = [];

var batRangeCircles = undefined;

var sql = `SELECT * FROM ${dbName}.${configuration["tracks"]}`;

function loadInitialState() {
  trackTypes = [];
  // Fetch track types
  sql = `SELECT * FROM ${dbName}.${configuration["track_type"]}`;
  con.query(sql, function (err, result) {
    if (err) throw err;
    trackTypes = result;
  });

  // Fetch battalion types
  sql = `SELECT ${dbName}.${configuration["battalions"]}.ID_Bat_Real, ${dbName}.${configuration["battalion_type"]}.Bat_Type FROM ${dbName}.${configuration["battalions"]} INNER JOIN ${dbName}.${configuration["battalion_parameter"]} ON ${dbName}.${configuration["battalions"]}.FK_ID_Bat_Par = ${dbName}.${configuration["battalion_parameter"]}.ID_Bat_Par INNER JOIN ${dbName}.${configuration["battalion_type"]} ON ${dbName}.${configuration["battalion_parameter"]}.FK_ID_Bat_Type = ${dbName}.${configuration["battalion_type"]}.ID_Bat_Type;`;
  con.query(sql, function (err, result) {
    if (err) throw err;

    battalionTypes = [];
    for (var i = 0; i < result.length; i++) {
      battalionTypes.push({
        id: result[i].ID_Bat_Real,
        type: result[i].Bat_Type,
      });
    }

    battalionParameters = [];
    // Fetch battalion parameters
    var s = `SELECT * FROM ${dbName}.${configuration["battalion_parameter"]}`;
    con.query(s, function (err, result) {
      if (err) throw err;
      battalionParameters = result;
    });
  });

  brigadesContainer.brigades = [];
  // Fetch brigade data
  sql = `SELECT * FROM ${dbName}.${configuration["brigades"]}`;
  con.query(sql, function (err, result) {
    if (err) throw err;
    for (var i = 0; i < result.length; i++) {
      brigadesContainer.addBrigade(
        result[i].Brigade_Name,
        result[i].Brigade_Lat / 3600,
        result[i].Brigade_Long / 3600,
        [],
        result[i].ID_Brigade
      );
    }

    brigadesFeatureGroup = brigadesContainer.showBrigades();
    brigadesFeatureGroup.on("click", brigadeMarkerClick);
    brigadesFeatureGroup.addTo(map);
  });

  battalionCommands = [];
  sql = `SELECT * FROM ${dbName}.${configuration["battalion_commands"]}`;
  con.query(sql, function (err, result) {
    if (err) throw err;
    result.forEach((element) => {
      battalionCommands[element.ID_Comm_Bat] = element.Comm_Name;
    });

    // console.log(battalionCommands);

    var sel = document.getElementById("battalionCommandSelect");
    sel.innerHTML = "";
    battalionCommands.forEach((element) => {
      var opt = document.createElement("option");
      opt.value = element;
      opt.innerHTML = element;
      sel.appendChild(opt);
    });
  });

  highLevelCommands = [];
  sql = `SELECT * FROM ${dbName}.${configuration["high_level_commands"]}`;
  con.query(sql, function (err, result) {
    if (err) throw err;
    result.forEach((element) => {
      highLevelCommands[element.ID_Comm_HL] = element.Command_Name;
    });

    var sel = document.getElementById("highLevelCommandSelect");
    sel.innerHTML = "";
    highLevelCommands.forEach((element) => {
      var opt = document.createElement("option");
      opt.value = element;
      opt.innerHTML = element;
      sel.appendChild(opt);
    });
  });

  ferCommands = [];
  sql = `SELECT * FROM ${dbName}.${configuration["fer_commands"]}`;
  con.query(sql, function (err, result) {
    if (err) throw err;
    result.forEach((element) => {
      ferCommands[element.id] = element.command_name
    });
  });

  brigadeReplyCommands = [];
  sql = `SELECT * FROM ${dbName}.${configuration["brigade_reply_commands"]}`;
  con.query(sql, function (err, result) {
    if (err) throw err;
    result.forEach((element) => {
      brigadeReplyCommands[element.id] = element.command_name
    });

    var sel = document.getElementById("brigadeReplyCommandSelect");
    sel.innerHTML = "";
    brigadeReplyCommands.forEach((element) => {
      var opt = document.createElement("option");
      opt.value = element;
      opt.innerHTML = element;
      sel.appendChild(opt);
    });
  });
}

var tracksHidden = false;
var battalionsHidden = false;
var tooltipHidden = false;

var currentAction: string = undefined;

function tick() {
  var sql = `SELECT * FROM ${dbName}.${configuration["tracks"]}`;
  con.query(sql, function (err, result) {
    if (err) throw err;
    const tracksContainer = Tracks.getInstance();
    tracksContainer.emptyTracks();
    for (var i = 0; i < result.length; i++) {
      if (result[i].Valid == 1) {
        var type = undefined;
        for (var j = 0; j < trackTypes.length; j++) {
          if (trackTypes[j].ID == result[i].Track_ID) {
            type = trackTypes[j].Type;
            break;
          }
        }
        tracksContainer.addTrack(
          result[i].TRK_No,
          result[i].TRK_Lat / 3600,
          result[i].TRK_Long / 3600,
          result[i].Serial,
          result[i].VX,
          result[i].VY,
          type,
          result[i].Speed,
          result[i].Alt,
          result[i].TQ,
          result[i].TRK_Size
        );
      }
    }

    if (tracksFeatureGroup != undefined) {
      tracksFeatureGroup.remove();
    }
    tracksFeatureGroup = tracksContainer.showTracks();
    tracksFeatureGroup.on("click", trackMarkerClick);
    if (!tracksHidden) {
      tracksFeatureGroup.addTo(map);
    }

    var sql = `SELECT * FROM ${dbName}.${configuration["battalions"]}`;
    con.query(sql, function (err, result) {
      if (err) throw err;

      battalionsContainer.emptybattalions();
      for (var i = 0; i < result.length; i++) {
        var type = "";

        for (var j = 0; j < battalionTypes.length; j++) {
          if (battalionTypes[j]["id"] == result[i].ID_Bat_Real) {
            type = battalionTypes[j]["type"];
          }
        }
        battalionsContainer.addBattalion(
          result[i].Bat_Name,
          result[i].Bat_Lat / 3600,
          result[i].Bat_Long / 3600,
          0,
          result[i].ID_Bat_Real,
          type,
          result[i].Bat_Availability,
          result[i].Bat_Link_Status,
          result[i].Bat_Alert_Status,
          result[i].FK_ID_Bat_Par,
          result[i].Bat_Alt,
          result[i].HotMissiles,
          result[i].ColdMissiles,
          result[i].Bat_Launcher_Status
        );
      }

      var union = undefined;
      battalionParameters.forEach((element) => {
        for (var i = 0; i < battalionsContainer.numberOfBattalions; i++) {
          var bat = battalionsContainer.battalions[i];
          if (bat.availability == 0) {
            continue;
          } else if (bat.availability == 1) {
            if (bat.paramId == element.ID_Bat_Par) {
              bat.radius = element.PPI_Range;
              var center = [bat.lon, bat.lat];
              var radius = bat.radius;
              var options = {
                steps: 1024,
                units: "kilometers",
              };
              var circle = turf.circle(center, radius, options);

              if (union == undefined) {
                union = circle;
              } else {
                union = turf.union(union, circle);
              }
            }
          }
        }
      });

      if (batRangeCircles != undefined) {
        batRangeCircles.remove();
      }
      batRangeCircles = L.geoJSON(union).addTo(map);

      if (battalionFeatureGroup != undefined) {
        battalionFeatureGroup.remove();
      }
      battalionFeatureGroup = battalionsContainer.showBattalions();
      battalionFeatureGroup.on("click", battalionMarkerClick);
      if (!battalionsHidden) {
        battalionFeatureGroup.addTo(map);
      }

      updateBattalionStatusTable();
    });

    var sql = `SELECT * FROM ${dbName}.${configuration["engagement"]} ORDER BY FK_ID_Bat_Real`;
    con.query(sql, function (err, result) {
      if (err) throw err;

      const selectedTarget = engagementsContainer.target
      const selectedEngager = engagementsContainer.engager

      if (selectedEngager != undefined && selectedEngager.constructor.name == "Battalion") {
        engagementsContainer.engager = battalionsContainer.getBattalionWithName(
          selectedEngager.name
        );
      }

      if (selectedTarget != undefined) {
        engagementsContainer.target = tracksContainer.getTrackWithName(
          selectedTarget.name
        )
      }
      engagementsContainer.drawSelectionCircles();

      engagementsContainer.resetBattalionEngagements();

      for (var i = 0; i < result.length; i++) {
        var bat = battalionsContainer.getBattalionWithId(
          result[i].FK_ID_Bat_Real
        );
        var track = tracksContainer.getTrackWithSerial(
          result[i].FK_ID_All_Track
        );

        if (bat != undefined && track != undefined) {
          var battalionEngagementId = result[i].FK_ID_Comm_Bat;
          var highlevelEngagementId = result[i].FK_ID_Comm_HL;
          var engagementType = undefined;

          if (battalionEngagementId == null) {
            engagementType = highLevelCommands[highlevelEngagementId];
            if (engagementType == "hold_fire") {
              engagementsContainer.cancelActionFor(bat, track);
            } else {
              // console.log("Should be partial");
              engagementsContainer.setActionLine(bat, track, engagementType);
            }
          } else {
            engagementType = battalionCommands[battalionEngagementId];
            if (engagementType == "broke") {
              engagementsContainer.cancelActionFor(bat, track);
            } else {
              engagementsContainer.setActionLine(
                bat,
                track,
                String(engagementType)
              );
            }
          }
          // console.log("Engagement is : " + engagementType);
        }
      }
      engagementsContainer.removeInvalid();
      updateEngagementTable(result);
    });

    var sql = `SELECT * FROM ${dbName}.${configuration["highlevel_engagement"]} ORDER BY FK_track_id`;
    con.query(sql, function (err, result) {
      if (err) throw err;

      const selectedTarget = engagementsContainer.target
      const selectedEngager = engagementsContainer.engager

      if (selectedEngager != undefined && selectedEngager.constructor.name == "Brigade") {
        engagementsContainer.engager = brigadesContainer.getBrigadeWithName(
          selectedEngager.name
        );
      }

      if (selectedTarget != undefined) {
        engagementsContainer.target = tracksContainer.getTrackWithName(
          selectedTarget.name
        )
      }
      engagementsContainer.drawSelectionCircles();

      engagementsContainer.resetBrigadeEngagements();
      for (var i = 0; i < result.length; i++) {
        var brig = brigadesContainer.getBrigadeWithId(
          result[i].FK_brigade_id
        );
        var track = tracksContainer.getTrackWithSerial(
          result[i].FK_track_id
        );
        var brigadeReplyId = result[i].FK_command_brigade_reply_id;

        // No reply from Brigade yet so it is null.
        if (brigadeReplyId == null) {
          if (brig != undefined && track != undefined) {
            var ferEngagementId = result[i].FK_command_id;
            var engagementType = undefined;

            engagementType = ferCommands[ferEngagementId];
            if (engagementType == "cantco" || engagementType == "hold_fire") {
              engagementsContainer.cancelActionFor(brig, track);
            } else {
              engagementsContainer.setActionLine(brig, track, String(engagementType));
            }
          }
          // console.log("Engagement is : " + engagementType);
        } else { // If there is a reply from the brigade
          if (brig != undefined && track != undefined) {
            var engagementType = undefined;

            engagementType = brigadeReplyCommands[brigadeReplyId];
            if (engagementType == "cantco") {
              engagementsContainer.cancelActionFor(brig, track);
            } else {
              engagementsContainer.setActionLine(brig, track, String(engagementType));
            }
          }
        }
      }

      engagementsContainer.removeInvalid();

    });

  });

  var sql = `SELECT * FROM ${dbName}.${configuration["system_mode"]}`;
  con.query(sql, function (err, result) {
    if (err) throw err;
    // console.log(result)
    updateSystemModes(result)
  });

  if (brigadesFeatureGroup != undefined) {
    brigadesFeatureGroup.remove();
  }
  brigadesFeatureGroup = brigadesContainer.showBrigades();
  brigadesFeatureGroup.on("click", brigadeMarkerClick)
  brigadesFeatureGroup.addTo(map);
}

// Display tables.
function updateEngagementTable(currentEngagements) {
  const table: any = document.getElementById("batEngagementTable");

  table.innerHTML = "";

  for (var i = 0; i < currentEngagements.length; i++) {
    var eng = currentEngagements[i];
    var track = tracksContainer.getTrackWithSerial(eng.FK_ID_All_Track);
    var bat = battalionsContainer.getBattalionWithId(eng.FK_ID_Bat_Real);

    if (track == undefined || bat == undefined) {
      continue;
    }
    var rowCount = table.rows.length;
    var row = table.insertRow(rowCount);

    var cell1 = row.insertCell(0);
    var batNameDiv = document.createElement("div");
    batNameDiv.innerHTML = `<p class="statusTableElement"> ${bat.name} </p>`;
    cell1.appendChild(batNameDiv);

    var cell2 = row.insertCell(1);
    var trackNameDiv = document.createElement("div");
    trackNameDiv.innerHTML = `<p class="statusTableElement"> ${track.name} </p>`;
    cell2.appendChild(trackNameDiv);

    var cell3 = row.insertCell(2);
    var commandHighlevelDiv = document.createElement("div");
    commandHighlevelDiv.innerHTML = `<p class="statusTableElement"> ${highLevelCommands[eng.FK_ID_Comm_HL]
      } </p>`;
    cell3.appendChild(commandHighlevelDiv);

    var cell4 = row.insertCell(3);
    var commandBattalionDiv = document.createElement("div");
    commandBattalionDiv.innerHTML = `<p class="statusTableElement"> ${battalionCommands[eng.FK_ID_Comm_Bat] == undefined
      ? "-"
      : battalionCommands[eng.FK_ID_Comm_Bat]
      } </p>`;
    cell4.appendChild(commandBattalionDiv);
  }
}

function updateBattalionStatusTable() {
  var table: any = document.getElementById("statusTable");

  table.innerHTML = "";

  for (var i = 0; i < battalionsContainer.numberOfBattalions; i++) {
    var bat = battalionsContainer.getBattalionAtIndex(i);
    var rowCount = table.rows.length;
    var row = table.insertRow(rowCount);

    var cell1 = row.insertCell(0);
    var batName = document.createElement("div");
    batName.innerHTML = `<p class="statusTableElement"> ${bat.name} </p>`;
    cell1.appendChild(batName);

    var cell2 = row.insertCell(1);
    var linkStatus = document.createElement("div");
    linkStatus.innerHTML = `<p class="statusTableElement" style="color: ${bat.linkStatus == 0 ? "#ff3333;" : "#40ff00;"
      }"> ${bat.linkStatus == 0 ? "OFF" : "ON"} </p>`;
    cell2.appendChild(linkStatus);

    var cell3 = row.insertCell(2);
    var availabilityStatus = document.createElement("div");
    availabilityStatus.innerHTML = `<p class="statusTableElement" style="color: ${bat.availability == 0 ? "#ff3333;" : "#40ff00;"
      }"> ${bat.availability == 0 ? "O" : "R"} </p>`;
    cell3.appendChild(availabilityStatus);

    var cell4 = row.insertCell(3);
    var hotMisslesStatus = document.createElement("div");
    hotMisslesStatus.innerHTML = `<p class="statusTableElement"> ${bat.hot_missles} </p>`;
    cell4.appendChild(hotMisslesStatus);

    var cell4 = row.insertCell(4);
    var coldMisslesStatus = document.createElement("div");
    coldMisslesStatus.innerHTML = `<p class="statusTableElement"> ${bat.cold_missles} </p>`;
    cell4.appendChild(coldMisslesStatus);
  }
}

function updateSystemModes(systemMode) {
  var table: any = document.getElementById("systemModeTable");

  const assignValues = {
    0: "Manual",
    1: "Auto",
    2: "Semi",
  };

  const weaponsValues = {
    0: "Free",
    1: "Tight",
  };

  const defconValues = {
    0: "Daily",
    1: "Increase",
    2: "Extreme",
  };

  const centralizedValues = {
    0: "Central",
    1: "Decentral",
  };

  const airRaidWarningValues = {
    0: "red",
    1: "yellow",
    2: "white",
  };

  const recording = {
    0: "OFF",
    1: "ON",
  };

  table.innerHTML = "";

  var i = 0;
  var header = table.createTHead();
  var th = header.insertRow(i);
  var batNameHeader = th.insertCell(i++);
  batNameHeader.innerHTML = `<p class="System-Mode-Table-Header"> Assign </p>`;

  var availabilityHeader = th.insertCell(i++);
  availabilityHeader.innerHTML = `<p class="System-Mode-Table-Header"> Weapon </p>`;

  var linkHeader = th.insertCell(i++);
  linkHeader.innerHTML = `<p class="System-Mode-Table-Header"> Central </p>`;

  var commandBatHeader = th.insertCell(i++);
  commandBatHeader.innerHTML = `<p class="System-Mode-Table-Header"> Defcon </p>`;

  var rowCount = table.rows.length;
  var row1 = table.insertRow(rowCount++);

  // Reset the cell counter
  i = 0;
  var assignCell = row1.insertCell(i++);
  var assign = document.createElement("div");
  assign.innerHTML = `<p class="statusTableElement"> ${assignValues[systemMode[0].assign]
    } </p>`;
  assignCell.appendChild(assign);

  var weaponsCell = row1.insertCell(i++);
  var weapons = document.createElement("div");
  weapons.innerHTML = `<p class="statusTableElement"> ${weaponsValues[systemMode[0].weapons]
    } </p>`;
  weaponsCell.appendChild(weapons);

  var defconCell = row1.insertCell(i++);
  var defcon = document.createElement("div");
  defcon.innerHTML = `<p class="statusTableElement"> ${defconValues[systemMode[0].defcon]
    } </p>`;
  defconCell.appendChild(defcon);

  var centralizationCell = row1.insertCell(i++);
  var centralization = document.createElement("div");
  centralization.innerHTML = `<p class="statusTableElement"> ${centralizedValues[systemMode[0].centralization]
    } </p>`;
  centralizationCell.appendChild(centralization);

  i = 0;
  var row2 = table.insertRow(rowCount++);
  var airRaidWarningTitle = row2.insertCell(i++);
  var airRaidWarning = document.createElement("div");
  airRaidWarning.innerHTML = `<p class="statusTableElement"> Air-Raid Warning </p>`;
  airRaidWarningTitle.appendChild(airRaidWarning);

  var airRaidCellColor = row2.insertCell(i++);
  var airRaidWarningDiv = document.createElement("div");
  airRaidWarningDiv.innerHTML = `<div style="background-color: ${airRaidWarningValues[systemMode[0].air_raid_warning]
    }; width: 50px; height: 50px; margin: 10px;"> </div>`;
  airRaidCellColor.appendChild(airRaidWarningDiv);

  document.getElementById("systemRecordingStatus").innerText =
    recording[systemMode[0].system_recording];
  if (systemMode[0].simulation == 0) {
    document.getElementById("simulationName").innerText = "OFF";
  } else {
    document.getElementById("simulationName").innerText =
      systemMode[0].simulation_name;
  }

  var raidRecordingName: any = document.getElementById("raidRecordingName");
  var raidRecordingBtn: any = document.getElementById("raidRecordingButton");
  if (systemMode[0].raid_recording == 1) {
    raidRecordingName.value = systemMode[0].raid_name;
    raidRecordingName.disabled = true;
    raidRecordingBtn.innerText = "Stop";
  } else {
    raidRecordingName.disabled = false;
    raidRecordingBtn.innerText = "Start";
  }
}

function startRecordingRaid() {
  var raidNameElement: any = document.getElementById("raidRecordingName");
  var recordingButton: any = document.getElementById("raidRecordingButton");
  var raidName = raidNameElement.value;

  console.log(recordingButton.innerText);
  if (recordingButton.innerText == "Start") {
    if (raidName != "") {
      var object = {
        name: raidName,
      };
      fs.writeFile(
        configuration["raid_name"],
        JSON.stringify(object, null, 4),
        (err) => {
          if (err) {
            return;
          }
          PythonShell.run(
            configuration["raid_record_script"],
            null,
            function (err, results) {
              if (err) {
                throw err;
              }
              console.log(results);
            }
          );
        }
      );
    }
  } else if (recordingButton.innerText == "Stop") {
    var query = `update ${dbName}.${configuration["system_mode"]} set raid_recording=0`;
    con.query(query, function (err, result) {
      if (err) {
        throw err;
      }
      raidNameElement.value = "";
    });
  }
}

// Event Listeners
function cancelAction() {
  engagementsContainer.cancelCurrentAction();
}
map.on("contextmenu", cancelAction);

var coordsDiv = document.getElementById("coords");
map.addEventListener("mousemove", function (ev) {
  var lat = Math.floor(ev.latlng.lat);
  var latMin = (ev.latlng.lat - lat) * 60;
  var latSec = (latMin - Math.floor(latMin)) * 60;

  var lng = Math.floor(ev.latlng.lng);
  var lngMin = (ev.latlng.lng - lng) * 60;
  var lngSec = (lngMin - Math.floor(lngMin)) * 60;

  var lattitudalDirection = "";
  var longitudalDirection = "";
  if (lat >= 0) {
    lattitudalDirection = "N";
  } else {
    lattitudalDirection = "S";
  }

  if (lng >= 0) {
    longitudalDirection = "E";
  } else {
    longitudalDirection = "W";
  }

  coordsDiv.innerHTML = `<p id="latText" class="infoText">${lat}&deg;${Math.floor(
    latMin
  )}'${Math.floor(latSec)}" ${lattitudalDirection} ${lng}&deg;${Math.floor(
    lngMin
  )}'${Math.floor(lngSec)}" ${longitudalDirection}</p>`;
});

map.addEventListener("zoomend", function (ev) {
  var currentZoom = map.getZoom();

  console.log(currentZoom);

  var sizeScaled = [
    defaultIconScale * currentZoom,
    defaultIconScale * currentZoom,
  ];
  var anchorScaled = [
    (defaultIconScale * currentZoom) / 2,
    (defaultIconScale * currentZoom) / 2,
  ];
  tracksContainer.scaleIcons(sizeScaled, anchorScaled);
  battalionsContainer.scaleIcons(sizeScaled, anchorScaled);
  brigadesContainer.scaleIcons(sizeScaled, anchorScaled);
});

function getDateToday(): string {
  var d = new Date();
  return (
    d.getFullYear() +
    "-" +
    (d.getMonth() + 1 < 10 ? "0" : "") +
    (d.getMonth() + 1) +
    "-" +
    (d.getDate() < 10 ? "0" : "") +
    d.getDate()
  );
}
function getTimeNow(): string {
  var d = new Date();
  return (
    (d.getHours() < 10 ? "0" : "") +
    d.getHours() +
    ":" +
    (d.getMinutes() < 10 ? "0" : "") +
    d.getMinutes() +
    ":" +
    (d.getSeconds() < 10 ? "0" : "") +
    d.getSeconds()
  );
}

function orderLayers() {
  var i = 0;
  baseLayer.setZIndex(i++);
  darkLayer.setZIndex(i++);
  heightsLayer.setZIndex(i++);
  roadsLayer.setZIndex(i++);
  borderLayer.setZIndex(i++);
  namesLayer.setZIndex(i++);
  fullLayer.setZIndex(i++);
}

var baseLayerVisible = true;
var darkLayerVisible = false;
var heightsLayerVisible = false;
var roadsLayerVisible = false;
var borderLayerVisible = false;
var namesLayerVisible = false;
var fullLayerVisible = false;

function baseLayerToggle() {
  var baseLayerControl = document.getElementById("baseLayerControl");
  if (baseLayerVisible) {
    baseLayer.remove();
    baseLayerControl.style.color = "white";
  } else {
    baseLayer.addTo(map);
    baseLayerControl.style.color = "#66ff66";
  }
  orderLayers();
  baseLayerVisible = !baseLayerVisible;
}

function darkLayerToggle() {
  var darkLayerControl = document.getElementById("darkLayerControl");
  if (darkLayerVisible) {
    darkLayer.remove();
    darkLayerControl.style.color = "white";
  } else {
    darkLayer.addTo(map);
    darkLayerControl.style.color = "#66ff66";
  }
  orderLayers();
  darkLayerVisible = !darkLayerVisible;
}

function heightsLayerToggle() {
  var heightsLayerControl = document.getElementById("heightsLayerControl");
  if (heightsLayerVisible) {
    heightsLayer.remove();
    heightsLayerControl.style.color = "white";
  } else {
    heightsLayer.addTo(map);
    heightsLayerControl.style.color = "#66ff66";
  }
  orderLayers();
  heightsLayerVisible = !heightsLayerVisible;
}

function roadsLayerToggle() {
  var roadsLayerControl = document.getElementById("roadsLayerControl");
  if (roadsLayerVisible) {
    roadsLayer.remove();
    roadsLayerControl.style.color = "white";
  } else {
    roadsLayer.addTo(map);
    roadsLayerControl.style.color = "#66ff66";
  }
  orderLayers();
  roadsLayerVisible = !roadsLayerVisible;
}

function borderLayerToggle() {
  var borderLayerControl = document.getElementById("borderLayerControl");
  if (borderLayerVisible) {
    borderLayer.remove();
    borderLayerControl.style.color = "white";
  } else {
    borderLayer.addTo(map);
    borderLayerControl.style.color = "#66ff66";
  }
  orderLayers();
  borderLayerVisible = !borderLayerVisible;
}

function namesLayerToggle() {
  var namesLayerControl = document.getElementById("namesLayerControl");
  if (namesLayerVisible) {
    namesLayer.remove();
    namesLayerControl.style.color = "white";
  } else {
    namesLayer.addTo(map);
    namesLayerControl.style.color = "#66ff66";
  }
  orderLayers();
  namesLayerVisible = !namesLayerVisible;
}

function fullLayerToggle() {
  var fullLayerControl = document.getElementById("fullLayerControl");
  if (fullLayerVisible) {
    fullLayer.remove();
    fullLayerControl.style.color = "white";
  } else {
    fullLayer.addTo(map);
    fullLayerControl.style.color = "#66ff66";
  }
  orderLayers();
  fullLayerVisible = !fullLayerVisible;
}

var ipc = require("electron").ipcRenderer;
document.addEventListener("keydown", function (e) {
  if (e.isComposing || e.keyCode === 112) {
    showDisplayOptions();
    return;
  }

  if (e.isComposing || e.keyCode === 113) {
    showActions();
    return;
  }

  if (e.isComposing || e.keyCode === 114) {
    // console.log("Clicked")
    ipc.once("actionReply", function (event, response) {
      console.log(response);
    });
    ipc.send("invokeAction", "invoked");
    return;
  }
});

var tracksControl = document.getElementById("tracksControl");
var battalionsControl = document.getElementById("battalionsControl");
var tooltipControl = document.getElementById("tooltipControl");
var gridControl = document.getElementById("gridControl");
var scaleControlButton = document.getElementById("scaleControl");

function showHideTracks() {
  if (tracksHidden) {
    tracksControl.style.color = "#66ff66";
    tracksFeatureGroup.addTo(map);
    tracksHidden = !tracksHidden;
  } else {
    tracksControl.style.color = "white";
    tracksFeatureGroup.remove();
    tracksHidden = !tracksHidden;
  }
}

function showHideBattalions() {
  if (battalionsHidden) {
    battalionsControl.style.color = "#66ff66";
    battalionFeatureGroup.addTo(map);
    battalionsHidden = !battalionsHidden;
  } else {
    battalionsControl.style.color = "white";
    battalionFeatureGroup.remove();
    battalionsHidden = !battalionsHidden;
  }
}

function showHidetoolTip() {
  if (tooltipHidden) {
    tooltipControl.style.color = "#66ff66";
    tooltipHidden = !tooltipHidden;
  } else {
    tooltipControl.style.color = "white";
    tooltipHidden = !tooltipHidden;
  }
}

var gridHidden = true;

function showHideGrid() {
  if (gridHidden) {
    gridControl.style.color = "#66ff66";
    grid.addTo(map);
    gridHidden = !gridHidden;
  } else {
    gridControl.style.color = "white";
    grid.remove();
    gridHidden = !gridHidden;
  }
}

var scaleHidden = true;

function showHideScale() {
  if (scaleHidden) {
    scaleControlButton.style.color = "#66ff66";
    scaleControl.addTo(map);
    scaleHidden = !scaleHidden;
  } else {
    scaleControlButton.style.color = "white";
    scaleControl.remove();
    scaleHidden = !scaleHidden;
  }
  map.invalidateSize();
}

function latlngFormat(latlng) {
  var lat = Math.floor(latlng.lat);
  var latMin = (latlng.lat - lat) * 60;
  var latSec = (latMin - Math.floor(latMin)) * 60;

  var lng = Math.floor(latlng.lng);
  var lngMin = (latlng.lng - lng) * 60;
  var lngSec = (lngMin - Math.floor(lngMin)) * 60;

  var lattitudalDirection = "";
  var longitudalDirection = "";
  if (lat >= 0) {
    lattitudalDirection = "N";
  } else {
    lattitudalDirection = "S";
  }

  if (lng >= 0) {
    longitudalDirection = "E";
  } else {
    longitudalDirection = "W";
  }

  return {
    lat: `${Math.abs(lat)}&deg;${Math.floor(latMin)}'${Math.floor(
      latSec
    )}" ${lattitudalDirection}`,
    lng: `${lng}&deg;${Math.floor(lngMin)}'${Math.floor(
      lngSec
    )}" ${longitudalDirection}`,
  };
}

function trackMarkerClick(e) {
  var infoTextDiv = document.getElementById("info");

  var latlng = latlngFormat(e.latlng);
  infoTextDiv.innerHTML = `
    <p class="infoText"> Name: ${e.layer.track.name} </p>
    <p class="infoText"> Alt : ${e.layer.track.alt} </p>
    <p class="infoText"> Speed : ${e.layer.track.speed} </p>
    `;

  // if (e.layer.type == "H") {
  engagementsContainer.selectTarget(
    tracksContainer.getTrackWithName(e.layer.track.name)
  );
  // } else {
  //     engagementsContainer.cancelCurrentAction();
  // }
}

function battalionMarkerClick(e) {
  console.log(e.layer.bat.availability);
  if (e.layer.bat.availability == 0) {
    engagementsContainer.cancelCurrentAction();
  } else if (e.layer.bat.availability == 1) {
    engagementsContainer.selectEngager(
      battalionsContainer.getBattalionWithName(e.layer.bat.name)
    );
  }
}

function brigadeMarkerClick(e) {
  engagementsContainer.selectEngager(brigadesContainer.getBrigadeWithName(e.layer.brigade.name));
}

function drawActionLine(selectedEngager: typeof Engager, selectedTarget: typeof Target, lineType) {

  if (selectedTarget == undefined || selectedEngager == undefined) {
    console.log("Track and battalion not selected");
  } else {
    // console.log("Line type : " + lineType);
    if (lineType == "engage" || lineType == "assign_investigate") {
      var latlngs = [
        [selectedTarget.lat, selectedTarget.lon],
        [selectedEngager.lat, selectedEngager.lon],
      ];
      var actionLine = new L.Polyline(latlngs, {
        color: "red",
        className: "Engage-Line",
      });
      actionLine.remove();
      actionLine.addTo(map);
      return actionLine;
    } else if (lineType == "wilco") {
      var latlngs = [
        [selectedTarget.lat, selectedTarget.lon],
        [selectedEngager.lat, selectedEngager.lon],
      ];
      var actionLine = new L.Polyline(latlngs, {
        color: "red",
        className: "Wilco-Line",
      });
      actionLine.remove();
      actionLine.addTo(map);
      return actionLine;
    } else if (lineType == "tracking" || lineType == "partial_effect") {
      // console.log("Should track");
      var latlngs = [
        [selectedTarget.lat, selectedTarget.lon],
        [selectedEngager.lat, selectedEngager.lon],
      ];
      var actionLine = new L.Polyline(latlngs, {
        color: "red",
        weight: 2,
        smoothFactor: 1,
      });
      actionLine.remove();
      actionLine.addTo(map);
      return actionLine;
    } else if (lineType == "fire") {
      var latlngs = [
        [selectedTarget.lat, selectedTarget.lon],
        [selectedEngager.lat, selectedEngager.lon],
      ];
      var actionLine = new L.Polyline(latlngs, {
        color: "red",
        className: "Fire-Line",
      });
      actionLine.remove();
      actionLine.addTo(map);
      return actionLine;
    } else if (
      lineType == "broke" ||
      lineType == "hold_fire" ||
      lineType == "ineffect" ||
      lineType == "cantco"
    ) {
      engagementsContainer.cancelActionFor(
        selectedEngager.name,
        selectedTarget.name
      );
    } else {
      console.log("No matches");
    }
  }
}


function applyHighLevelEngagement() {
  var actionSelector: any = document.getElementById("highLevelCommandSelect");
  var actionID: number = undefined;
  currentAction = actionSelector.value;

  for (var i = 0; i < highLevelCommands.length; i++) {
    if (highLevelCommands[i] == actionSelector.value) {
      actionID = i;
    }
  }

  var data = engagementsContainer.getSelected();
  var btn: any = document.getElementById("highlevelApplyButton");
  btn.disabled = true;

  if (data == undefined) {
    alert("Select track and battalion first");
    btn.disabled = false;
  } else {
    var selectedTarget = data["target"];
    var selectedEngager = data["engager"];

    if (selectedEngager.constructor.name != "Battalion") {
      alert("Select brigade to apply a high level engagement")
      btn.disabled = false;
      return;
    }

    if (currentAction == "hold_fire") {
      var sql = `
    SELECT count( * ) AS num FROM ${dbName}.${configuration["engagement"]}
    WHERE FK_ID_All_Track = ${selectedTarget.serial}
    AND FK_ID_Bat_Real = ${selectedEngager.id};
    `;
      con.query(sql, function (err, result) {
        if (err) {
          btn.disabled = false;
          throw err;
        }
        // alert("Result: " + result[0].num);
        var count = result[0].num;
        if (count == 0) {
          // INSERT New Record
          sql = `
    Insert into ${dbName}.${configuration["engagement"]}
    (FK_ID_Comm_HL, FK_ID_Comm_Bat, FK_ID_All_Track, FK_ID_Bat_Real, Direct)
    Values(${actionID}, NULL, ${selectedTarget.serial}, ${selectedEngager.id}, 0)
    `;
          con.query(sql, function (err, result) {
            if (err) {
              btn.disabled = false;
              throw err;
            }
            setTimeout(deleteRecord, 2000, selectedTarget, selectedEngager);
            // console.log("Inserted Result: " + result);
          });
        } else if (count > 0) {
          var currentTime = getDateToday() + " " + getTimeNow();
          console.log(currentTime);
          var cc = String(currentTime);
          sql = `
    update ${dbName}.${configuration["engagement"]}
    set FK_ID_Comm_HL = ${actionID},
    FK_ID_Comm_Bat = NULL,
    FK_ID_All_Track = ${selectedTarget.serial},
    FK_ID_Bat_Real = ${selectedEngager.id},
    Direct = 0,
    Time_Update = '${cc}'
    where FK_ID_All_Track = ${selectedTarget.serial}
    and FK_ID_Bat_Real = ${selectedEngager.id};
    `;
          con.query(sql, function (err, result) {
            if (err) {
              btn.disabled = false;
              throw err;
            }
            setTimeout(deleteRecord, 2000, selectedTarget, selectedEngager);
            // console.log("Updated Result: " + result);
          });
        } else {
          alert("MORE THAN TWO RECORDS WITH SAME VALUES");
        }
        btn.disabled = false;
      });
    } else {
      var sql = `
    SELECT count( * ) AS num FROM ${dbName}.${configuration["engagement"]}
    WHERE FK_ID_All_Track = ${selectedTarget.serial}
    AND FK_ID_Bat_Real = ${selectedEngager.id};
    `;
      con.query(sql, function (err, result) {
        if (err) {
          btn.disabled = false;
          throw err;
        }
        // alert("Result: " + result[0].num);
        var count = result[0].num;
        if (count == 0) {
          // INSERT New Record
          sql = `
    Insert into ${dbName}.${configuration["engagement"]}
    (FK_ID_Comm_HL, FK_ID_Comm_Bat, FK_ID_All_Track, FK_ID_Bat_Real, Direct)
    Values(${actionID}, NULL, ${selectedTarget.serial}, ${selectedEngager.id}, 0)
    `;
          con.query(sql, function (err, result) {
            if (err) {
              btn.disabled = false;
              throw err;
            }
            engagementsContainer.setActionLine(
              selectedEngager,
              selectedTarget,
              currentAction
            );
            // console.log("Inserted Result: " + result);
          });
        } else if (count > 0) {
          var newDate = new Date();
          var currentTime = getDateToday() + " " + getTimeNow();
          console.log(currentTime);
          var cc = String(currentTime);
          sql = `
    update ${dbName}.${configuration["engagement"]}
    set FK_ID_Comm_HL = ${actionID},
    FK_ID_Comm_Bat = NULL,
    FK_ID_All_Track = ${selectedTarget.serial},
    FK_ID_Bat_Real = ${selectedEngager.id},
    Direct = 0,
    Time_Update = '${cc}'
    where FK_ID_All_Track = ${selectedTarget.serial}
    and FK_ID_Bat_Real = ${selectedEngager.id};
    `;
          con.query(sql, function (err, result) {
            if (err) {
              btn.disabled = false;
              throw err;
            }
            // console.log("Updated Result: " + result);
            engagementsContainer.setActionLine(
              selectedEngager,
              selectedTarget,
              currentAction
            );
          });
        } else {
          alert("MORE THAN TWO RECORDS WITH SAME VALUES");
        }
        btn.disabled = false;
      });
    }
  }
}

function applyBattalionEngagement() {
  var actionSelector: any = document.getElementById("battalionCommandSelect");
  var actionID = undefined;
  currentAction = actionSelector.value;

  for (var i = 0; i < battalionCommands.length; i++) {
    if (battalionCommands[i] == actionSelector.value) {
      actionID = i;
    }
  }

  var data = engagementsContainer.getSelected();
  var btn: any = document.getElementById("battalionApplyButton");
  btn.disabled = true;

  if (data == undefined) {
    alert("Select track and battalion first");
    btn.disabled = false;
  } else {
    var selectedTarget = data["target"];
    var selectedEngager = data["engager"];

    if (selectedEngager.constructor.name != "Battalion") {
      alert("Select brigade to apply a battalion level engagement")
      btn.disabled = false;
      return;
    }

    console.log(selectedEngager.linkStatus)

    if (selectedEngager.linkStatus == 1) {
      alert("Battalion is not OFF.")
      btn.disabled = false;
      return;
    }

    if (currentAction == "broke" || currentAction == "ineffect") {
      var sql = `SELECT count( * ) AS num FROM ${dbName}.${configuration["engagement"]}
                        WHERE FK_ID_All_Track = ${selectedTarget.serial}
                        AND FK_ID_Bat_Real = ${selectedEngager.id};`;
      con.query(sql, function (err, result) {
        if (err) {
          btn.disabled = false;
          throw err;
        }
        // alert("Result: " + result[0].num);
        var count = result[0].num;
        if (count == 0) {
          // INSERT New Record
          sql = `Insert into ${dbName}.${configuration["engagement"]} 
                    (FK_ID_Comm_HL, FK_ID_Comm_Bat, FK_ID_All_Track, FK_ID_Bat_Real) 
                    Values(${2}, ${actionID}, ${selectedTarget.serial}, ${selectedEngager.id
            })`;
          con.query(sql, function (err, result) {
            if (err) {
              btn.disabled = false;
              throw err;
            }
            setTimeout(deleteRecord, 2000, selectedTarget, selectedEngager);
            // console.log("Inserted Result: " + result);
          });
        } else if (count > 0) {
          var newDate = new Date();
          var currentTime = getDateToday() + " " + getTimeNow();
          console.log(currentTime);

          var cc = String(currentTime);
          sql = `
                            update ${dbName}.${configuration["engagement"]}
                            set FK_ID_Comm_HL = ${2},
                            FK_ID_Comm_Bat = ${4},
                            FK_ID_All_Track = ${selectedTarget.serial},
                            FK_ID_Bat_Real = ${selectedEngager.id},
                            Time_Update = '${cc}'
                        where FK_ID_All_Track = ${selectedTarget.serial}
                        and FK_ID_Bat_Real = ${selectedEngager.id};`;
          con.query(sql, function (err, result) {
            if (err) {
              btn.disabled = false;
              throw err;
            }
            setTimeout(deleteRecord, 2000, selectedTarget, selectedEngager);
            // console.log("Updated Result: " + result);
          });
        } else {
          alert("MORE THAN TWO RECORDS WITH SAME VALUES");
        }
        btn.disabled = false;
      });
    } else {
      var sql = `
    SELECT count(*) AS num FROM ${dbName}.${configuration["engagement"]}
    WHERE FK_ID_All_Track = ${selectedTarget.serial}
    AND FK_ID_Bat_Real = ${selectedEngager.id}`;
      con.query(sql, function (err, result) {
        if (err) {
          btn.disabled = false;
          throw err;
        }
        // alert("Result: " + result[0].num);
        var count = result[0].num;
        if (count == 0) {
          // INSERT New Record
          sql = `
    Insert into ${dbName}.${configuration["engagement"]}
    (FK_ID_Comm_HL, FK_ID_Comm_Bat, FK_ID_All_Track, FK_ID_Bat_Real) 
    Values(${2}, ${actionID}, ${selectedTarget.serial}, ${selectedEngager.id})
    `;
          con.query(sql, function (err, result) {
            btn.disabled = false;
            if (err) {
              throw err;
            }
            engagementsContainer.setActionLine(
              selectedEngager,
              selectedTarget,
              currentAction
            );
            // console.log("Inserted Result: " + result);
          });
        } else if (count > 0) {
          var newDate = new Date();
          var currentTime = getDateToday() + " " + getTimeNow();
          console.log(currentTime);

          var cc = String(currentTime);
          sql = `
    update ${dbName}.${configuration["engagement"]}
    set FK_ID_Comm_HL = ${2},
    FK_ID_Comm_Bat = ${actionID},
    FK_ID_All_Track = ${selectedTarget.serial},
    FK_ID_Bat_Real = ${selectedEngager.id},
    Time_Update = '${cc}'
    where FK_ID_All_Track = ${selectedTarget.serial}
    and FK_ID_Bat_Real = ${selectedEngager.id};
    `;
          con.query(sql, function (err, result) {
            btn.disabled = false;
            if (err) {
              throw err;
            }
            engagementsContainer.setActionLine(
              selectedEngager,
              selectedTarget,
              currentAction
            );
            // console.log("Updated Result: " + result);
          });
        } else {
          alert("MORE THAN TWO RECORDS WITH SAME VALUES");
        }
        btn.disabled = false;
      });
    }
  }
}

function applyBrigadeReplyEngagement() {
  var actionSelector: any = document.getElementById("brigadeReplyCommandSelect");
  var actionID = undefined;
  currentAction = actionSelector.value;

  for (var i = 0; i < brigadeReplyCommands.length; i++) {
    if (brigadeReplyCommands[i] == actionSelector.value) {
      actionID = i;
    }
  }

  var data = engagementsContainer.getSelected();
  var btn: any = document.getElementById("brigadeReplyApplyButton");
  btn.disabled = true;

  if (data == undefined) {
    alert("Select track and battalion first");
    btn.disabled = false;
  } else {
    var selectedTarget = data["target"];
    var selectedEngager = data["engager"];

    if (selectedEngager.constructor.name != "Brigade") {
      alert("Select brigade to apply a Brigade reply")
      btn.disabled = false;
      return;
    }

    var currentTime = getDateToday() + " " + getTimeNow();
    console.log(currentTime);

    var cc = String(currentTime);
    var sql = `update ${dbName}.${configuration["highlevel_engagement"]} set FK_brigade_id=${selectedEngager.id}, FK_track_id=${selectedTarget.serial}, FK_command_brigade_reply_id=${actionID}, Time_Update='${cc}' where FK_track_id=${selectedTarget.serial} and FK_brigade_id=${selectedEngager.id};`;
    if (currentAction == "cantco") {
      con.query(sql, function (err, result) {
        btn.disabled = false;
        if (err) {
          throw err;
        }
        setTimeout(deleteRecord, 2000, selectedTarget, selectedEngager);
      });
    } else {
      con.query(sql, function (err, result) {
        btn.disabled = false;
        if (err) {
          throw err;
        }
      });
    }
  }
}

function deleteRecord(target, engager) {
  var selectedTarget = target;
  var selectedEngager = engager;

  if (selectedEngager.constructor.name === "Battalion") {
    var sql = `
          DELETE FROM ${dbName}.${configuration["engagement"]}
          WHERE FK_ID_All_Track = ${selectedTarget.serial}
          AND FK_ID_Bat_Real = ${selectedEngager.id};
    `;
  } else if (selectedEngager.constructor.name === "Brigade") {
    var sql = `
          DELETE FROM ${dbName}.${configuration["highlevel_engagement"]}
          WHERE FK_track_id = ${selectedTarget.serial}
          AND FK_brigade_id = ${selectedEngager.id};
    `;
  }



  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log("DELETED");
  });
}

var showActionsOpened = false;
var displayOptionsOpened = false;

var entireScreenRef: any = document.getElementById("EntireScreen");

var displayOptionsSidePanelRef: any = document.getElementById(
  "displayOptionsSidePanel"
);
var actionsSidePanelRef = document.getElementById("actionsSidePanel");

function showDisplayOptions() {
  if (displayOptionsOpened) {
    // polylineMeasure.remove();

    // Hide the side panel div.
    displayOptionsSidePanelRef.style.display = "none";
    // Set the map to take the whole screen.
    entireScreenRef.className = "EntireScreen-Container-Without-SidePanel";
  } else {
    // polylineMeasure.addTo(map);
    actionsSidePanelRef.style.display = "none";
    showActionsOpened = false;

    // Show the side panel.
    displayOptionsSidePanelRef.style.display = "flex";
    // Resize the map with the rest of the space.
    entireScreenRef.className = "EntireScreen-Container-With-SidePanel";
  }
  map.invalidateSize();
  displayOptionsOpened = !displayOptionsOpened;
}

function showActions() {
  if (showActionsOpened) {
    actionsSidePanelRef.style.display = "none";
    // Set the map to take the whole screen.
    entireScreenRef.className = "EntireScreen-Container-Without-SidePanel";
  } else {
    displayOptionsSidePanelRef.style.display = "none";
    polylineMeasure.remove();

    displayOptionsOpened = false;

    // Show the side panel.
    actionsSidePanelRef.style.display = "flex";
    // Resize the map with the rest of the space.
    entireScreenRef.className = "EntireScreen-Container-With-SidePanel";
  }
  showActionsOpened = !showActionsOpened;
}
