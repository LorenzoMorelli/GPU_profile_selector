import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

import * as TopBarView from './ui/TopBarView.js';
import * as QuickSettingsView from './ui/QuickSettingsView.js';

interface GpuIndicator {
    enable(): void;
    disable(): void;
    destroy(): void;
}

export default class GpuSelector extends Extension {
    private indicator: GpuIndicator | null = null;

    public enable(): void {
        const allSettings = this.getSettings();
        if (allSettings.get_boolean("force-topbar-view") !== true) {
            const qsIndicator = new (QuickSettingsView.QuickSettingsIndicator as any)(this);
            qsIndicator.quickSettingsItems.push(new (QuickSettingsView.QuickSettingsToggle as any)(this));
            Main.panel.statusArea.quickSettings.addExternalIndicator(qsIndicator);
            this.indicator = qsIndicator;
        } else {
            const tbIndicator = new (TopBarView.TopBarView as any)(this);
            Main.panel.addToStatusArea("GPU_SELECTOR", tbIndicator, 1);
            this.indicator = tbIndicator;
        }
        this.indicator!.enable();
    }

    public disable(): void {
        if (this.indicator) {
            this.indicator.disable();
            this.indicator.destroy();
            this.indicator = null;
        }
    }
}
