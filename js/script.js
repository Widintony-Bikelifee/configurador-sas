/* 1. VARIABLES Y CONSTANTES */

let pasoActual = 1;
const TOTAL_PASOS = 4;

const PRECIOS_PLAN = {
  basic: 50,
  pro: 100,
  enterprise: 250,
};

const PRECIOS_REGION = {
  usa: 0,
  europa: 10,
  asia: 15,
};

const NOMBRES_PLAN = {
  basic: "Basic",
  pro: "Professional",
  enterprise: "Enterprise",
};

const NOMBRES_REGION = {
  usa: "EE.UU.",
  europa: "Europa",
  asia: "Asia",
};

const IDS_SERVICIOS = ["backup", "monitoreo", "ssl"];

/* 2. MÉTODOS DE CÁLCULO */

const calcularBase = (plan) => PRECIOS_PLAN[plan] ?? 50;

const calcularRegion = (region) => PRECIOS_REGION[region] ?? 0;

const calcularServicios = () =>
  IDS_SERVICIOS.reduce((total, id) => {
    const el = document.getElementById(id);
    return total + (el.checked ? parseInt(el.dataset.precio) : 0);
  }, 0);

const obtenerNombrePlan = (plan) => NOMBRES_PLAN[plan] ?? "Basic";

const obtenerNombreRegion = (region) => NOMBRES_REGION[region] ?? "EE.UU.";

/* 3. MÉTODOS DE UI */

/**
 * Muestra u oculta el mensaje de error de un campo.
 * @param {string}  idError - ID del <p class="msg-error">
 * @param {boolean} mostrar - true para mostrar, false para ocultar
 */
const mostrarError = (idError, mostrar) => {
  const el = document.getElementById(idError);
  mostrar ? el.classList.add("visible") : el.classList.remove("visible");
};

/**
 * Actualiza el indicador visual de pasos en la cabecera.
 * Pasos anteriores → completados (✓) · Paso actual → azul · Líneas → coloreadas.
 * @param {number} paso - Número del paso actualmente visible
 */
const actualizarIndicador = (paso) => {
  for (let i = 1; i <= TOTAL_PASOS; i++) {
    const item = document.getElementById(`indicador-${i}`);
    const circulo = item.querySelector(".paso-circulo");

    item.classList.remove("activo", "completado");

    if (i < paso) {
      item.classList.add("completado");
      circulo.textContent = "✓";
    } else if (i === paso) {
      item.classList.add("activo");
      circulo.textContent = String(i);
    } else {
      circulo.textContent = String(i);
    }
  }

  for (let i = 1; i < TOTAL_PASOS; i++) {
    const linea = document.getElementById(`linea-${i}-${i + 1}`);
    if (linea) linea.classList.toggle("completada", i < paso);
  }
};

/**
 * Oculta la sección actual, muestra la del nuevoPaso
 * con animación de entrada y hace scroll al inicio.
 * @param {number} nuevoPaso - Paso destino (1–4)
 */
const mostrarPaso = (nuevoPaso) => {
  document.getElementById(`paso-${pasoActual}`).classList.add("oculto");

  pasoActual = nuevoPaso;

  const seccionNueva = document.getElementById(`paso-${pasoActual}`);
  seccionNueva.classList.remove("oculto");
  seccionNueva.classList.add("entrando");
  setTimeout(() => seccionNueva.classList.remove("entrando"), 350);

  actualizarIndicador(pasoActual);
  window.scrollTo({ top: 0, behavior: "smooth" });
};

/**
 * Recalcula el total y actualiza todos los campos del resumen (Paso 4).
 * También refleja el nombre y correo ingresados en el Paso 1.
 */
const actualizarResumen = () => {
  const plan = document.querySelector('input[name="plan"]:checked').value;
  const region = document.getElementById("region").value;

  const serviciosActivos = IDS_SERVICIOS.filter(
    (id) => document.getElementById(id).checked,
  ).map((id) => {
    const label = document.querySelector(`label:has(#${id}) .servicio-nombre`);
    return label ? label.textContent : id;
  });

  const total =
    calcularBase(plan) + calcularRegion(region) + calcularServicios();

  document.getElementById("rProyecto").textContent =
    document.getElementById("nombreProyecto").value.trim() || "—";
  document.getElementById("rEmail").textContent =
    document.getElementById("emailCliente").value.trim() || "—";
  document.getElementById("rPlan").textContent = obtenerNombrePlan(plan);
  document.getElementById("rRegion").textContent = obtenerNombreRegion(region);
  document.getElementById("rServicios").textContent = serviciosActivos.length
    ? serviciosActivos.join(", ")
    : "Ninguno";
  document.getElementById("rTotal").textContent = `$${total}/mes`;
};

/* 4. MÉTODOS DE VALIDACIÓN */

/**
 * Valida los campos del Paso 1: nombre, email y descripción.
 * Muestra mensajes de error y aplica clases de estado a cada input.
 * @returns {boolean} true si todos los campos son válidos
 */
const validarPaso1 = () => {
  const nombre = document.getElementById("nombreProyecto");
  const email = document.getElementById("emailCliente");
  const descripcion = document.getElementById("descripcion");

  const nombreOk = nombre.value.trim() !== "";
  const emailOk = email.value.trim() !== "";
  const descripcionOk = descripcion.value.trim().length >= 20;

  mostrarError("errNombre", !nombreOk);
  mostrarError("errEmail", !emailOk);
  mostrarError("errDescripcion", !descripcionOk);

  nombre.classList.toggle("invalido", !nombreOk);
  email.classList.toggle("invalido", !emailOk);
  descripcion.classList.toggle("invalida", !descripcionOk);

  return nombreOk && emailOk && descripcionOk;
};

/* 5. MÉTODOS DE ENVÍO */

/**
 * Procesa los datos del formulario antes de enviarlos al servidor.
 * @param {Object}   datos    - Datos crudos del formulario
 * @param {Function} callback - Recibe los datos ya limpios
 */
const procesarCotizacion = (datos, callback) => {
  const datosLimpios = {
    proyecto: datos.proyecto.trim().toUpperCase(),
    email: datos.email.trim().toLowerCase(),
    descripcion: datos.descripcion.trim(),
    plan: obtenerNombrePlan(datos.plan).toUpperCase(),
    region: obtenerNombreRegion(datos.region).toUpperCase(),
    servicios: datos.servicios,
    total: datos.total,
  };
  callback(datosLimpios);
};

/**
 * Simula el envío al servidor con 2 s de latencia.
 * Resuelve con un ID de transacción único o rechaza si el proyecto está vacío.
 * @param   {Object}  data - Datos limpios de la cotización
 * @returns {Promise}
 */
const enviarAlServidor = (data) =>
  new Promise((resolve, reject) => {
    if (!data.proyecto || data.proyecto.trim() === "") {
      reject(new Error("El nombre del proyecto es obligatorio"));
      return;
    }
    setTimeout(() => {
      const idTransaccion =
        "TXN-" + Math.random().toString(36).substr(2, 9).toUpperCase();
      resolve({ id: idTransaccion, datos: data });
    }, 2000);
  });

/* 6. EJECUCIÓN — listeners y arranque */

/* --- Validación en tiempo real: Paso 1 --- */

const inputNombre = document.getElementById("nombreProyecto");
inputNombre.addEventListener("blur", (e) => {
  const vacio = e.target.value.trim() === "";
  mostrarError("errNombre", vacio);
  e.target.classList.toggle("invalido", vacio);
});
inputNombre.addEventListener("input", (e) => {
  if (e.target.value.trim() !== "") {
    mostrarError("errNombre", false);
    e.target.classList.remove("invalido");
  }
});

const inputEmail = document.getElementById("emailCliente");
inputEmail.addEventListener("blur", (e) => {
  const vacio = e.target.value.trim() === "";
  mostrarError("errEmail", vacio);
  e.target.classList.toggle("invalido", vacio);
});
inputEmail.addEventListener("input", (e) => {
  if (e.target.value.trim() !== "") {
    mostrarError("errEmail", false);
    e.target.classList.remove("invalido");
  }
});

const inputDescripcion = document.getElementById("descripcion");
inputDescripcion.addEventListener("blur", (e) => {
  const invalido = e.target.value.trim().length < 20;
  mostrarError("errDescripcion", invalido);
  e.target.classList.toggle("invalida", invalido);
});
inputDescripcion.addEventListener("input", (e) => {
  const invalido = e.target.value.trim().length < 20;
  mostrarError("errDescripcion", invalido);
  e.target.classList.toggle("invalida", invalido);
});

/* --- Tarjetas de plan --- */

document.querySelectorAll('input[name="plan"]').forEach((radio) => {
  radio.closest(".tarjeta-plan").addEventListener("click", () => {
    document
      .querySelectorAll(".tarjeta-plan")
      .forEach((c) => c.classList.remove("activo"));
    radio.closest(".tarjeta-plan").classList.add("activo");
    actualizarResumen();
  });
});

document.querySelectorAll(".tarjeta-plan").forEach((card) => {
  if (card.querySelector('input[type="radio"]').checked)
    card.classList.add("activo");
});

/* --- Select de región y checkboxes de servicios --- */

document.getElementById("region").addEventListener("change", actualizarResumen);

IDS_SERVICIOS.forEach((id) =>
  document.getElementById(id).addEventListener("change", actualizarResumen),
);

/* --- Navegación entre pasos --- */

document.getElementById("btnSiguiente1").addEventListener("click", () => {
  if (validarPaso1()) mostrarPaso(2);
});

document
  .getElementById("btnAnterior2")
  .addEventListener("click", () => mostrarPaso(1));
document
  .getElementById("btnSiguiente2")
  .addEventListener("click", () => mostrarPaso(3));

document
  .getElementById("btnAnterior3")
  .addEventListener("click", () => mostrarPaso(2));
document.getElementById("btnSiguiente3").addEventListener("click", () => {
  actualizarResumen();
  mostrarPaso(4);
});

document
  .getElementById("btnAnterior4")
  .addEventListener("click", () => mostrarPaso(3));

/* --- Envío del formulario --- */

document.getElementById("formulario").addEventListener("submit", (e) => {
  e.preventDefault();

  const nombre = document.getElementById("nombreProyecto").value;
  const email = document.getElementById("emailCliente").value;
  const descripcion = document.getElementById("descripcion").value;
  const plan = document.querySelector('input[name="plan"]:checked').value;
  const region = document.getElementById("region").value;

  const serviciosSeleccionados = IDS_SERVICIOS.filter(
    (id) => document.getElementById(id).checked,
  ).map((id) => {
    const label = document.querySelector(`label:has(#${id}) .servicio-nombre`);
    return label ? label.textContent : id;
  });

  const total =
    calcularBase(plan) + calcularRegion(region) + calcularServicios();

  const spinner = document.getElementById("spinner");
  const btn = document.getElementById("btnFinalizar");
  const btnAnterior = document.getElementById("btnAnterior4");
  const divResultado = document.getElementById("resultadoFinal");

  spinner.classList.add("visible");
  btn.disabled = true;
  btnAnterior.disabled = true;
  divResultado.className = "resultado";
  divResultado.innerHTML = "";

  const datosBrutos = {
    proyecto: nombre,
    email,
    descripcion,
    plan,
    region,
    servicios: serviciosSeleccionados,
    total,
  };

  procesarCotizacion(datosBrutos, (datosLimpios) => {
    enviarAlServidor(datosLimpios)
      .then((respuesta) => {
        spinner.classList.remove("visible");
        btn.disabled = false;
        btnAnterior.disabled = false;

        const ventana = window.open(
          "./recibo/recibo.html",
          "_blank",
          "width=520,height=680",
        );

        ventana.reciboData = respuesta;
      })
      .catch((error) => {
        spinner.classList.remove("visible");
        btn.disabled = false;
        btnAnterior.disabled = false;

        divResultado.className = "resultado error";
        divResultado.innerHTML = `
          <h3>✗ Error al procesar la solicitud</h3>
          <p>${error.message}</p>
        `;
      });
  });
});

/* --- Inicialización al cargar la página --- */
actualizarResumen();