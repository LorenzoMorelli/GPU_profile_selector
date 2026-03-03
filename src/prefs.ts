import Gio from 'gi://Gio';
import Adw from 'gi://Adw';

import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class GpuProfileSwitcherPreferences extends ExtensionPreferences {
    public async fillPreferencesWindow(window: Adw.PreferencesWindow): Promise<void> {
        // Create a preferences page, with a single group
        const page = new Adw.PreferencesPage({
            title: _('General'),
            icon_name: 'dialog-information-symbolic',
        });

        const group = new Adw.PreferencesGroup({
            title: _('Settings'),
            description: _('Adjust extension and GPU profile switching options'),
        });

        const rowRtd3 = new Adw.SwitchRow({
            title: _('RTD3'),
            subtitle: _('Enable PCI-Express Runtime D3 (RTD3) Power Management on Hybrid mode. When not disabled, RTD3 allows the dGPU to be dynamically turned off when not in use'),
        });

        const rowForceCompositionPipeline = new Adw.SwitchRow({
            title: _('Force Composition Pipeline'),
            subtitle: _('Enable ForceCompositionPipeline on Nvidia mode. Use this option if facing screen tearing'),
        });

        const rowCoolbits = new Adw.SwitchRow({
            title: _('Coolbits'),
            subtitle: _('Enable Coolbits, which allows overclocking on Nvidia mode (not recommended)'),
        });

        const rowForceTopbarView = new Adw.SwitchRow({
            title: _('Force Topbar View'),
            subtitle: _('Enable force topbar view'),
        });

        group.add(rowRtd3);
        group.add(rowForceCompositionPipeline);
        group.add(rowCoolbits);
        group.add(rowForceTopbarView);

        page.add(group);

        const settings = this.getSettings();
        settings.bind('rtd3', rowRtd3 as any, 'active', Gio.SettingsBindFlags.DEFAULT);
        settings.bind('force-composition-pipeline', rowForceCompositionPipeline as any, 'active', Gio.SettingsBindFlags.DEFAULT);
        settings.bind('coolbits', rowCoolbits as any, 'active', Gio.SettingsBindFlags.DEFAULT);
        settings.bind('force-topbar-view', rowForceTopbarView as any, 'active', Gio.SettingsBindFlags.DEFAULT);
        window.add(page);
    }
}
