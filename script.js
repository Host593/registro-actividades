window.actividades = JSON.parse(localStorage.getItem("actividades")) || [];
window.modoAdmin = false;

window.mostrarCampoOtro = function (select) {
  const inputDetalle = document.getElementById("TipoDetalle");
  if (select.value === "Otro") {
    inputDetalle.style.display = "block";
    inputDetalle.required = true;
  } else {
    inputDetalle.style.display = "none";
    inputDetalle.required = false;
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-actividad");
  const tabla = document.querySelector("#tabla-actividades tbody");
  const borrarBtn = document.getElementById("borrar-todo");
  const calendarioDiv = document.getElementById("calendario");
  const recordatoriosDiv = document.getElementById("recordatorios");
  const listaNotas = document.getElementById("lista-notas");
  const inputNuevaNota = document.getElementById("nueva-nota");


  
  let actividades = window.actividades;
  let recordatorios = JSON.parse(localStorage.getItem("recordatorios")) || {};
  let notas = JSON.parse(localStorage.getItem("notas")) || [];

  let paginaActual = 1;
  const itemsPorPagina = 10;
  let actividadesFiltradas = [...actividades];

  function actualizarReloj() {
    const ahora = new Date();
    document.getElementById("reloj-digital").textContent = ahora.toLocaleTimeString();
  }
  setInterval(actualizarReloj, 1000);
  actualizarReloj();

  function renderizarTabla(data = actividadesFiltradas, pagina = paginaActual) {
    tabla.innerHTML = "";

    const inicio = (pagina - 1) * itemsPorPagina;
    const fin = inicio + itemsPorPagina;
    const paginaData = data.slice(inicio, fin);

    paginaData.forEach((act, index) => {
      const fila = document.createElement("tr");
      const realIndex = actividades.findIndex(a =>
        a.lugar === act.lugar &&
        a.problema === act.problema &&
        a.solucion === act.solucion &&
        a.tiempo === act.tiempo &&
        a.fecha === act.fecha
      );

      fila.innerHTML = `
  <td>${inicio + index + 1}</td>
  <td>${act.lugar}</td>
  <td>${act.problema}</td>
  <td>${act.solucion}</td>
  <td>${act.tiempo}</td>
  <td>${act.fecha}</td>
  <td>${act.tecnico || "Sin asignar"}</td>
  <td>
    ${window.modoAdmin ? `<button onclick="editarActividad(${realIndex})" title="Editar actividad">✏️</button>
    <button onclick="eliminarActividad(${inicio + index})" title="Eliminar actividad" style="margin-left: 5px; color: red;">🗑️</button>` : ''}
  </td>
`;
      tabla.appendChild(fila);
    });

    renderizarPaginacion(data.length);
  }

  function renderizarPaginacion(totalItems) {
    const pagContainerId = "paginacion-container";
    let pagContainer = document.getElementById(pagContainerId);
    if (pagContainer) pagContainer.remove();

    pagContainer = document.createElement("div");
    pagContainer.id = pagContainerId;
    pagContainer.style.marginTop = "15px";
    pagContainer.style.textAlign = "right";

    const totalPaginas = Math.ceil(totalItems / itemsPorPagina);
    if (totalPaginas <= 1) return;

    const btnPrev = document.createElement("button");
    btnPrev.textContent = "Anterior";
    btnPrev.disabled = paginaActual === 1;
    btnPrev.onclick = () => {
      if (paginaActual > 1) {
        paginaActual--;
        renderizarTabla();
      }
    };
    pagContainer.appendChild(btnPrev);

    const textoPaginas = document.createElement("span");
    textoPaginas.textContent = ` Página ${paginaActual} de ${totalPaginas} `;
    textoPaginas.style.margin = "0 10px";
    pagContainer.appendChild(textoPaginas);

    const btnNext = document.createElement("button");
    btnNext.textContent = "Siguiente";
    btnNext.disabled = paginaActual === totalPaginas;
    btnNext.onclick = () => {
      if (paginaActual < totalPaginas) {
        paginaActual++;
        renderizarTabla();
      }
    };
    pagContainer.appendChild(btnNext);

    tabla.parentNode.appendChild(pagContainer);
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const tipoSelect = document.getElementById("Tipo");
    const problema = tipoSelect.value === "Otro" ? document.getElementById("TipoDetalle").value.trim() : tipoSelect.value;

    const nuevaActividad = {
  lugar: document.getElementById("Lugar").value.trim(),
  problema,
  solucion: document.getElementById("Solución").value.trim(),
  tiempo: document.getElementById("tiempo").value.trim(),
  fecha: document.getElementById("fecha").value,
  tecnico: document.getElementById("tecnico").value || "Sin asignar"
};


    actividades.push(nuevaActividad);
    localStorage.setItem("actividades", JSON.stringify(actividades));

    aplicarFiltros(true);
    paginaActual = Math.ceil(actividadesFiltradas.length / itemsPorPagina);
    renderizarTabla();

    form.reset();
    document.getElementById("TipoDetalle").style.display = "none";
  });

  window.exportarExcel = function () {
    const ws_data = [
    ["#", "Lugar", "Tipo de Actividad", "Problema Detectado", "Solución", "Fecha", "Técnico"],
      ...actividades.map((act, i) => [
        i + 1,
        act.lugar,
        act.problema,
        act.solucion,
        act.tiempo,
        act.fecha,
        
      ])
    ];
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Actividades");
    XLSX.writeFile(wb, "registro_actividades.xlsx");
  };

  window.borrarTodo = function () {
    if (!window.modoAdmin) {
      alert("Debes activar el modo administrador para borrar todo.");
      return;
    }
    if (confirm("¿Seguro que quieres borrar todos los registros?")) {
      actividades = [];
      localStorage.removeItem("actividades");
      aplicarFiltros(true);
      paginaActual = 1;
      renderizarTabla();
    }
  };

  window.activarAdmin = function () {
    // Crear un prompt con input tipo password
    const modal = document.createElement("div");
    modal.style.position = "fixed";
    modal.style.top = 0;
    modal.style.left = 0;
    modal.style.width = "100%";
    modal.style.height = "100%";
    modal.style.backgroundColor = "rgba(0,0,0,0.6)";
    modal.style.display = "flex";
    modal.style.justifyContent = "center";
    modal.style.alignItems = "center";
    modal.style.zIndex = 9999;

    const caja = document.createElement("div");
    caja.style.background = "white";
    caja.style.padding = "20px";
    caja.style.borderRadius = "8px";
    caja.style.textAlign = "center";
    caja.style.width = "300px";

    const label = document.createElement("label");
    label.textContent = "Ingresa la clave de administrador:";
    label.style.display = "block";
    label.style.marginBottom = "10px";

    const inputPass = document.createElement("input");
    inputPass.type = "password";
    inputPass.style.width = "100%";
    inputPass.style.padding = "8px";
    inputPass.style.marginBottom = "10px";

    const btnAceptar = document.createElement("button");
    btnAceptar.textContent = "Aceptar";
    btnAceptar.style.marginRight = "10px";

    const btnCancelar = document.createElement("button");
    btnCancelar.textContent = "Cancelar";

    btnAceptar.onclick = () => {
      if (inputPass.value === "ANCLA2025") {
        window.modoAdmin = true;
        borrarBtn.style.display = "inline-block";
        alert("Modo administrador activado.");
        renderizarTabla();
        document.body.removeChild(modal);
      } else {
        alert("Clave incorrecta.");
      }
    };

    btnCancelar.onclick = () => {
      document.body.removeChild(modal);
    };

    caja.appendChild(label);
    caja.appendChild(inputPass);
    caja.appendChild(btnAceptar);
    caja.appendChild(btnCancelar);

    modal.appendChild(caja);
    document.body.appendChild(modal);
  };

  window.eliminarActividad = function (index) {
    if (!window.modoAdmin) {
      alert("Debes activar el modo administrador para eliminar actividades.");
      return;
    }

    if (confirm("¿Seguro que quieres eliminar esta actividad?")) {
      const actAEliminar = actividadesFiltradas[index];
      if (!actAEliminar) {
        alert("Actividad no encontrada.");
        return;
      }

      const indiceReal = actividades.findIndex(act =>
        act.lugar === actAEliminar.lugar &&
        act.problema === actAEliminar.problema &&
        act.solucion === actAEliminar.solucion &&
        act.tiempo === actAEliminar.tiempo &&
        act.fecha === actAEliminar.fecha
      );

      if (indiceReal === -1) {
        alert("Actividad no encontrada en la lista original.");
        return;
      }

      actividades.splice(indiceReal, 1);
      localStorage.setItem("actividades", JSON.stringify(actividades));
      aplicarFiltros(true);
    }
  };

  window.aplicarFiltros = function (resetPagina = false) {
  const fechaFiltro = document.getElementById("filtroFecha").value;
  const tipoFiltro = document.getElementById("filtroTipo").value.trim();

  actividadesFiltradas = actividades.filter(act => {
    const fechaAct = act.fecha || "";
    const tipoAct = (act.problema || "").toLowerCase();

    const coincideFecha = !fechaFiltro || fechaAct === fechaFiltro;

    let coincideTipo = false;
    if (!tipoFiltro || tipoFiltro === "") {
      coincideTipo = true; // Sin filtro, todo pasa
    } else if (tipoFiltro === "Otro") {
      // Mostrar actividades cuyo problema NO sea ninguno de los tipos principales
      coincideTipo = (tipoAct !== "mantenimiento preventivo".toLowerCase()) && (tipoAct !== "eventualidad".toLowerCase());
    } else {
      // Para los otros tipos, buscar coincidencia exacta (o parcial si quieres)
      coincideTipo = tipoAct.includes(tipoFiltro.toLowerCase());
    }

    return coincideFecha && coincideTipo;
  });

  if (resetPagina) paginaActual = 1;
  renderizarTabla();
};


  window.limpiarFiltros = function () {
    document.getElementById("filtroFecha").value = "";
    document.getElementById("filtroTipo").value = "";
    actividadesFiltradas = [...actividades];
    paginaActual = 1;
    renderizarTabla();
  };

  window.editarActividad = function (index) {
    if (index < 0 || index >= actividades.length) {
      alert("Índice de actividad inválido.");
      return;
    }

    const act = actividades[index];
    const tecnico = document.getElementById("tecnico").value;

    const lugar = prompt("Editar lugar:", act.lugar);
    if (lugar === null) return;

    let tipo = prompt("Editar tipo de actividad (Mantenimiento Preventivo, Eventualidad, Otro):", act.problema);
    if (tipo === null) return;

    let detalleOtro = "";
    if (tipo.toLowerCase() === "otro") {
      detalleOtro = prompt("Especifica el detalle del tipo:", "");
      if (detalleOtro === null) return;
      tipo = detalleOtro.trim();
    }

    const solucion = prompt("Editar solución:", act.solucion);
    if (solucion === null) return;

    const tiempo = prompt("Editar tiempo:", act.tiempo);
    if (tiempo === null) return;

    const fecha = prompt("Editar fecha (YYYY-MM-DD):", act.fecha);
    if (fecha === null) return;

    actividades[index] = {
      lugar: lugar.trim(),
      problema: tipo.trim(),
      solucion: solucion.trim(),
      tiempo: tiempo.trim(),
      fecha: fecha.trim()
    };

    localStorage.setItem("actividades", JSON.stringify(actividades));
    aplicarFiltros(true);
  };

  // Inicializar
  renderizarTabla();
  crearCalendario(new Date());
  renderizarNotas();
});
// Función para crear calendario mensual básico
function crearCalendario(fecha) {
  const calendarioDiv = document.getElementById("calendario");
  calendarioDiv.innerHTML = ""; // limpiar contenido previo

  const year = fecha.getFullYear();
  const month = fecha.getMonth();

  const primerDiaMes = new Date(year, month, 1);
  const ultimoDiaMes = new Date(year, month + 1, 0);
  const diasMes = ultimoDiaMes.getDate();
  const diaSemanaInicio = primerDiaMes.getDay(); // domingo=0, lunes=1...

  // Fecha actual para marcar el día
  const hoy = new Date();
  const esMesActual = (hoy.getFullYear() === year && hoy.getMonth() === month);
  const diaHoy = esMesActual ? hoy.getDate() : null;

  // Crear tabla calendario
  const tabla = document.createElement("table");
  tabla.style.width = "100%";
  tabla.style.borderCollapse = "collapse";

  // Cabecera con días
  const cabecera = document.createElement("tr");
  const diasSemana = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  diasSemana.forEach(dia => {
    const th = document.createElement("th");
    th.textContent = dia;
    th.style.border = "1px solid #ccc";
    th.style.padding = "5px";
    cabecera.appendChild(th);
  });
  tabla.appendChild(cabecera);

  // Celdas de días
  let fila = document.createElement("tr");

  // Espacios vacíos antes del primer día
  for (let i = 0; i < diaSemanaInicio; i++) {
    const tdVacio = document.createElement("td");
    tdVacio.style.border = "1px solid #ccc";
    tdVacio.style.padding = "5px";
    fila.appendChild(tdVacio);
  }

  for (let dia = 1; dia <= diasMes; dia++) {
    if ((diaSemanaInicio + dia - 1) % 7 === 0 && dia !== 1) {
      tabla.appendChild(fila);
      fila = document.createElement("tr");
    }

    const td = document.createElement("td");
    td.textContent = dia;
    td.style.border = "1px solid #ccc";
    td.style.padding = "5px";
    td.style.textAlign = "center";
    td.style.cursor = "pointer";

    // Marcar día actual con clase "seleccionado"
    if (dia === diaHoy) {
      td.classList.add("seleccionado");
    }

    td.onclick = () => {
      // Quitar clase seleccionado previo
      const prev = calendarioDiv.querySelector(".seleccionado");
      if (prev) prev.classList.remove("seleccionado");

      td.classList.add("seleccionado");

      // Actualizar campo fecha del formulario en formato YYYY-MM-DD
      const mesStr = (month + 1).toString().padStart(2, "0");
      const diaStr = dia.toString().padStart(2, "0");
      const fechaSeleccion = `${year}-${mesStr}-${diaStr}`;
      document.getElementById("fecha").value = fechaSeleccion;
    };

    fila.appendChild(td);
  }

  // Completar fila con espacios vacíos si faltan
  while (fila.children.length < 7) {
    const tdVacio = document.createElement("td");
    tdVacio.style.border = "1px solid #ccc";
    tdVacio.style.padding = "5px";
    fila.appendChild(tdVacio);
  }
  tabla.appendChild(fila);

  calendarioDiv.appendChild(tabla);
}

  // Establecer fecha actual en el input #fecha
  const inputFecha = document.getElementById("fecha");
  if (inputFecha) {
    const hoy = new Date();
    const yyyy = hoy.getFullYear();
    const mm = String(hoy.getMonth() + 1).padStart(2, "0");
    const dd = String(hoy.getDate()).padStart(2, "0");
    inputFecha.value = `${yyyy}-${mm}-${dd}`;
  }

  // También para el filtro de fecha
  const filtroFecha = document.getElementById("filtroFecha");
  if (filtroFecha) {
    filtroFecha.value = `${yyyy}-${mm}-${dd}`;
  }

  const tecnico = document.getElementById('tecnico').value;
const actividad = {
  lugar,
  tipo,
  problema,
  solucion,
  tiempo,
  fecha,
  tecnico
};