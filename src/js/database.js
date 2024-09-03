// Acceder al plugin SQL a través de la variable global
const Database = window.__TAURI_PLUGIN_SQL__;

// Función para formatear fechas en formato dd/mm/yyyy
function formatearFecha(fecha) {
    if (!fecha) return '';
    const partes = fecha.split('-');
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
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

// Cargar todos los afiliados
async function cargarAfiliados() {
    try {
        const db = await cargarBaseDeDatos();

        // Consulta para obtener todos los afiliados
        const afiliados = await db.select('SELECT * FROM afiliados');

        const tbody = document.getElementById('patients-body');
        tbody.innerHTML = ''; // Limpiar la tabla antes de cargar todos los afiliados

        // Insertar cada afiliado en la tabla
        afiliados.forEach(afiliado => {
            insertarFilaAfiliado(afiliado);
        });

        // Ocultar el botón "Ver todos los afiliados" si se están mostrando todos
        document.getElementById('verTodosBtn').style.display = 'none';

    } catch (error) {
        console.error('Error al cargar afiliados:', error);
    }
}

// Cargar solo el afiliado seleccionado si hay uno en localStorage
async function cargarAfiliadoSeleccionado() {
    const selectedId = localStorage.getItem('selectedAfiliadoId');

    if (selectedId) {
        try {
            const db = await cargarBaseDeDatos();

            // Consulta para obtener el afiliado seleccionado
            const afiliado = await db.select('SELECT * FROM afiliados WHERE id = ?', [selectedId]);

            if (afiliado.length > 0) {
                insertarFilaAfiliado(afiliado[0]);
                // Mostrar automáticamente las fichas del afiliado seleccionado
                await mostrarFichas(afiliado[0].id);
            }

            // Mostrar el botón "Ver todos los afiliados"
            document.getElementById('verTodosBtn').style.display = 'inline-block';

            // Limpiar el localStorage después de cargar los datos
            localStorage.removeItem('selectedAfiliadoId');
        } catch (error) {
            console.error('Error al cargar el afiliado seleccionado:', error);
        }
    } else {
        // Si no hay un afiliado seleccionado, cargar todos los afiliados
        cargarAfiliados();
    }
}

// Función para insertar una fila de afiliado en la tabla
function insertarFilaAfiliado(afiliado) {
    const tbody = document.getElementById('patients-body');

    const filaAfiliado = `
        <tr>
            <td>${afiliado.id}</td>
            <td class="paciente-apellido" data-id="${afiliado.id}" style="cursor: pointer;">${afiliado.apellido}</td>
            <td>${afiliado.nombre}</td>
            <td>${afiliado.direccion}</td>
            <td>${afiliado.codigo_postal}</td>
            <td>${afiliado.localidad}</td>
            <td>${afiliado.provincia}</td>
            <td>${formatearFecha(afiliado.fecha_nacimiento)}</td>
            <td>${afiliado.sexo}</td>
            <td>${afiliado.obra_social}</td>
            <td>${afiliado.telefono}</td>
            <td>${afiliado.grupo_sanguineo}</td>
            <td>${afiliado.estado_civil}</td>
            <td>${afiliado.pareja}</td>
            <td>${afiliado.hijo1}</td>
            <td>${afiliado.hijo2}</td>
            <td>${afiliado.hijo3}</td>
            <td>${afiliado.contacto_emergencia}</td>
        </tr>
        <tr id="fichas-${afiliado.id}" class="fichas-row" style="display: none;">
            <td colspan="18">
                <table class="database-table ficha-table">
                    <thead>
                        <tr>
                            <th>ID Ficha</th>
                            <th>Último Contacto</th>
                            <th>Fecha Último Evento</th>
                            <th>Próximo Contacto</th>
                            <th>Antecedentes</th>
                            <th>Hecho</th>
                            <th>Acción Hospitalia</th>
                            <th>Otros Datos</th>
                            <th>Notas</th>
                            <th>Detalle</th>
                            <th>Contactado</th>
                        </tr>
                    </thead>
                    <tbody id="ficha-body-${afiliado.id}">
                        <!-- Las fichas serán insertadas aquí -->
                    </tbody>
                </table>
            </td>
        </tr>
    `;

    tbody.insertAdjacentHTML('beforeend', filaAfiliado);

    // Asignar evento de click para mostrar las fichas
    document.querySelector(`.paciente-apellido[data-id="${afiliado.id}"]`).addEventListener('click', async function () {
        await mostrarFichas(afiliado.id);
    });
}

// Función para mostrar/ocultar fichas al hacer clic en el apellido
async function mostrarFichas(afiliadoId, mantenerAbierto = false) {
    const fichaRow = document.getElementById(`fichas-${afiliadoId}`);
    const fichaBody = document.getElementById(`ficha-body-${afiliadoId}`);

    if (fichaRow.style.display === 'none' || mantenerAbierto) {
        fichaRow.style.display = 'table-row';

        const db = await cargarBaseDeDatos();
        const fichas = await db.select('SELECT * FROM fichas WHERE paciente_id = ?', [afiliadoId]);

        fichaBody.innerHTML = '';

        if (fichas.length > 0) {
            fichas.forEach(ficha => {
                const fichaInfo = `
                    <tr>
                        <td>${ficha.id || ''}</td>
                        <td>${formatearFecha(ficha.ultimo_contacto) || ''}</td>
                        <td>${formatearFecha(ficha.fecha_ultimo_evento) || ''}</td>
                        <td>${formatearFecha(ficha.proximo_contacto) || ''}</td>
                        <td>${ficha.antecedentes || ''}</td>
                        <td>${ficha.hecho || ''}</td>
                        <td>${ficha.accion_hospital || ''}</td>
                        <td>${ficha.otros_datos || ''}</td>
                        <td>${ficha.notas || ''}</td>
                        <td>${ficha.detalle || ''}</td>
                        <td>
                            <button class="eliminar-ficha-btn" data-id="${ficha.id}">Eliminar</button>
                        </td>
                    </tr>
                `;
                fichaBody.insertAdjacentHTML('beforeend', fichaInfo);
            });

            // Asignar eventos de eliminación a los botones "Eliminar"
            document.querySelectorAll('.eliminar-ficha-btn').forEach(button => {
                button.addEventListener('click', async function() {
                    const fichaId = this.getAttribute('data-id');
                    if (confirm('¿Estás seguro de que deseas eliminar esta ficha?')) {
                        await eliminarFicha(fichaId);
                        await mostrarFichas(afiliadoId, true); // Recargar las fichas sin cerrar el menú
                    }
                });
            });
        } else {
            fichaBody.innerHTML = '<tr><td colspan="11"><strong>Este afiliado no tiene fichas.</strong></td></tr>';
        }
    } else {
        fichaRow.style.display = 'none';
    }
}


// Función para eliminar una ficha
async function eliminarFicha(fichaId) {
    try {
        const db = await cargarBaseDeDatos();
        await db.execute('DELETE FROM fichas WHERE id = ?', [fichaId]);
        alert('Ficha eliminada correctamente');
    } catch (error) {
        console.error('Error al eliminar la ficha:', error);
        alert('Error al eliminar la ficha');
    }
}


// Evento para manejar el clic en el botón "Ver todos los afiliados"
document.getElementById('verTodosBtn').addEventListener('click', cargarAfiliados);

// Cargar el afiliado seleccionado al cargar la página
document.addEventListener('DOMContentLoaded', cargarAfiliadoSeleccionado);
