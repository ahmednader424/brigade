"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Engagements = exports.Engagement = void 0;
var Engagement = /** @class */ (function () {
    function Engagement(engager, target, actionType, actionLine, selected, valid) {
        if (selected === void 0) { selected = false; }
        this.engager = engager;
        this.target = target;
        this.actionType = actionType;
        this.actionLine = actionLine;
        this.selected = selected;
        this.valid = valid;
    }
    return Engagement;
}());
exports.Engagement = Engagement;
var Engagements = /** @class */ (function () {
    function Engagements() {
        this.engagements = [];
        if (Engagements.instance) {
            throw new Error("Error: Instantiation failed: Use Engagements.getInstance() instead of new.");
        }
        else {
            Engagements.instance = this;
        }
    }
    Engagements.getInstance = function () {
        if (!Engagements.instance) {
            Engagements.instance = new Engagements();
        }
        return Engagements.instance;
    };
    Object.defineProperty(Engagements.prototype, "numberOfEngagements", {
        get: function () {
            return this.engagements.length;
        },
        enumerable: false,
        configurable: true
    });
    Engagements.prototype.setActionLine = function (engager, target, actionType) {
        var e = this.engagementExists(engager.name, target.name);
        if (e != undefined) {
            if (e.actionLine != undefined) {
                e.actionLine.remove();
                e.actionLine = undefined;
                e.actionType = undefined;
            }
            e.engager = engager;
            e.target = target;
            e.actionType = actionType;
            e.valid = true;
            e.actionLine = drawActionLine(engager, target, actionType);
        }
        else {
            // if (target.type == "H") {
            e = new Engagement(engager, target, undefined, undefined, false, true);
            this.engagements.push(e);
            // }
        }
    };
    Engagements.prototype.resetBattalionEngagements = function () {
        for (var i = 0; i < this.engagements.length; i++) {
            if (this.engagements[i].engager.constructor.name == "Battalion") {
                this.engagements[i].valid = false;
            }
        }
    };
    Engagements.prototype.resetBrigadeEngagements = function () {
        for (var i = 0; i < this.engagements.length; i++) {
            if (this.engagements[i].engager.constructor.name == "Brigade") {
                this.engagements[i].valid = false;
            }
        }
    };
    Engagements.prototype.removeInvalid = function () {
        for (var i = 0; i < this.engagements.length; i++) {
            if (!this.engagements[i].valid) {
                // console.log("Cancelling action for " + this.engagements[i].engager + this.engagements[i].target);
                this.cancelActionFor(this.engagements[i].engager, this.engagements[i].target);
                this.engagements.splice(i, 1);
            }
        }
    };
    Engagements.prototype.getSelected = function () {
        if (this.engager != undefined && this.target != undefined) {
            return { engager: this.engager, target: this.target };
        }
        else {
            return undefined;
        }
    };
    Engagements.prototype.deselectAll = function () {
        for (var i = 0; i < this.engagements.length; i++) {
            this.engagements[i].selected = false;
        }
    };
    Engagements.prototype.cancelCurrentAction = function () {
        // alert("Cancelling")
        this.deselectAll();
        this.engager = undefined;
        this.target = undefined;
        this.removeCircles();
    };
    Engagements.prototype.cancelActionFor = function (engager, target) {
        var e = this.engagementExists(engager.name, target.name);
        if (e != undefined) {
            if (e.actionLine != undefined) {
                e.actionLine.remove();
            }
            e.actionType = undefined;
            e.actionLine = undefined;
            this.removeCircles();
        }
    };
    Engagements.prototype.removeCircles = function () {
        if (this.selectionCircleTarget != undefined) {
            this.selectionCircleTarget.remove();
        }
        if (this.selectionCircleEngager != undefined) {
            this.selectionCircleEngager.remove();
        }
        this.selectionCircleTarget = undefined;
        this.selectionCircleEngager = undefined;
    };
    Engagements.prototype.engagementExists = function (engagerName, targetName) {
        for (var i = 0; i < this.engagements.length; i++) {
            if (this.engagements[i].engager.name == engagerName &&
                this.engagements[i].target.name == targetName) {
                return this.engagements[i];
            }
        }
        return undefined;
    };
    Engagements.prototype.engagementExistsForId = function (engagerId, targetSerial) {
        for (var i = 0; i < this.engagements.length; i++) {
            // console.log(this.engagements[i].engager.id)
            // console.log(this.engagements[i].target.serial)
            if (this.engagements[i].engager.id == engagerId &&
                this.engagements[i].target.serial == targetSerial) {
                return this.engagements[i];
            }
        }
        return undefined;
    };
    Engagements.prototype.drawSelectionCircles = function () {
        // console.log("should be drawing")
        this.removeCircles();
        if (this.engager != undefined) {
            this.selectionCircleEngager = new L.circleMarker([this.engager.lat, this.engager.lon], {
                color: "darkorange",
                fillColor: "darkorange",
                fillOpacity: 0,
                radius: 10,
            }).addTo(map);
        }
        if (this.target != undefined) {
            this.selectionCircleTarget = new L.circleMarker([this.target.lat, this.target.lon], {
                color: "darkorange",
                fillColor: "darkorange",
                fillOpacity: 0,
                radius: 10,
            }).addTo(map);
        }
    };
    Engagements.prototype.selectEngager = function (engager) {
        // console.log("Selected engager");
        this.engager = engager;
        if (this.target != undefined) {
            // An engagement could be made
            var e = this.engagementExists(this.engager.name, this.target.name);
            if (e == undefined) {
                // console.log(`Engagement Doesn't exist. Creating new engagement with ${this.engager.name} and ${this.target.name}`);
                this.deselectAll();
                // if (this.target.type == "H") {
                var eng = new Engagement(this.engager, this.target, undefined, undefined, true, true);
                this.engagements.push(eng);
                // }
                this.removeCircles();
            }
            else {
                // console.log(`Already exists ${this.engager.name} and ${this.target.name}`);
                // console.log(e.selected)
                this.deselectAll();
                e.selected = true;
                e.valid = true;
                this.removeCircles();
            }
            this.drawSelectionCircles();
        }
        if (this.selectionCircleEngager != undefined) {
            this.selectionCircleEngager.remove();
            this.selectionCircleEngager = undefined;
        }
        this.selectionCircleEngager = new L.circleMarker([this.engager.lat, this.engager.lon], {
            color: "darkorange",
            fillColor: "darkorange",
            fillOpacity: 0,
            radius: 10,
        }).addTo(map);
    };
    Engagements.prototype.selectTarget = function (target) {
        // console.log("Selected target");
        this.target = target;
        if (this.engager != undefined) {
            // An engagement could be made
            // console.log("Starting a new engagement");
            // console.log("Checking if engagement already exists");
            var e = this.engagementExists(this.engager.name, this.target.name);
            if (e == undefined) {
                // console.log(`Engagement Doesn't exist. Creating new engagement with ${this.engager.name} and ${this.target.name}`);
                this.deselectAll();
                this.removeCircles();
                // if (this.target.type == "H") {
                var eng = new Engagement(this.engager, this.target, undefined, undefined, true, true);
                this.engagements.push(eng);
                // }
            }
            else {
                // console.log(`Already exists ${this.engager.name} and ${this.target.name}`);
                // console.log(e.selected);
                // if (!e.selected) {
                this.deselectAll();
                this.removeCircles();
                // }
                e.selected = true;
                e.valid = true;
                return;
            }
            this.drawSelectionCircles();
        }
        if (this.selectionCircleTarget != undefined) {
            this.selectionCircleTarget.remove();
            this.selectionCircleTarget = undefined;
        }
        this.selectionCircleTarget = new L.circleMarker([this.target.lat, this.target.lon], {
            color: "darkorange",
            fillColor: "darkorange",
            fillOpacity: 0,
            radius: 10,
        }).addTo(map);
    };
    return Engagements;
}());
exports.Engagements = Engagements;
