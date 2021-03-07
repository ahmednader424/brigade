import { Engager } from "./engager";
import { Target } from './target';

export class Engagement {
  constructor(
    public engager: Engager,
    public target: Target,
    public actionType: string,
    public actionLine: any,
    public selected = false,
    public valid: boolean
  ) { }
}

export class Engagements {
  public engager: Engager;
  public target: Target;
  private selectionCircleEngager: any;
  private selectionCircleTarget: any;

  private engagements: Engagement[] = [];
  private static instance: Engagements;

  private constructor() {
    if (Engagements.instance) {
      throw new Error(
        "Error: Instantiation failed: Use Engagements.getInstance() instead of new."
      );
    } else {
      Engagements.instance = this;
    }
  }

  public static getInstance(): Engagements {
    if (!Engagements.instance) {
      Engagements.instance = new Engagements();
    }

    return Engagements.instance;
  }

  public get numberOfEngagements(): number {
    return this.engagements.length;
  }

  public setActionLine(engager: Engager, target: Target, actionType: string): void {
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
    } else {
      // if (target.type == "H") {
      e = new Engagement(engager, target, undefined, undefined, false, true);
      this.engagements.push(e);
      // }
    }
  }

  public resetBattalionEngagements(): void {
    for (var i = 0; i < this.engagements.length; i++) {
      if (this.engagements[i].engager.constructor.name == "Battalion") {
        this.engagements[i].valid = false;
      }
    }
  }

  public resetBrigadeEngagements(): void {
    for (var i = 0; i < this.engagements.length; i++) {
      if (this.engagements[i].engager.constructor.name == "Brigade") {
        this.engagements[i].valid = false;
      }
    }
  }

  public removeInvalid(): void {
    for (var i = 0; i < this.engagements.length; i++) {
      if (!this.engagements[i].valid) {
        // console.log("Cancelling action for " + this.engagements[i].engager + this.engagements[i].target);
        this.cancelActionFor(this.engagements[i].engager, this.engagements[i].target);
        this.engagements.splice(i, 1);
      }
    }
  }

  public getSelected(): ({ engager: Engager; target: Target } | undefined) {
    if (this.engager != undefined && this.target != undefined) {
      return { engager: this.engager, target: this.target };
    } else {
      return undefined;
    }
  }

  public deselectAll(): void {
    for (var i = 0; i < this.engagements.length; i++) {
      this.engagements[i].selected = false;
    }
  }

  public cancelCurrentAction(): void {
    // alert("Cancelling")
    this.deselectAll();
    this.engager = undefined;
    this.target = undefined;
    this.removeCircles();
  }

  public cancelActionFor(engager: Engager, target: Target): void {
    var e = this.engagementExists(engager.name, target.name);
    if (e != undefined) {
      if (e.actionLine != undefined) {
        e.actionLine.remove();
      }
      e.actionType = undefined;
      e.actionLine = undefined;
      this.removeCircles();
    }
  }

  public removeCircles(): void {
    if (this.selectionCircleTarget != undefined) {
      this.selectionCircleTarget.remove();
    }
    if (this.selectionCircleEngager != undefined) {
      this.selectionCircleEngager.remove();
    }
    this.selectionCircleTarget = undefined;
    this.selectionCircleEngager = undefined;
  }

  public engagementExists(engagerName: string, targetName: string): (Engagement | undefined) {
    for (var i = 0; i < this.engagements.length; i++) {
      if (
        this.engagements[i].engager.name == engagerName &&
        this.engagements[i].target.name == targetName
      ) {
        return this.engagements[i];
      }
    }
    return undefined;
  }

  public engagementExistsForId(engagerId: number, targetSerial: number): (Engagement | undefined) {
    for (var i = 0; i < this.engagements.length; i++) {
      // console.log(this.engagements[i].engager.id)
      // console.log(this.engagements[i].target.serial)
      if (
        this.engagements[i].engager.id == engagerId &&
        this.engagements[i].target.serial == targetSerial
      ) {
        return this.engagements[i];
      }
    }
    return undefined;
  }

  public drawSelectionCircles(): void {
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
  }

  public selectEngager(engager: Engager): void {
    // console.log("Selected engager");
    this.engager = engager;
    if (this.target != undefined) {
      // An engagement could be made
      var e = this.engagementExists(this.engager.name, this.target.name);
      if (e == undefined) {
        // console.log(`Engagement Doesn't exist. Creating new engagement with ${this.engager.name} and ${this.target.name}`);
        this.deselectAll();
        // if (this.target.type == "H") {
        var eng = new Engagement(
          this.engager,
          this.target,
          undefined,
          undefined,
          true,
          true
        );
        this.engagements.push(eng);
        // }
        this.removeCircles();
      } else {
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
  }

  public selectTarget(target: Target): void {
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
        var eng = new Engagement(
          this.engager,
          this.target,
          undefined,
          undefined,
          true,
          true
        );
        this.engagements.push(eng);
        // }
      } else {
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

    this.selectionCircleTarget = new L.circleMarker(
      [this.target.lat, this.target.lon],
      {
        color: "darkorange",
        fillColor: "darkorange",
        fillOpacity: 0,
        radius: 10,
      }
    ).addTo(map);
  }
}
