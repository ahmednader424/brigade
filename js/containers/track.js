"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tracks = exports.Track = void 0;
var target_1 = require("./target");
var Track = /** @class */ (function (_super) {
    __extends(Track, _super);
    function Track(name, lat, lon, serial, vX, vY, type, speed, alt, tq, size) {
        var _this = _super.call(this, name, lat, lon, serial) || this;
        _this.name = name;
        _this.lat = lat;
        _this.lon = lon;
        _this.serial = serial;
        _this.vX = vX;
        _this.vY = vY;
        _this.type = type;
        _this.speed = speed;
        _this.alt = alt;
        _this.tq = tq;
        _this.size = size;
        return _this;
    }
    return Track;
}(target_1.Target));
exports.Track = Track;
var Tracks = /** @class */ (function () {
    function Tracks() {
        this.tracks = [];
        this.trackIcon_friendly = L.icon({
            iconUrl: "../images/track_F.png",
            iconSize: defaultIconSize,
            iconAnchor: defaultAnchorScale,
        });
        this.trackIcon_hostile = L.icon({
            iconUrl: "../images/track_H.png",
            iconSize: defaultIconSize,
            iconAnchor: defaultAnchorScale,
        });
        this.trackIcon_p = L.icon({
            iconUrl: "../images/track_P.png",
            iconSize: defaultIconSize,
            iconAnchor: defaultAnchorScale,
        });
        if (Tracks.instance) {
            throw new Error("Error: Instantiation failed: Use Tracks.getInstance() instead of new.");
        }
        else {
            Tracks.instance = this;
        }
    }
    Tracks.getInstance = function () {
        if (!Tracks.instance) {
            Tracks.instance = new Tracks();
        }
        return Tracks.instance;
    };
    Tracks.prototype.addTrack = function (name, lat, lon, serial, vX, vY, type, speed, alt, tq, size) {
        var p = new Track(name, lat, lon, serial, vX, vY, type, speed, alt, tq, size);
        this.tracks.push(p);
        return p;
    };
    Tracks.prototype.scaleIcons = function (sizeScaled, anchorScaled) {
        this.trackIcon_friendly = L.icon({
            iconUrl: "../images/track_F.png",
            iconSize: sizeScaled,
            iconAnchor: anchorScaled,
        });
        this.trackIcon_hostile = L.icon({
            iconUrl: "../images/track_H.png",
            iconSize: sizeScaled,
            iconAnchor: anchorScaled,
        });
        this.trackIcon_p = L.icon({
            iconUrl: "../images/track_P.png",
            iconSize: sizeScaled,
            iconAnchor: anchorScaled,
        });
    };
    Tracks.prototype.getTrackAtIndex = function (index) {
        return this.tracks[index];
    };
    Tracks.prototype.getTrackWithName = function (name) {
        for (var i = 0; i < this.tracks.length; i++) {
            if (this.tracks[i].name == name) {
                return this.tracks[i];
            }
        }
        return undefined;
    };
    Tracks.prototype.getTrackWithSerial = function (serial) {
        for (var i = 0; i < this.tracks.length; i++) {
            if (this.tracks[i].serial == serial) {
                return this.tracks[i];
            }
        }
        return undefined;
    };
    Object.defineProperty(Tracks.prototype, "numberOfTracks", {
        get: function () {
            return this.tracks.length;
        },
        enumerable: false,
        configurable: true
    });
    Tracks.prototype.deleteTrackWithName = function (name) {
        this.tracks = this.tracks.filter(function (item) { return item.name != name; });
    };
    Tracks.prototype.emptyTracks = function () {
        this.tracks = [];
    };
    Tracks.prototype.trackExists = function (name) {
        for (var i = 0; i < this.tracks.length; i++) {
            if (this.tracks[i].name == name) {
                return true;
            }
        }
        return false;
    };
    Tracks.prototype.showTracks = function () {
        return new L.featureGroup(this.renderMarkers());
    };
    Tracks.prototype.renderPopupDataForTrack = function (track) {
        var cb_A = document.getElementById("A");
        var cb_B = document.getElementById("B");
        var cb_C = document.getElementById("C");
        var cb_D = document.getElementById("D");
        var content = [];
        if (cb_A.checked) {
            content.push(track.name);
        }
        if (cb_B.checked) {
            content.push(track.alt);
        }
        if (cb_C.checked) {
            content.push(track.tq);
        }
        if (cb_D.checked) {
            content.push(track.speed);
        }
        var contentHTML = "<div>";
        var g = 0;
        for (var i = 0; i < content.length; i++) {
            if (g == 0) {
                if (i == content.length - 1) {
                    contentHTML +=
                        '<span class="infoText" style="margin: 1px;">' +
                            content[i] +
                            "</span>";
                }
                else {
                    contentHTML +=
                        '<span class="infoText" style="margin: 1px;">' +
                            content[i] +
                            " / </span>";
                }
            }
            else if (g == 1) {
                contentHTML +=
                    '<span class="infoText" style="margin: 1px;">' +
                        content[i] +
                        "</span>";
            }
            else {
                g = 0;
                contentHTML += "<br>";
                if (i == content.length - 1) {
                    contentHTML +=
                        '<span class="infoText" style="margin: 1px;">' +
                            content[i] +
                            "</span>";
                }
                else {
                    contentHTML +=
                        '<span class="infoText" style="margin: 1px;">' +
                            content[i] +
                            " / </span>";
                }
            }
            g++;
        }
        contentHTML += "</div>";
        if (content.length == 0) {
            return undefined;
        }
        else {
            return contentHTML;
        }
    };
    Tracks.prototype.renderMarkers = function () {
        var markers = [];
        for (var i = 0; i < this.tracks.length; i++) {
            var track = this.tracks[i];
            var trackIcon = undefined;
            switch (track.type) {
                case "F":
                    trackIcon = this.trackIcon_friendly;
                    break;
                case "H":
                    trackIcon = this.trackIcon_hostile;
                    break;
                case "S":
                    trackIcon = this.trackIcon_friendly;
                    break;
                case "P":
                    trackIcon = this.trackIcon_p;
                    break;
                default:
                    console.log("No matches");
            }
            var dataToBeShown = false;
            var content = this.renderPopupDataForTrack(track);
            if (content != undefined) {
                dataToBeShown = true;
            }
            var marker = L.marker([track.lat, track.lon], {
                icon: trackIcon,
            }).bindTooltip(this.renderPopupDataForTrack(track), {
                permanent: !tooltipHidden && dataToBeShown,
            });
            marker.track = track;
            var x = track.vX;
            var y = track.vY;
            marker.setRotationAngle(Math.atan2(x, y) * (180 / Math.PI) - 45);
            markers.push(marker);
        }
        return markers;
    };
    return Tracks;
}());
exports.Tracks = Tracks;
