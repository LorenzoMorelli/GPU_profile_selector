import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as Extension from 'resource:///org/gnome/shell/extensions/extension.js';

import * as TopBarView from './ui/TopBarView.js';
import * as QuickSettingsView from './ui/QuickSettingsView.js';


export default class GpuSelector extends Extension.Extension {
    enable() {
        let all_settings = this.getSettings();
        if (all_settings.get_boolean("force-topbar-view") !== true) {
            this._indicator = new QuickSettingsView.QuickSettingsIndicator(this);
            this._indicator.quickSettingsItems.push(new QuickSettingsView.QuickSettingsToggle(this));
            Main.panel.statusArea.quickSettings.addExternalIndicator(this._indicator);
        } else {
            this._indicator = new TopBarView.TopBarView(this);
            Main.panel.addToStatusArea("GPU_SELECTOR", this._indicator, 1);
        }
        this._indicator.enable();
    }

    disable() {
        this._indicator.disable();
        this._indicator.destroy();
        this._indicator = null;
    }
}
