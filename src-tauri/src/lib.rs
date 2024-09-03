use std::sync::Mutex;
use serde::Serialize;
use tauri::{ipc::Channel, AppHandle, State};
use tauri_plugin_updater::{Update, UpdaterExt};

#[derive(Debug, thiserror::Error)]
enum Error {
  #[error(transparent)]
  Updater(#[from] tauri_plugin_updater::Error),
  #[error("there is no pending update")]
  NoPendingUpdate,
}

impl Serialize for Error {
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
      S: serde::Serializer,
    {
      serializer.serialize_str(self.to_string().as_str())
    }
  }
  
  type Result<T> = std::result::Result<T, Error>;
  
  #[derive(Clone, Serialize)]
  #[serde(tag = "event", content = "data")]
  enum DownloadEvent {
    #[serde(rename_all = "camelCase")]
    Started {
      content_length: Option<u64>,
    },
    #[serde(rename_all = "camelCase")]
    Progress {
      chunk_length: usize,
    },
    Finished,
  }
  
  #[derive(Serialize)]
  #[serde(rename_all = "camelCase")]
  struct UpdateMetadata {
    version: String,
    current_version: String,
  }
  
  #[tauri::command]
  async fn fetch_update(
    app: AppHandle,
    pending_update: State<'_, PendingUpdate>,
  ) -> Result<Option<UpdateMetadata>> {
    let update = app.updater()?.check().await?;
  
    let update_metadata = update.as_ref().map(|update| UpdateMetadata {
      version: update.version.clone(),
      current_version: update.current_version.clone(),
    });
  
    *pending_update.0.lock().unwrap() = update;
  
    Ok(update_metadata)
  }
  
  #[tauri::command]
    async fn install_update(pending_update: State<'_, PendingUpdate>, on_event: Channel<DownloadEvent>) -> Result<()> {
    let Some(update) = pending_update.0.lock().unwrap().take() else {
      return Err(Error::NoPendingUpdate);
    };
  
    let mut started = false; // Aquí se declara como mutable
  
    update
      .download_and_install(
        |chunk_length, content_length| {
          if !started {
            let _ = on_event.send(DownloadEvent::Started { content_length });
            started = true; // Ahora esto es permitido
          }
  
          let _ = on_event.send(DownloadEvent::Progress { chunk_length });
        },
        || {
          let _ = on_event.send(DownloadEvent::Finished);
        },
      )
      .await?;
  
    Ok(())
}

  
  struct PendingUpdate(Mutex<Option<Update>>);

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_updater::Builder::new().build()) // Agregar el plugin de actualizaciones
        .invoke_handler(tauri::generate_handler![fetch_update, install_update])
        .manage(PendingUpdate(Mutex::new(None)))
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}