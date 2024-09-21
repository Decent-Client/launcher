use tauri::WebviewWindow;

#[cfg(target_os = "macos")]
use tauri::window::{Effect, EffectState, EffectsBuilder};

#[cfg(target_os = "windows")]
use tauri::window::{Effect, EffectsBuilder};
#[cfg(target_os = "windows")]
use windows_version::OsVersion;

pub fn apply_window_effects(window: &WebviewWindow) {
    #[cfg(target_os = "macos")]
    {
        let _ = window.set_effects(
            EffectsBuilder::new()
                .effect(Effect::Popover)
                .state(EffectState::Active)
                .build(),
        );
    }

    #[cfg(target_os = "windows")]
    {
        let version = OsVersion::current();
        let effects;

        if version.major > 10 || (version.major == 10 && version.minor >= 22000) {
            effects = EffectsBuilder::new().effect(Effect::Mica).build();
        } else if version.major == 10 {
            effects = EffectsBuilder::new().effect(Effect::Acrylic).build();
        } else {
            effects = EffectsBuilder::new().effect(Effect::Blur).build();
        }

        window.set_effects(effects).unwrap();
    }
}
