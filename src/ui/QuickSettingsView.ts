import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import St from 'gi://St';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import * as QuickSettings from 'resource:///org/gnome/shell/ui/quickSettings.js';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

import * as Utility from '../lib/Utility.js';
import type { GpuProfile } from '../lib/Utility.js';

export const QuickSettingsToggle = GObject.registerClass(
class QuickSettingsToggle extends QuickSettings.QuickMenuToggle {
    private activeProfile!: GpuProfile;
    private chosenProfile!: string;
    private restartPending!: boolean;
    private doNotSwitch!: boolean;
    private allSettings!: Gio.Settings;
    private itemsSection!: PopupMenu.PopupMenuSection;

    // @ts-expect-error GObject _init signature differs from parent
    _init(extensionObject: Extension): void {
        this.activeProfile = Utility.getCurrentProfile(); // initialized profile since startup
        this.chosenProfile = this.activeProfile === Utility.GPU_PROFILE_UNKNOWN
                ? 'unknown'
                : this.activeProfile;
        this.restartPending = false;
        this.doNotSwitch = false;

        super._init({
            title: 'GPU Profile',
            subtitle: Utility.capitalizeFirstLetter(this.chosenProfile),
            iconName: 'power-profile-performance-symbolic',
            toggleMode: false, // disable the possibility to click the button
            checked: this.activeProfile === 'hybrid' || this.activeProfile === 'nvidia',
        });
        this.allSettings = extensionObject.getSettings();

        // This function is unique to this class. It adds a nice header with an icon, title and optional subtitle.
        this.menu.setHeader('power-profile-performance-symbolic', this.title!, 'Choose a GPU mode');

        // add a sections of items to the menu
        this.itemsSection = new PopupMenu.PopupMenuSection();
        this.itemsSection.addAction('Integrated' + (this.activeProfile === 'integrated' ? ' (Active)' : ''), () => {
            if (this.chosenProfile !== 'integrated' && !this.doNotSwitch) {
                this.doNotSwitch = true;
                this.subtitle = 'Switching...';
                this.menu.setHeader('power-profile-performance-symbolic', this.title!, 'Switching to Integrated mode...');
                Utility.switchIntegrated(this.onSwitchComplete.bind(this));
            }
        });
        this.itemsSection.addAction('Hybrid' + (this.activeProfile === 'hybrid' ? ' (Active)' : ''), () => {
            if (this.chosenProfile !== 'hybrid' && !this.doNotSwitch) {
                this.doNotSwitch = true;
                this.subtitle = 'Switching...';
                this.menu.setHeader('power-profile-performance-symbolic', this.title!, 'Switching to Hybrid mode...');
                Utility.switchHybrid(this.allSettings, this.onSwitchComplete.bind(this));
            }
        });
        this.itemsSection.addAction('Nvidia'+ (this.activeProfile === 'nvidia' ? ' (Active)' : ''), () => {
            if (this.chosenProfile !== 'nvidia' && !this.doNotSwitch) {
                this.doNotSwitch = true;
                this.subtitle = 'Switching...';
                this.menu.setHeader('power-profile-performance-symbolic', this.title!, 'Switching to Nvidia mode...');
                Utility.switchNvidia(this.allSettings, this.onSwitchComplete.bind(this));
            }
        });
        this.menu.addMenuItem(this.itemsSection);

        // Add an entry-point for more settings
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        const settingsItem = this.menu.addAction(
            'More Settings',
            () => extensionObject.openPreferences()
        );

        // Ensure the settings are unavailable when the screen is locked
        settingsItem.visible = Main.sessionMode.allowSettings;
        (this.menu as any)._settingsActions[extensionObject.uuid] = settingsItem;
    }

    private onSwitchComplete(): void {
        // chosenProfile before switch
        let priorProfile = this.chosenProfile;
        this.chosenProfile = Utility.getCurrentProfile();

        // if chosenProfile is the same as prior profile, operation aborted
        if (this.chosenProfile === priorProfile) {
            if (this.restartPending) {
                this.subtitle = Utility.capitalizeFirstLetter(this.chosenProfile) + '*';
                this.menu.setHeader('power-profile-performance-symbolic', this.title!,
                    'Restart to apply ' + Utility.capitalizeFirstLetter(this.chosenProfile) + ' mode');
            }
            else { // GPU switch attempt aborted
                this.subtitle = Utility.capitalizeFirstLetter(this.chosenProfile);
                this.menu.setHeader('power-profile-performance-symbolic', this.title!, 'Choose a GPU mode');
            }
        }
        else if (this.activeProfile === this.chosenProfile) {
            this.subtitle = Utility.capitalizeFirstLetter(this.activeProfile);
            this.menu.setHeader('power-profile-performance-symbolic', this.title!, 'Choose a GPU mode');
            this.restartPending = false;
        }
        else {
            this.subtitle = Utility.capitalizeFirstLetter(this.chosenProfile) + '*';
            this.menu.setHeader('power-profile-performance-symbolic', this.title!,
                'Restart to apply ' + Utility.capitalizeFirstLetter(this.chosenProfile) + ' mode');
            Utility.requestReboot();
            this.restartPending = true;
        }

        this.doNotSwitch = false;
    }
});

export const QuickSettingsIndicator = GObject.registerClass(
class QuickSettingsIndicator extends QuickSettings.SystemIndicator {
    private statusIndicator!: St.Icon;

    // @ts-expect-error GObject _init signature differs from parent
    _init(extensionObject: Extension): void {
        super._init();
    }

    public enable(): void {
        this.statusIndicator = this._addIndicator();
        this.statusIndicator.icon_name = 'power-profile-performance-symbolic';
        this.statusIndicator.visible = false;
    }

    public disable(): void {
        this.quickSettingsItems.forEach((item: any) => item.destroy());
        this.statusIndicator.destroy();
        super.destroy();
    }
});
