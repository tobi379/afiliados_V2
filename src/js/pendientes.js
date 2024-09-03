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

// Cargar los pendientes con fecha de contacto igual o posterior a hoy
async function cargarPendientes() {
    try {
        const db = await cargarBaseDeDatos();
        const hoy = new Date().toISOString().split('T')[0];

        // Consulta para obtener los pendientes no contactados y ordenarlos por fecha de próximo contacto
        const pendientes = await db.select(`
            SELECT afiliados.id AS paciente_id, afiliados.nombre, afiliados.apellido, fichas.*
            FROM fichas
            JOIN afiliados ON fichas.paciente_id = afiliados.id
            WHERE fichas.proximo_contacto >= ? 
              AND fichas.contactado IS NULL
            ORDER BY fichas.proximo_contacto ASC
        `, [hoy]);

        const tbody = document.getElementById('pendientes-body');
        tbody.innerHTML = '';

        if (pendientes.length > 0) {
            pendientes.forEach(ficha => {
                const isAtrasada = ficha.proximo_contacto < hoy;
                const filaPendiente = `
                    <tr class="${isAtrasada ? 'atrasada' : ''}">
                        <td>${ficha.id || ''}</td>
                        <td>${ficha.apellido}, ${ficha.nombre}</td>
                        <td>
                            <span class="proximo-contacto">${formatearFecha(ficha.proximo_contacto) || ''}</span>
                            <button class="editar-fecha" data-id="${ficha.id}">Editar</button>
                        </td>
                        <td>${ficha.hecho || ''}</td>
                        <td>${ficha.accion_hospital || ''}</td>
                        <td>${ficha.otros_datos || ''}</td>
                        <td>${ficha.notas || ''}</td>
                        <td>${ficha.detalle || ''}</td>
                        <td>
                            <input type="checkbox" class="contactado-checkbox" data-id="${ficha.id}" ${ficha.contactado ? 'checked' : ''}>
                        </td>
                    </tr>
                `;
                tbody.insertAdjacentHTML('beforeend', filaPendiente);
            });

            // Asignar eventos a los botones de editar fecha
            document.querySelectorAll('.editar-fecha').forEach(button => {
                button.addEventListener('click', async (e) => {
                    const fichaId = e.target.getAttribute('data-id');
                    const nuevaFecha = prompt('Ingrese la nueva fecha de próximo contacto (dd/mm/yyyy):');

                    if (nuevaFecha) {
                        const [day, month, year] = nuevaFecha.split('/');
                        const formattedDate = `${year}-${month}-${day}`;

                        // Validar que la nueva fecha no sea anterior a la fecha de hoy
                        const hoy = new Date();
                        const fechaIngresada = new Date(`${formattedDate}T00:00:00`);

                        if (fechaIngresada < hoy) {
                            alert('La fecha de próximo contacto no puede ser anterior a la fecha de hoy.');
                        } else {
                            await actualizarFechaContacto(fichaId, formattedDate);
                        }
                    }
                });
            });

            // Asignar eventos a los checkboxes de contactado
            document.querySelectorAll('.contactado-checkbox').forEach(checkbox => {
                checkbox.addEventListener('change', async (e) => {
                    const fichaId = e.target.getAttribute('data-id');
                    const contactado = e.target.checked ? 'Sí' : null;

                    // Mostrar mensaje de confirmación
                    const confirmar = confirm('¿Estás seguro de que deseas marcar esta ficha como contactada?');
                    
                    if (confirmar) {
                        await actualizarContactado(fichaId, contactado);
                    } else {
                        e.target.checked = !e.target.checked; // Revertir el cambio si no se confirma
                    }
                });
            });

        } else {
            tbody.innerHTML = '<tr><td colspan="9"><strong>No hay pendientes.</strong></td></tr>';
        }
    } catch (error) {
        console.error('Error al cargar los pendientes:', error);
    }
}

// Función para actualizar la fecha de próximo contacto
async function actualizarFechaContacto(fichaId, nuevaFecha) {
    try {
        const db = await cargarBaseDeDatos();
        await db.execute('UPDATE fichas SET proximo_contacto = ? WHERE id = ?', [nuevaFecha, fichaId]);
        alert('Fecha de próximo contacto actualizada.');
        cargarPendientes(); // Recargar la tabla después de la actualización
    } catch (error) {
        console.error('Error al actualizar la fecha de contacto:', error);
        alert('Error al actualizar la fecha de contacto.');
    }
}

// Función para actualizar el estado de "Contactado"
async function actualizarContactado(fichaId, contactado) {
    try {
        const db = await cargarBaseDeDatos();
        const ficha = await db.select('SELECT paciente_id, proximo_contacto FROM fichas WHERE id = ?', [fichaId]);
        
        if (ficha.length > 0) {
            const pacienteId = ficha[0].paciente_id;
            const proximoContacto = ficha[0].proximo_contacto;

            await db.execute('UPDATE fichas SET contactado = ? WHERE id = ?', [contactado, fichaId]);
            cargarPendientes(); // Recargar la tabla después de la actualización

            // Redirigir a index.html con los parámetros de afiliado y ficha
            window.location.href = `index.html?paciente_id=${pacienteId}&ultimo_contacto=${proximoContacto}`;
        }
    } catch (error) {
        console.error('Error al actualizar el estado de contactado:', error);
        alert('Error al actualizar el estado de contactado.');
    }
}

// Cargar los pendientes al cargar la página
document.addEventListener('DOMContentLoaded', cargarPendientes);