// Acceder al plugin SQL a través de la variable global
const Database = window.__TAURI_PLUGIN_SQL__;

// Cargar todos los afiliados en el select al inicio
async function cargarAfiliados() {
  try {
    const db = await cargarBaseDeDatos();
    const pacientes = await db.select('SELECT id, nombre, apellido FROM afiliados');
    
    const select = document.getElementById('patientSelect');
    select.innerHTML = '<option value="new">Nuevo afiliado</option>'; // Reset select options

    pacientes.forEach(paciente => {
      const option = document.createElement('option');
      option.value = paciente.id;
      option.textContent = `${paciente.apellido}, ${paciente.nombre}`;
      select.appendChild(option);
    });

  } catch (error) {
    console.error('Error al cargar afiliados:', error);
  }
}

// Cargar la base de datos
async function cargarBaseDeDatos() {
  try {
    const db = await Database.load('sqlite:afiliados.db');
    return db;
  } catch (error) {
    console.error('Error al cargar la base de datos:', error);
  }
}

// Crear un nuevo afiliado
async function agregarAfiliado(paciente) {
  try {
    const db = await cargarBaseDeDatos();
    
    await db.execute(`
        INSERT INTO afiliados (
          nombre, apellido, direccion, codigo_postal, localidad, provincia,
          fecha_nacimiento, sexo, obra_social, telefono, grupo_sanguineo,
          estado_civil, pareja, hijo1, hijo2, hijo3, contacto_emergencia
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        paciente.nombre,
        paciente.apellido,
        paciente.direccion,
        paciente.codigo_postal,
        paciente.localidad,
        paciente.provincia,
        paciente.fecha_nacimiento,
        paciente.sexo,
        paciente.obra_social,
        paciente.telefono,
        paciente.grupo_sanguineo,
        paciente.estado_civil,
        paciente.pareja || '',
        paciente.hijo1 || '',
        paciente.hijo2 || '',
        paciente.hijo3 || '',
        paciente.contacto_emergencia,
      ]
    );

    alert('Afiliado guardado correctamente');
    cargarAfiliados(); // Actualizar la lista de afiliados
  } catch (error) {
    console.error('Error al agregar afiliado:', error);
    alert('Error al guardar el afiliado');
  }
}

// Eliminar un afiliado
async function eliminarAfiliado(id) {
  try {
    const db = await cargarBaseDeDatos();
    
    await db.execute('DELETE FROM afiliados WHERE id = ?', [id]);

    cargarAfiliados(); // Actualizar la lista de afiliados después de la eliminación
    document.getElementById('pacienteForm').reset();
    document.getElementById('patientSelect').value = 'new';
    document.getElementById('guardarPaciente').textContent = 'Guardar afiliado';
    document.getElementById('eliminarPaciente').disabled = true;
    document.getElementById('nuevaFicha').disabled = true;
    document.getElementById('historialFichasButton').disabled = true;
    alert('Afiliado eliminado correctamente');

  } catch (error) {
    console.error('Error al eliminar afiliado:', error);
    alert('Error al eliminar el afiliado');
  }
}

// Actualizar un afiliado existente
async function actualizarAfiliado(paciente) {
  try {
    const db = await cargarBaseDeDatos();
    
    await db.execute(`
        UPDATE afiliados SET
          nombre = ?, apellido = ?, direccion = ?, codigo_postal = ?,
          localidad = ?, provincia = ?, fecha_nacimiento = ?, sexo = ?,
          obra_social = ?, telefono = ?, grupo_sanguineo = ?, estado_civil = ?,
          pareja = ?, hijo1 = ?, hijo2 = ?, hijo3 = ?, contacto_emergencia = ?
        WHERE id = ?`,
      [
        paciente.nombre,
        paciente.apellido,
        paciente.direccion,
        paciente.codigo_postal,
        paciente.localidad,
        paciente.provincia,
        paciente.fecha_nacimiento,
        paciente.sexo,
        paciente.obra_social,
        paciente.telefono,
        paciente.grupo_sanguineo,
        paciente.estado_civil,
        paciente.pareja || '',
        paciente.hijo1 || '',
        paciente.hijo2 || '',
        paciente.hijo3 || '',
        paciente.contacto_emergencia,
        paciente.id
      ]
    );

    cargarAfiliados(); // Actualizar la lista de afiliados
    alert('Afiliado actualizado correctamente');
  } catch (error) {
    console.error('Error al actualizar afiliado:', error);
    alert('Error al actualizar el afiliado');
  }
}

// Cargar los datos del afiliado seleccionado en el formulario
async function cargarDatosAfiliado(id) {
  try {
    const db = await cargarBaseDeDatos();
    const afiliado = await db.select('SELECT * FROM afiliados WHERE id = ?', [id]);

    if (afiliado.length > 0) {
      const paciente = afiliado[0];
      // Llenar los campos del formulario con los datos del afiliado
      document.querySelector('input[name="id"]').value = paciente.id;
      document.querySelector('input[name="nombre"]').value = paciente.nombre;
      document.querySelector('input[name="apellido"]').value = paciente.apellido;
      document.querySelector('input[name="direccion"]').value = paciente.direccion;
      document.querySelector('input[name="codigo_postal"]').value = paciente.codigo_postal;
      document.querySelector('input[name="localidad"]').value = paciente.localidad;
      document.querySelector('input[name="provincia"]').value = paciente.provincia;
      document.querySelector('input[name="fecha_nacimiento"]').value = paciente.fecha_nacimiento;
      document.querySelector('select[name="sexo"]').value = paciente.sexo;
      document.querySelector('input[name="obra_social"]').value = paciente.obra_social;
      document.querySelector('input[name="telefono"]').value = paciente.telefono;
      document.querySelector('select[name="grupo_sanguineo"]').value = paciente.grupo_sanguineo;
      document.querySelector('select[name="estado_civil"]').value = paciente.estado_civil;
      document.querySelector('input[name="pareja"]').value = paciente.pareja || '';
      document.querySelector('input[name="hijo1"]').value = paciente.hijo1 || '';
      document.querySelector('input[name="hijo2"]').value = paciente.hijo2 || '';
      document.querySelector('input[name="hijo3"]').value = paciente.hijo3 || '';
      document.querySelector('input[name="contacto_emergencia"]').value = paciente.contacto_emergencia;
    }

  } catch (error) {
    console.error('Error al cargar los datos del afiliado:', error);
  }
}

// Manejar el cambio en el select de afiliados
document.getElementById('patientSelect').addEventListener('change', async (e) => {
  const id = e.target.value;

  if (id === 'new') {
    document.getElementById('pacienteForm').reset();
    document.getElementById('guardarPaciente').textContent = 'Guardar afiliado';
    document.getElementById('eliminarPaciente').disabled = true;
    document.getElementById('nuevaFicha').disabled = true;
    document.getElementById('historialFichasButton').disabled = true;

    // Resetear el estado del botón "Nueva ficha"
    const fichaForm = document.getElementById('ficha-form');
    const nuevaFichaButton = document.getElementById('nuevaFicha');
    fichaForm.style.display = 'none';
    nuevaFichaButton.textContent = 'Nueva ficha';
  } else {
    await cargarDatosAfiliado(id);
    document.getElementById('guardarPaciente').textContent = 'Actualizar afiliado';
    document.getElementById('eliminarPaciente').disabled = false;
    document.getElementById('nuevaFicha').disabled = false;
    document.getElementById('historialFichasButton').disabled = false;
  }
});

// Manejar el envío del formulario para guardar o actualizar un afiliado
document.getElementById('pacienteForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const paciente = Object.fromEntries(formData);

  if (document.getElementById('patientSelect').value === 'new') {
    await agregarAfiliado(paciente);
  } else {
    await actualizarAfiliado(paciente);
  }

  document.getElementById('pacienteForm').reset();
  document.getElementById('patientSelect').value = 'new';
  document.getElementById('guardarPaciente').textContent = 'Guardar afiliado';
  document.getElementById('eliminarPaciente').disabled = true;
  document.getElementById('nuevaFicha').disabled = true;
  document.getElementById('historialFichasButton').disabled = true;
});

// Asignar eventos para manejar la eliminación de afiliados
document.getElementById('eliminarPaciente').addEventListener('click', async () => {
  const selectedId = document.getElementById('patientSelect').value;

  if (selectedId !== 'new') {
    if (confirm('¿Estás seguro de que deseas eliminar este afiliado?')) {
      await eliminarAfiliado(selectedId);
    }
  }
});

// Manejar el botón "Nueva ficha" para mostrar/ocultar el formulario de fichas
document.getElementById('nuevaFicha').addEventListener('click', () => {
  const selectedId = document.getElementById('patientSelect').value;

  if (selectedId === 'new') {
    alert('Debes seleccionar un afiliado para agregar una nueva ficha.');
  } else {
    const fichaForm = document.getElementById('ficha-form');
    const nuevaFichaButton = document.getElementById('nuevaFicha');

    if (fichaForm.style.display === 'block') {
      fichaForm.style.display = 'none';
      nuevaFichaButton.textContent = 'Nueva ficha';
    } else {
      fichaForm.style.display = 'block';
      nuevaFichaButton.textContent = 'Ocultar ficha';
    }
  }
});

// Asignar evento al botón "Historial fichas" para ir a database.html con el afiliado seleccionado
document.getElementById('historialFichasButton').addEventListener('click', () => {
  const selectedId = document.getElementById('patientSelect').value;

  if (selectedId === 'new') {
      alert('Debes seleccionar un afiliado para ver el historial de fichas.');
  } else {
      // Guardar el ID del afiliado seleccionado en localStorage
      localStorage.setItem('selectedAfiliadoId', selectedId);
      // Redirigir a database.html
      window.location.href = 'database.html';
  }
});

// SECCIÓN FICHAS //

// Crear una nueva ficha para un afiliado con logging adicional
async function agregarFicha(ficha) {
  try {
      const db = await cargarBaseDeDatos();

      console.log('Datos de la ficha:', ficha);

      await db.execute(`
          INSERT INTO fichas (
              paciente_id, ultimo_contacto, fecha_ultimo_evento, proximo_contacto,
              antecedentes, hecho, accion_hospital, otros_datos, notas, detalle, contactado
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
              ficha.paciente_id,
              ficha.ultimo_contacto,
              ficha.fecha_ultimo_evento,
              ficha.proximo_contacto,
              ficha.antecedentes,
              ficha.hecho,
              ficha.accion_hospital,
              ficha.otros_datos,
              ficha.notas,
              ficha.detalle,
              ficha.contactado
          ]
      );

      alert('Ficha guardada correctamente');

  } catch (error) {
      console.error('Error al agregar ficha:', error);
      alert('Error al guardar la ficha');
  }
}

// Manejar el envío del formulario de fichas para guardar una nueva ficha
document.getElementById('ficha-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const selectedId = document.getElementById('patientSelect').value;

  if (selectedId === 'new') {
      alert('Debes seleccionar un afiliado antes de agregar una ficha.');
      return;
  }

  const formData = new FormData(e.target);
  const ficha = Object.fromEntries(formData);

  // Renombrar las claves para que coincidan con los nombres de las columnas en la base de datos
  const fichaFormatted = {
      paciente_id: selectedId,
      ultimo_contacto: ficha.ultimoContacto,
      fecha_ultimo_evento: ficha.fechaUltimoEvento,
      proximo_contacto: ficha.proximoContacto,
      antecedentes: ficha.antecedentes,
      hecho: ficha.hecho,
      accion_hospital: ficha.accionHospital,
      otros_datos: ficha.otrosDatos,
      notas: ficha.notas,
      detalle: ficha.detalle,
      contactado: ficha.contactado
  };

  await agregarFicha(fichaFormatted);

  // Limpiar el formulario de fichas
  e.target.reset();

  // Ocultar el formulario de fichas después de guardar
  document.getElementById('ficha-form').style.display = 'none';
  document.getElementById('nuevaFicha').textContent = 'Nueva ficha';
});

// Función para obtener los parámetros de la URL
function obtenerParametrosURL() {
  const params = new URLSearchParams(window.location.search);
  const pacienteId = params.get('paciente_id');
  const ultimoContacto = params.get('ultimo_contacto');
  return { pacienteId, ultimoContacto };
}

// Cargar los afiliados al cargar la página
document.addEventListener('DOMContentLoaded', async () => {
  await cargarAfiliados();

  const { pacienteId, ultimoContacto } = obtenerParametrosURL();

  if (pacienteId) {
      document.getElementById('patientSelect').value = pacienteId;
      await cargarDatosAfiliado(pacienteId);

      // Si se especifica un último contacto, abrir el formulario de fichas y completar el campo
      if (ultimoContacto) {
          const fichaForm = document.getElementById('ficha-form');
          fichaForm.style.display = 'block';
          document.getElementById('nuevaFicha').textContent = 'Ocultar ficha';

          // Rellenar el campo "Último contacto realizado" con la fecha de "Próximo contacto planificado"
          document.querySelector('input[name="ultimoContacto"]').value = ultimoContacto;
      }

      // Actualizar los botones según el estado de afiliado seleccionado
      document.getElementById('guardarPaciente').textContent = 'Actualizar afiliado';
      document.getElementById('eliminarPaciente').disabled = false;
      document.getElementById('nuevaFicha').disabled = false;
      document.getElementById('historialFichasButton').disabled = false;
  }
});

// Cargar los afiliados al cargar la página
cargarAfiliados();