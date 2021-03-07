import { Battalion } from "./battalion";
import { Engager } from "./engager";

export class Brigade extends Engager {
  constructor(
    public name: string,
    public lat: number,
    public lon: number,
    public battalions: Battalion[],
    public id: number
  ) {
    super(name, lat, lon, id);
  }
}

export class Brigades {
  brigades: Brigade[] = [];
  private static instance: Brigades;
  private brigIcon = L.icon({
    iconUrl: "../images/brigade.png",
    iconSize: defaultIconSize,
    iconAnchor: defaultAnchorScale, // point of the icon which will correspond to marker's location
    popupAnchor: [-3, -20], // point from which the popup should open relative to the iconAnchor
  });

  private constructor() {
    if (Brigades.instance) {
      throw new Error(
        "Error: Instantiation failed: Use Brigades.getInstance() instead of new."
      );
    } else {
      Brigades.instance = this;
    }
  }

  public static getInstance(): Brigades {
    if (!Brigades.instance) {
      Brigades.instance = new Brigades();
    }

    return Brigades.instance;
  }

  public addBrigade(
    name: string,
    lat: number,
    lon: number,
    battalions: Battalion[],
    id: number
  ): Brigade {
    let b = new Brigade(name, lat, lon, battalions, id);
    this.brigades.push(b);
    return b;
  }

  public getBrigadeAtIndex(index) {
    return this.brigades[index];
  }

  public get numberOfBrigades() {
    return this.brigades.length;
  }

  public deleteBrigadeWithName(name) {
    this.brigades = this.brigades.filter((item) => item.name != name);
  }

  public getBrigadeWithName(name) {
    for (var i = 0; i < this.brigades.length; i++) {
      if (this.brigades[i].name == name) {
        return this.brigades[i];
      }
    }
    return undefined;
  }

  public getBrigadeWithId(id) {
    for (var i = 0; i < this.brigades.length; i++) {
      if (this.brigades[i].id == id) {
        return this.brigades[i];
      }
    }
    return undefined;
  }

  public scaleIcons(sizeScaled, anchorScaled) {
    this.brigIcon = L.icon({
      iconUrl: "../images/brigade.png",
      iconSize: sizeScaled,
      iconAnchor: anchorScaled,
    });
  }

  public showBrigades() {
    return new L.featureGroup(this.renderMarkers());
  }

  private renderMarkers() {
    var markers = [];
    var brigadeIcon = this.brigIcon;
    var cb_G: any = document.getElementById("G");

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
  }
}
