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
exports.Fers = exports.Fer = void 0;
var engager_1 = require("./engager");
var Fer = /** @class */ (function (_super) {
    __extends(Fer, _super);
    function Fer(name, lat, lon, radius, id, type, availability, linkStatus, alertStatus, paramId, alt, hot_missles, cold_missles, launcher_status) {
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
        _super.prototype.engagerAction.call(_this);
        return _this;
    }
    return Fer;
}(engager_1.Engager));
exports.Fer = Fer;
var Fers = /** @class */ (function () {
    function Fers() {
        this.fers = [];
        this.ferIcon_volga = L.icon({
            iconUrl: "../images/volga.png",
            iconSize: defaultIconSize,
            iconAnchor: defaultAnchorScale,
        });
        this.ferIcon_bitchura = L.icon({
            iconUrl: "../images/bitchura.png",
            iconSize: defaultIconSize,
            iconAnchor: defaultAnchorScale,
        });
        this.ferIcon_amon = L.icon({
            iconUrl: "../images/amon.png",
            iconSize: defaultIconSize,
            iconAnchor: defaultAnchorScale,
        });
        this.ferIcon_hawk = L.icon({
            iconUrl: "../images/hawk.png",
            iconSize: defaultIconSize,
            iconAnchor: defaultAnchorScale,
        });
        if (Fers.instance) {
            throw new Error("Error: Instantiation failed: Use Fers.getInstance() instead of new.");
        }
        else {
            Fers.instance = this;
        }
    }
    Fers.getInstance = function () {
        if (!Fers.instance) {
            Fers.instance = new Fers();
        }
        return Fers.instance;
    };
    Fers.prototype.addFer = function (name, lat, lon, radius, id, type, availability, linkStatus, alertStatus, paramId, alt, hot_missles, cold_missles, launcher_status) {
        var s = new Fer(name, lat, lon, radius, id, type, availability, linkStatus, alertStatus, paramId, alt, hot_missles, cold_missles, launcher_status);
        this.fers.push(s);
        return s;
    };
    Fers.prototype.getFerAtIndex = function (index) {
        return this.fers[index];
    };
    Object.defineProperty(Fers.prototype, "numberOfFers", {
        get: function () {
            return this.fers.length;
        },
        enumerable: false,
        configurable: true
    });
    Fers.prototype.getFerWithName = function (name) {
        for (var i = 0; i < this.fers.length; i++) {
            if (this.fers[i].name == name) {
                return this.fers[i];
            }
        }
        return undefined;
    };
    Fers.prototype.getFerWithId = function (id) {
        for (var i = 0; i < this.fers.length; i++) {
            if (this.fers[i].id == id) {
                return this.fers[i];
            }
        }
        return undefined;
    };
    Fers.prototype.deleteFerWithName = function (name) {
        this.fers = this.fers.filter(function (item) { return item.name != name; });
    };
    Fers.prototype.emptyfers = function () {
        this.fers = [];
    };
    Fers.prototype.ferExists = function (name) {
        for (var i = 0; i < this.fers.length; i++) {
            if (this.fers[i].name == name) {
                return true;
            }
        }
        return false;
    };
    Fers.prototype.scaleIcons = function (sizeScaled, anchorScaled) {
        this.ferIcon_hawk = L.icon({
            iconUrl: "../images/hawk.png",
            iconSize: sizeScaled,
            iconAnchor: anchorScaled,
        });
        this.ferIcon_volga = L.icon({
            iconUrl: "../images/volga.png",
            iconSize: sizeScaled,
            iconAnchor: anchorScaled,
        });
        this.ferIcon_amon = L.icon({
            iconUrl: "../images/amon.png",
            iconSize: sizeScaled,
            iconAnchor: anchorScaled,
        });
        this.ferIcon_bitchura = L.icon({
            iconUrl: "../images/bitchura.png",
            iconSize: sizeScaled,
            iconAnchor: anchorScaled,
        });
    };
    Fers.prototype.showFers = function () {
        return new L.featureGroup(this.renderMarkers());
    };
    Fers.prototype.renderPopupDataForFer = function (bat) {
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
    Fers.prototype.renderMarkers = function () {
        var markers = [];
        for (var i = 0; i < this.fers.length; i++) {
            var ferIcon = undefined;
            var fer = this.fers[i];
            switch (fer.type) {
                case "Volga":
                    ferIcon = this.ferIcon_volga;
                    break;
                case "Bitchura":
                    ferIcon = this.ferIcon_bitchura;
                    break;
                case "Amon":
                    ferIcon = this.ferIcon_amon;
                    break;
                case "Hawk":
                    ferIcon = this.ferIcon_hawk;
                    break;
                default:
                    console.log("No matches");
            }
            var dataToBeShown = false;
            var content = this.renderPopupDataForFer(fer);
            if (content != undefined) {
                dataToBeShown = true;
            }
            var marker = L.marker([fer.lat, fer.lon], {
                icon: ferIcon,
            }).bindTooltip(content, {
                permanent: !tooltipHidden && dataToBeShown,
            });
            marker.bat = fer;
            markers.push(marker);
        }
        return markers;
    };
    return Fers;
}());
exports.Fers = Fers;
