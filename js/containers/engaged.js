"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Engaged = void 0;
var Engaged = /** @class */ (function () {
    function Engaged(name, lat, lon, serial) {
        this.name = name;
        this.lat = lat;
        this.lon = lon;
        this.serial = serial;
    }
    Engaged.prototype.engagedAction = function () {
        console.log("Engaged");
    };
    return Engaged;
}());
exports.Engaged = Engaged;
