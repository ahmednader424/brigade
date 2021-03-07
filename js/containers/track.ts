import { Target } from './target'
export class Track extends Target {
  constructor(
    public name: string,
    public lat: number,
    public lon: number,
    public serial: number,
    public vX: number,
    public vY: number,
    public type: string,
    public speed: number,
    public alt: number,
    public tq: number,
    public size: number
  ) {
    super(name, lat, lon, serial);
  }
}

export class Tracks {
  private tracks: Track[] = [];
  private trackIcon_friendly = L.icon({
    iconUrl: "../images/track_F.png",
    iconSize: defaultIconSize,
    iconAnchor: defaultAnchorScale,
  });

  private trackIcon_hostile = L.icon({
    iconUrl: "../images/track_H.png",
    iconSize: defaultIconSize,
    iconAnchor: defaultAnchorScale,
  });

  private trackIcon_p = L.icon({
    iconUrl: "../images/track_P.png",
    iconSize: defaultIconSize,
    iconAnchor: defaultAnchorScale,
  });

  private static instance: Tracks;

  private constructor() {
    if (Tracks.instance) {
      throw new Error(
        "Error: Instantiation failed: Use Tracks.getInstance() instead of new."
      );
    } else {
      Tracks.instance = this;
    }
  }

  public static getInstance(): Tracks {
    if (!Tracks.instance) {
      Tracks.instance = new Tracks();
    }

    return Tracks.instance;
  }

  public addTrack(
    name: string,
    lat: number,
    lon: number,
    serial: number,
    vX: number,
    vY: number,
    type: string,
    speed: number,
    alt: number,
    tq: number,
    size: number
  ): Track {
    let p = new Track(
      name,
      lat,
      lon,
      serial,
      vX,
      vY,
      type,
      speed,
      alt,
      tq,
      size
    );
    this.tracks.push(p);
    return p;
  }
  public scaleIcons(sizeScaled, anchorScaled) {
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
  }
  public getTrackAtIndex(index) {
    return this.tracks[index];
  }

  public getTrackWithName(name) {
    for (var i = 0; i < this.tracks.length; i++) {
      if (this.tracks[i].name == name) {
        return this.tracks[i];
      }
    }
    return undefined;
  }

  public getTrackWithSerial(serial) {
    for (var i = 0; i < this.tracks.length; i++) {
      if (this.tracks[i].serial == serial) {
        return this.tracks[i];
      }
    }
    return undefined;
  }

  public get numberOfTracks() {
    return this.tracks.length;
  }

  public deleteTrackWithName(name) {
    this.tracks = this.tracks.filter((item) => item.name != name);
  }

  public emptyTracks() {
    this.tracks = [];
  }

  public trackExists(name) {
    for (var i = 0; i < this.tracks.length; i++) {
      if (this.tracks[i].name == name) {
        return true;
      }
    }
    return false;
  }

  public showTracks() {
    return new L.featureGroup(this.renderMarkers());
  }
  private renderPopupDataForTrack(track) {
    var cb_A: any = document.getElementById("A");
    var cb_B: any = document.getElementById("B");
    var cb_C: any = document.getElementById("C");
    var cb_D: any = document.getElementById("D");

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
  }
}
