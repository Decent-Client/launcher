import { appDataDir } from "@tauri-apps/api/path";
import {
  BaseDirectory,
  exists,
  mkdir,
  readTextFile,
  writeTextFile,
} from "@tauri-apps/plugin-fs";
import { createContext, useContext, useEffect, useState } from "react";
import { useLocalStorage } from "~/hooks/local-storage";
import {
  Settings,
  initialSettings as defaultSettings,
} from "~/lib/constants/settings";
import { deepMerge } from "~/lib/utils";

export type SettingsTab =
  | "preferences"
  | "launcher"
  | "notifications"
  | "advanced"
  | "resources";

type SettingsProviderState = {
  settingsTab: SettingsTab;
  setSettingsTab: (tab: SettingsTab) => void;
  settings: Settings;
  setSettings: (settings: Settings) => void;
};

type FileNameJSON = `${string}.json`;

const SettingsProviderContext = createContext<SettingsProviderState>({
  settingsTab: "preferences",
  setSettingsTab: () => null,
  settings: defaultSettings,
  setSettings: () => null,
});

export function SettingsProvider({
  children,
  tabStorageKey = "settings-tab",
  initialSettings = defaultSettings,
  settingsFile = "launcher-settings.json",
}: {
  children: React.ReactNode;
  tabStorageKey?: string;
  initialSettings?: Settings;
  settingsFile?: FileNameJSON;
}) {
  const [settingsTab, setSettingsTab] = useLocalStorage<SettingsTab>(
    tabStorageKey,
    "preferences",
  );
  const [settings, setSettingsState] = useState<Settings>(initialSettings);

  useEffect(() => {
    initialize(initialSettings);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function initialize(values: Settings) {
    if (await exists(settingsFile, { baseDir: BaseDirectory.AppData })) {
      return readTextFile(settingsFile, {
        baseDir: BaseDirectory.AppData,
      }).then((content) => setSettingsState(JSON.parse(content)));
    }

    await createSettingsFile(settingsFile, values);
  }

  async function setSettings(values: Settings) {
    try {
      setSettingsState((prev) => deepMerge(prev, values));
      createSettingsFile(settingsFile, deepMerge(settings, values));
      console.log("Settings file written successfully");
    } catch (error) {
      console.error("Error writing settings file: ", error);
    }
  }

  return (
    <SettingsProviderContext.Provider
      value={{ settingsTab, setSettingsTab, settings, setSettings }}
    >
      {children}
    </SettingsProviderContext.Provider>
  );
}

export const useSettings = () => {
  const context = useContext(SettingsProviderContext);

  if (context === undefined)
    throw new Error("useSettings must be used within a SettingsProvider");

  return context;
};

async function createSettingsFile(fileName: FileNameJSON, content: Settings) {
  try {
    if (!(await exists(fileName, { baseDir: BaseDirectory.AppData }))) {
      await mkdir(await appDataDir());
    }

    await writeTextFile(fileName, JSON.stringify(content, null, 2), {
      baseDir: BaseDirectory.AppData,
    });
  } catch (error) {
    console.error("Error creating settings file: ", error);
  }
}
