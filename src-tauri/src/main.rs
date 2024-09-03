// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri_plugin_sql::{Builder, Migration, MigrationKind};

fn main() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "create_afiliados_table",
            sql: "
                CREATE TABLE IF NOT EXISTS afiliados (
                    id INTEGER PRIMARY KEY,
                    nombre TEXT NOT NULL,
                    apellido TEXT NOT NULL,
                    direccion TEXT NOT NULL,
                    codigo_postal TEXT NOT NULL,
                    localidad TEXT NOT NULL,
                    provincia TEXT NOT NULL,
                    fecha_nacimiento TEXT NOT NULL,
                    sexo TEXT NOT NULL,
                    obra_social TEXT,
                    telefono TEXT,
                    grupo_sanguineo TEXT,
                    estado_civil TEXT,
                    pareja TEXT,
                    hijo1 TEXT,
                    hijo2 TEXT,
                    hijo3 TEXT,
                    contacto_emergencia TEXT
                );
            ",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "create_fichas_table",
            sql: "
                CREATE TABLE IF NOT EXISTS fichas (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    paciente_id INTEGER NOT NULL,
                    ultimo_contacto DATE,
                    fecha_ultimo_evento DATE,
                    proximo_contacto DATE,
                    antecedentes TEXT,
                    hecho TEXT,
                    accion_hospital TEXT,
                    otros_datos TEXT,
                    notas TEXT,
                    detalle TEXT,
                    contactado TEXT,
                    FOREIGN KEY(paciente_id) REFERENCES afiliados(id) ON DELETE CASCADE
                );
            ",
            kind: MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        .plugin(
            Builder::default()
                .add_migrations("sqlite:afiliados.db", migrations)
                .build(),
        )
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}