
console.log("Cardboard conectado correctamente");

const cardboardButton = document.getElementById("cardboardButton");

cardboardButton.addEventListener("click", async function () {
  if (!document.body.classList.contains("cardboard-mode")) {
    if (typeof DeviceOrientationEvent !== "undefined" &&
        typeof DeviceOrientationEvent.requestPermission === "function") {
      try {
        const permiso = await DeviceOrientationEvent.requestPermission();

        if (permiso !== "granted") {
          alert("Necesitamos permiso de movimiento para usar el Cardboard.");
          return;
        }
      } catch (error) {
        alert("No se pudo activar el sensor de movimiento.");
        return;
      }
    }

    giroscopioActivo = true;
    orientacionInicial = null;
    activarGiroscopio();
    document.body.classList.add("cardboard-mode");
  } else {
    giroscopioActivo = false;
    document.body.classList.remove("cardboard-mode");
  }

  setTimeout(function () {
    window.visorIzquierdo.updateSize();
    visorDerecho.updateSize();
  }, 100);
});

setTimeout(function () {
  visorDerecho.updateSize();
}, 100);
});const panoDerecho = document.getElementById("panoDerecho");

const visorDerecho = new Marzipano.Viewer(panoDerecho);

const datosCiudad = APP_DATA.scenes[0];

const fuenteDerecha = Marzipano.ImageUrlSource.fromString(
  "tiles/" + datosCiudad.id + "/{z}/{f}/{y}/{x}.jpg",
  {
    cubeMapPreviewUrl: "tiles/" + datosCiudad.id + "/preview.jpg"
  }
);

const geometriaDerecha = new Marzipano.CubeGeometry(datosCiudad.levels);

const vistaDerecha = new Marzipano.RectilinearView(
  datosCiudad.initialViewParameters,
  Marzipano.RectilinearView.limit.traditional(
    datosCiudad.faceSize,
    100 * Math.PI / 180,
    120 * Math.PI / 180
  )
);

const escenaDerecha = visorDerecho.createScene({
  source: fuenteDerecha,
  geometry: geometriaDerecha,
  view: vistaDerecha,
  pinFirstLevel: true
});

escenaDerecha.switchTo();
const visorIzquierdo = document.querySelector("#pano");

function sincronizarVistas() {
  const vistaIzquierda = document.querySelector("#pano canvas");

  if (vistaIzquierda && document.body.classList.contains("cardboard-mode")) {
    // La sincronización real necesita acceder a la cámara de Marzipano.
  }
}
setInterval(function () {
  if (!document.body.classList.contains("cardboard-mode")) return;

  const escenaIzquierda = window.visorIzquierdo.scene();
  if (!escenaIzquierda) return;

  const vistaIzquierda = escenaIzquierda.view();

  vistaDerecha.setParameters({
  yaw: vistaIzquierda.yaw(),
  pitch: vistaIzquierda.pitch(),
  fov: vistaIzquierda.fov()
});
}, 30);
const escenaIzquierda = window.visorIzquierdo.scene();

const personajesOriginales =
  escenaIzquierda.hotspotContainer().listHotspots();

personajesOriginales.forEach(function(hotspot) {
  const elementoOriginal = hotspot.domElement();
  const copia = elementoOriginal.cloneNode(true);
  const posicion = hotspot.position();

  escenaDerecha.hotspotContainer().createHotspot(copia, {
    yaw: posicion.yaw,
    pitch: posicion.pitch
  });
});
setInterval(function () {
  if (!document.body.classList.contains("cardboard-mode")) return;

  const originales = window.visorIzquierdo.scene()
    .hotspotContainer().listHotspots();

  const copias = escenaDerecha.hotspotContainer().listHotspots();

  originales.forEach(function (hotspot, i) {
    if (!copias[i]) return;

    copias[i].domElement().style.visibility =
      hotspot.domElement().style.visibility;
  });
}, 100);
window.addEventListener("resize", function () {
  visorDerecho.updateSize();
  window.visorIzquierdo.updateSize();
});

let giroscopioActivo = false;
let orientacionInicial = null;

function activarGiroscopio() {
  window.addEventListener("deviceorientation", function (evento) {
    if (!giroscopioActivo || evento.alpha === null || evento.beta === null) {
      return;
    }

    const escena = window.visorIzquierdo.scene();
    if (!escena) return;

    if (orientacionInicial === null) {
      orientacionInicial = evento.alpha;
    }

    const gradosARadianes = Math.PI / 180;

    escena.view().setParameters({
      yaw: -(evento.alpha - orientacionInicial) * gradosARadianes,
      pitch: Math.max(-1.4, Math.min(1.4,
        (evento.beta - 90) * gradosARadianes
      ))
    });
  });
}
