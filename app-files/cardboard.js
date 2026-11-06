
console.log("Cardboard conectado");

const cardboardButton = document.getElementById("cardboardButton");
const panoDerecho = document.getElementById("panoDerecho");

const visorDerecho = new Marzipano.Viewer(panoDerecho);
const datosCiudad = APP_DATA.scenes[0];

const fuenteDerecha = Marzipano.ImageUrlSource.fromString(
  "tiles/" + datosCiudad.id + "/{z}/{f}/{y}/{x}.jpg",
  {
    cubeMapPreviewUrl:
      "tiles/" + datosCiudad.id + "/preview.jpg"
  }
);

const geometriaDerecha =
  new Marzipano.CubeGeometry(datosCiudad.levels);

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

let giroscopioActivo = false;
let orientacionInicial = null;
let sensorRegistrado = false;

// Operaciones de orientación en 3D
function multiplicar(a, b) {
  return [
    a[0]*b[0]-a[1]*b[1]-a[2]*b[2]-a[3]*b[3],
    a[0]*b[1]+a[1]*b[0]+a[2]*b[3]-a[3]*b[2],
    a[0]*b[2]-a[1]*b[3]+a[2]*b[0]+a[3]*b[1],
    a[0]*b[3]+a[1]*b[2]-a[2]*b[1]+a[3]*b[0]
  ];
}

function ejeAngulo(x, y, z, angulo) {
  const s = Math.sin(angulo / 2);
  return [Math.cos(angulo / 2), x*s, y*s, z*s];
}

function orientacionTelefono(alpha, beta, gamma, pantalla) {
  const r = Math.PI / 180;

  // Conversión de orientación del dispositivo a cámara
  const a = alpha * r / 2;
  const b = beta * r / 2;
  const g = gamma * r / 2;

  const c1 = Math.cos(a), c2 = Math.cos(b), c3 = Math.cos(g);
  const s1 = Math.sin(a), s2 = Math.sin(b), s3 = Math.sin(g);

  let q = [
    c1*c2*c3 - s1*s2*s3,
    s1*s2*c3 + c1*c2*s3,
    s1*c2*c3 + c1*s2*s3,
    c1*s2*c3 - s1*c2*s3
  ];

  q = multiplicar(q, ejeAngulo(1, 0, 0, -Math.PI / 2));
  q = multiplicar(q, ejeAngulo(0, 0, 1, -pantalla * r));

  // Dirección hacia la que mira el visor
  const w = q[0], x = q[1], y = q[2], z = q[3];

  const vx = -2 * (x*z + w*y);
  const vy = -2 * (y*z - w*x);
  const vz = -(1 - 2*(x*x + y*y));

  return {
    yaw: Math.atan2(-vx, -vz),
    pitch: Math.asin(Math.max(-1, Math.min(1, vy)))
  };
}

function procesarMovimiento(evento) {
  if (!giroscopioActivo) return;

  if (
    evento.alpha == null ||
    evento.beta == null ||
    evento.gamma == null
  ) return;

  const escena = window.visorIzquierdo.scene();
  if (!escena) return;

  const pantalla = screen.orientation
    ? screen.orientation.angle
    : (window.orientation || 0);

  const posicion = orientacionTelefono(
    evento.alpha,
    evento.beta,
    evento.gamma,
    pantalla
  );

  if (orientacionInicial === null) {
    orientacionInicial = posicion.yaw;
  }

  let yaw = posicion.yaw - orientacionInicial;

  // Mantener el ángulo dentro del rango circular
  yaw = Math.atan2(Math.sin(yaw), Math.cos(yaw));

  escena.view().setParameters({
    yaw: yaw,
    pitch: posicion.pitch
  });
}

// Botón Cardboard
cardboardButton.addEventListener("click", async function () {
  const activar =
    !document.body.classList.contains("cardboard-mode");

  if (activar) {
    if (
      typeof DeviceOrientationEvent !== "undefined" &&
      typeof DeviceOrientationEvent.requestPermission === "function"
    ) {
      try {
        const permiso =
          await DeviceOrientationEvent.requestPermission();

        if (permiso !== "granted") {
          alert("Necesitamos permiso para usar el movimiento.");
          return;
        }
      } catch (error) {
        alert("Safari no pudo habilitar el movimiento.");
        return;
      }
    }

    orientacionInicial = null;
    giroscopioActivo = true;

    if (!sensorRegistrado) {
      window.addEventListener(
        "deviceorientation",
        procesarMovimiento
      );
      sensorRegistrado = true;
    }

    document.body.classList.add("cardboard-mode");
  } else {
    giroscopioActivo = false;
    document.body.classList.remove("cardboard-mode");
  }

  setTimeout(function () {
    window.visorIzquierdo.updateSize();
    visorDerecho.updateSize();
  }, 150);
});

// Sincronizar ambas cámaras
function sincronizarVistas() {
  if (!document.body.classList.contains("cardboard-mode")) {
    return;
  }

  const escenaIzquierda = window.visorIzquierdo.scene();
  if (!escenaIzquierda) return;

  const vistaIzquierda = escenaIzquierda.view();

  vistaDerecha.setParameters({
    yaw: vistaIzquierda.yaw(),
    pitch: vistaIzquierda.pitch(),
    fov: vistaIzquierda.fov()
  });
}

setInterval(sincronizarVistas, 30);

// Duplicar personajes
const escenaIzquierda = window.visorIzquierdo.scene();

const personajesOriginales =
  escenaIzquierda.hotspotContainer().listHotspots();

const copiasPersonajes = [];

personajesOriginales.forEach(function (hotspot) {
  const original = hotspot.domElement();
  const copia = original.cloneNode(true);
  const posicion = hotspot.position();

  escenaDerecha.hotspotContainer().createHotspot(copia, {
    yaw: posicion.yaw,
    pitch: posicion.pitch
  });

  copiasPersonajes.push({
    original: original,
    copia: copia
  });
});


// Sincronizar visibilidad de personajes
setInterval(function () {
  if (!document.body.classList.contains("cardboard-mode")) {
    return;
  }

  copiasPersonajes.forEach(function (par) {
    par.copia.style.visibility =
      par.original.style.visibility;

    par.copia.style.opacity =
      par.original.style.opacity;

    par.copia.className = par.original.className;
  });
}, 100);

// Actualizar tamaños al girar el teléfono
window.addEventListener("resize", function () {
  window.visorIzquierdo.updateSize();
  visorDerecho.updateSize();
});

window.addEventListener("orientationchange", function () {
  orientacionInicial = null;

  setTimeout(function () {
    window.visorIzquierdo.updateSize();
    visorDerecho.updateSize();
  }, 300);
});



  
