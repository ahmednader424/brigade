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
exports.Brigades = exports.Brigade = void 0;
var engager_1 = require("./engager");
var Brigade = /** @class */ (function (_super) {
    __extends(Brigade, _super);
    function Brigade(name, lat, lon, battalions, id) {
        var _this = _super.call(this, name, lat, lon, id) || this;
        _this.name = name;
        _this.lat = lat;
        _this.lon = lon;
        _this.battalions = battalions;
        _this.id = id;
        return _this;
    }
    return Brigade;
}(engager_1.Engager));
exports.Brigade = Brigade;
var Brigades = /** @class */ (function () {
    function Brigades() {
        this.brigades = [];
        this.brigIcon = L.icon({
            iconUrl: "../images/brigade.png",
            iconSize: defaultIconSize,
            iconAnchor: defaultAnchorScale,
            popupAnchor: [-3, -20],
        });
        if (Brigades.instance) {
            throw new Error("Error: Instantiation failed: Use Brigades.getInstance() instead of new.");
        }
        else {
            Brigades.instance = this;
        }
    }
    Brigades.getInstance = function () {
        if (!Brigades.instance) {
            Brigades.instance = new Brigades();
        }
        return Brigades.instance;
    };
    Brigades.prototype.addBrigade = function (name, lat, lon, battalions, id) {
        var b = new Brigade(name, lat, lon, battalions, id);
        this.brigades.push(b);
        return b;
    };
    Brigades.prototype.getBrigadeAtIndex = function (index) {
        return this.brigades[index];
    };
    Object.defineProperty(Brigades.prototype, "numberOfBrigades", {
        get: function () {
            return this.brigades.length;
        },
        enumerable: false,
        configurable: true
    });
    Brigades.prototype.deleteBrigadeWithName = function (name) {
        this.brigades = this.brigades.filter(function (item) { return item.name != name; });
    };
    Brigades.prototype.getBrigadeWithName = function (name) {
        for (var i = 0; i < this.brigades.length; i++) {
            if (this.brigades[i].name == name) {
                return this.brigades[i];
            }
        }
        return undefined;
    };
    Brigades.prototype.getBrigadeWithId = function (id) {
        for (var i = 0; i < this.brigades.length; i++) {
            if (this.brigades[i].id == id) {
                return this.brigades[i];
            }
        }
        return undefined;
    };
    Brigades.prototype.scaleIcons = function (sizeScaled, anchorScaled) {
        this.brigIcon = L.icon({
            iconUrl: "../images/brigade.png",
            iconSize: sizeScaled,
            iconAnchor: anchorScaled,
        });
    };
    Brigades.prototype.showBrigades = function () {
        return new L.featureGroup(this.renderMarkers());
    };
    Brigades.prototype.renderMarkers = function () {
        var markers = [];
        var brigadeIcon = this.brigIcon;
        var cb_G = document.getElementById("G");
        for (var i = 0; i < this.brigades.length; i++) {
            var b = this.brigades[i];
            var marker = L.marker([b.lat, b.lon], {
                icon: brigadeIcon,
            }).bindTooltip(b.name, {
                permanent: cb_G.checked && !tooltipHidden,
            });
            marker.brigade = b;
            markers.push(marker);
        }
        return markers;
    };
    return Brigades;
}());
exports.Brigades = Brigades;
