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
exports.Battalions = exports.Battalion = void 0;
var engager_1 = require("./engager");
var Battalion = /** @class */ (function (_super) {
    __extends(Battalion, _super);
    function Battalion(name, lat, lon, radius, id, type, availability, linkStatus, alertStatus, paramId, alt, hot_missles, cold_missles, launcher_status) {
        var _this = _super.call(this, name, lat, lon, id) || this;
        _this.name = name;
        _this.lat = lat;
        _this.lon = lon;
        _this.radius = radius;
        _this.id = id;
        _this.type = type;
        _this.availability = availability;
        _this.linkStatus = linkStatus;
        _this.alertStatus = alertStatus;
        _this.paramId = paramId;
        _this.alt = alt;
        _this.hot_missles = hot_missles;
        _this.cold_missles = cold_missles;
        _this.launcher_status = launcher_status;
        return _this;
    }
    return Battalion;
}(engager_1.Engager));
exports.Battalion = Battalion;
var Battalions = /** @class */ (function () {
    function Battalions() {
        this.battalions = [];
        this.battalionIcon_volga = L.icon({
            iconUrl: "../images/volga.png",
            iconSize: defaultIconSize,
            iconAnchor: defaultAnchorScale,
        });
        this.battalionIcon_bitchura = L.icon({
            iconUrl: "../images/bitchura.png",
            iconSize: defaultIconSize,
            iconAnchor: defaultAnchorScale,
        });
        this.battalionIcon_amon = L.icon({
            iconUrl: "../images/amon.png",
            iconSize: defaultIconSize,
            iconAnchor: defaultAnchorScale,
        });
        this.battalionIcon_hawk = L.icon({
            iconUrl: "../images/hawk.png",
            iconSize: defaultIconSize,
            iconAnchor: defaultAnchorScale,
        });
        if (Battalions.instance) {
            throw new Error("Error: Instantiation failed: Use Battalions.getInstance() instead of new.");
        }
        else {
            Battalions.instance = this;
        }
    }
    Battalions.getInstance = function () {
        if (!Battalions.instance) {
            Battalions.instance = new Battalions();
        }
        return Battalions.instance;
    };
    Battalions.prototype.addBattalion = function (name, lat, lon, radius, id, type, availability, linkStatus, alertStatus, paramId, alt, hot_missles, cold_missles, launcher_status) {
        var s = new Battalion(name, lat, lon, radius, id, type, availability, linkStatus, alertStatus, paramId, alt, hot_missles, cold_missles, launcher_status);
        this.battalions.push(s);
        return s;
    };
    Battalions.prototype.getBattalionAtIndex = function (index) {
        return this.battalions[index];
    };
    Object.defineProperty(Battalions.prototype, "numberOfBattalions", {
        get: function () {
            return this.battalions.length;
        },
        enumerable: false,
        configurable: true
    });
    Battalions.prototype.getBattalionWithName = function (name) {
        for (var i = 0; i < this.battalions.length; i++) {
            if (this.battalions[i].name == name) {
                return this.battalions[i];
            }
        }
        return undefined;
    };
    Battalions.prototype.getBattalionWithId = function (id) {
        for (var i = 0; i < this.battalions.length; i++) {
            if (this.battalions[i].id == id) {
                return this.battalions[i];
            }
        }
        return undefined;
    };
    Battalions.prototype.deleteBattalionWithName = function (name) {
        this.battalions = this.battalions.filter(function (item) { return item.name != name; });
    };
    Battalions.prototype.emptybattalions = function () {
        this.battalions = [];
    };
    Battalions.prototype.battalionExists = function (name) {
        for (var i = 0; i < this.battalions.length; i++) {
            if (this.battalions[i].name == name) {
                return true;
            }
        }
        return false;
    };
    Battalions.prototype.scaleIcons = function (sizeScaled, anchorScaled) {
        this.battalionIcon_hawk = L.icon({
            iconUrl: "../images/hawk.png",
            iconSize: sizeScaled,
            iconAnchor: anchorScaled,
        });
        this.battalionIcon_volga = L.icon({
            iconUrl: "../images/volga.png",
            iconSize: sizeScaled,
            iconAnchor: anchorScaled,
        });
        this.battalionIcon_amon = L.icon({
            iconUrl: "../images/amon.png",
            iconSize: sizeScaled,
            iconAnchor: anchorScaled,
        });
        this.battalionIcon_bitchura = L.icon({
            iconUrl: "../images/bitchura.png",
            iconSize: sizeScaled,
            iconAnchor: anchorScaled,
        });
    };
    Battalions.prototype.showBattalions = function () {
        return new L.featureGroup(this.renderMarkers());
    };
    Battalions.prototype.renderPopupDataForBattalion = function (bat) {
        var cb_E = document.getElementById("E");
        var cb_F = document.getElementById("F");
        var cb_G = document.getElementById("G");
        var content = [];
        if (cb_G.checked) {
            content.push(bat.name);
        }
        if (cb_E.checked) {
            content.push(bat.hot_missles);
        }
        if (cb_F.checked) {
            content.push(bat.cold_missles);
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
    Battalions.prototype.renderMarkers = function () {
        var markers = [];
        for (var i = 0; i < this.battalions.length; i++) {
            var battalionIcon = undefined;
            var battalion = this.battalions[i];
            switch (battalion.type) {
                case "Volga":
                    battalionIcon = this.battalionIcon_volga;
                    break;
                case "Bitchura":
                    battalionIcon = this.battalionIcon_bitchura;
                    break;
                case "Amon":
                    battalionIcon = this.battalionIcon_amon;
                    break;
                case "Hawk":
                    battalionIcon = this.battalionIcon_hawk;
                    break;
                default:
                    console.log("No matches");
            }
            var dataToBeShown = false;
            var content = this.renderPopupDataForBattalion(battalion);
            if (content != undefined) {
                dataToBeShown = true;
            }
            var marker = L.marker([battalion.lat, battalion.lon], {
                icon: battalionIcon,
            }).bindTooltip(content, {
                permanent: !tooltipHidden && dataToBeShown,
            });
            marker.bat = battalion;
            markers.push(marker);
        }
        return markers;
    };
    return Battalions;
}());
exports.Battalions = Battalions;
