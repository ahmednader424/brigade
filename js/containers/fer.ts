import { Engager } from "./engager";


export class Fer extends Engager {
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

export class Fers {
  fers: Fer[] = [];
  private static instance: Fers;
  private ferIcon_volga = L.icon({
    iconUrl: "../images/volga.png",
    iconSize: defaultIconSize,
    iconAnchor: defaultAnchorScale,
  });

  private ferIcon_bitchura = L.icon({
    iconUrl: "../images/bitchura.png",
    iconSize: defaultIconSize,
    iconAnchor: defaultAnchorScale,
  });

  private ferIcon_amon = L.icon({
    iconUrl: "../images/amon.png",
    iconSize: defaultIconSize,
    iconAnchor: defaultAnchorScale,
  });

  private ferIcon_hawk = L.icon({
    iconUrl: "../images/hawk.png",
    iconSize: defaultIconSize,
    iconAnchor: defaultAnchorScale,
  });

  private constructor() {
    if (Fers.instance) {
      throw new Error(
        "Error: Instantiation failed: Use Fers.getInstance() instead of new."
      );
    } else {
      Fers.instance = this;
    }
  }

  public static getInstance(): Fers {
    if (!Fers.instance) {
      Fers.instance = new Fers();
    }

    return Fers.instance;
  }

  public addFer(
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
  ): Fer {
    let s = new Fer(
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
    this.fers.push(s);
    return s;
  }

  public getFerAtIndex(index) {
    return this.fers[index];
  }
  public get numberOfFers() {
    return this.fers.length;
  }

  public getFerWithName(name) {
    for (var i = 0; i < this.fers.length; i++) {
      if (this.fers[i].name == name) {
        return this.fers[i];
      }
    }
    return undefined;
  }

  public getFerWithId(id) {
    for (var i = 0; i < this.fers.length; i++) {
      if (this.fers[i].id == id) {
        return this.fers[i];
      }
    }
    return undefined;
  }

  public deleteFerWithName(name) {
    this.fers = this.fers.filter((item) => item.name != name);
  }

  public emptyfers() {
    this.fers = [];
  }

  public ferExists(name) {
    for (var i = 0; i < this.fers.length; i++) {
      if (this.fers[i].name == name) {
        return true;
      }
    }
    return false;
  }

  public scaleIcons(sizeScaled, anchorScaled) {
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
  }

  public showFers() {
    return new L.featureGroup(this.renderMarkers());
  }

  private renderPopupDataForFer(bat) {
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
  }
}
