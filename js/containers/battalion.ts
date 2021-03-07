import { Engager } from "./engager";


export class Battalion extends Engager {
  constructor(
    public name: string,
    public lat: number,
    public lon: number,
    public radius: number,
    public id: number,
    public type: string,
    public availability: number,
    public linkStatus: number,
    public alertStatus: number,
    public paramId: number,
    public alt: number,
    public hot_missles: number,
    public cold_missles: number,
    public launcher_status: number
  ) {
    super(name, lat, lon, id);
  }
}

export class Battalions {
  battalions: Battalion[] = [];
  private static instance: Battalions;
  private battalionIcon_volga = L.icon({
    iconUrl: "../images/volga.png",
    iconSize: defaultIconSize,
    iconAnchor: defaultAnchorScale,
  });

  private battalionIcon_bitchura = L.icon({
    iconUrl: "../images/bitchura.png",
    iconSize: defaultIconSize,
    iconAnchor: defaultAnchorScale,
  });

  private battalionIcon_amon = L.icon({
    iconUrl: "../images/amon.png",
    iconSize: defaultIconSize,
    iconAnchor: defaultAnchorScale,
  });

  private battalionIcon_hawk = L.icon({
    iconUrl: "../images/hawk.png",
    iconSize: defaultIconSize,
    iconAnchor: defaultAnchorScale,
  });

  private constructor() {
    if (Battalions.instance) {
      throw new Error(
        "Error: Instantiation failed: Use Battalions.getInstance() instead of new."
      );
    } else {
      Battalions.instance = this;
    }
  }

  public static getInstance(): Battalions {
    if (!Battalions.instance) {
      Battalions.instance = new Battalions();
    }

    return Battalions.instance;
  }

  public addBattalion(
    name: string,
    lat: number,
    lon: number,
    radius: number,
    id: number,
    type: string,
    availability: number,
    linkStatus: number,
    alertStatus: number,
    paramId: number,
    alt: number,
    hot_missles: number,
    cold_missles: number,
    launcher_status: number
  ): Battalion {
    let s = new Battalion(
      name,
      lat,
      lon,
      radius,
      id,
      type,
      availability,
      linkStatus,
      alertStatus,
      paramId,
      alt,
      hot_missles,
      cold_missles,
      launcher_status
    );
    this.battalions.push(s);
    return s;
  }

  public getBattalionAtIndex(index) {
    return this.battalions[index];
  }
  public get numberOfBattalions() {
    return this.battalions.length;
  }

  public getBattalionWithName(name) {
    for (var i = 0; i < this.battalions.length; i++) {
      if (this.battalions[i].name == name) {
        return this.battalions[i];
      }
    }
    return undefined;
  }

  public getBattalionWithId(id) {
    for (var i = 0; i < this.battalions.length; i++) {
      if (this.battalions[i].id == id) {
        return this.battalions[i];
      }
    }
    return undefined;
  }

  public deleteBattalionWithName(name) {
    this.battalions = this.battalions.filter((item) => item.name != name);
  }

  public emptybattalions() {
    this.battalions = [];
  }

  public battalionExists(name) {
    for (var i = 0; i < this.battalions.length; i++) {
      if (this.battalions[i].name == name) {
        return true;
      }
    }
    return false;
  }

  public scaleIcons(sizeScaled, anchorScaled) {
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
  }

  public showBattalions() {
    return new L.featureGroup(this.renderMarkers());
  }

  private renderPopupDataForBattalion(bat) {
    var cb_E: any = document.getElementById("E");
    var cb_F: any = document.getElementById("F");
    var cb_G: any = document.getElementById("G");
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
        } else {
          contentHTML +=
            '<span class="infoText" style="margin: 1px;">' +
            content[i] +
            " / </span>";
        }
      } else if (g == 1) {
        contentHTML +=
          '<span class="infoText" style="margin: 1px;">' +
          content[i] +
          "</span>";
      } else {
        g = 0;
        contentHTML += "<br>";
        if (i == content.length - 1) {
          contentHTML +=
            '<span class="infoText" style="margin: 1px;">' +
            content[i] +
            "</span>";
        } else {
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
    } else {
      return contentHTML;
    }
  }

  private renderMarkers() {
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
  }
}
