import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import GLib from 'gi:://GLib';
import St from 'gi://St';
import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import * as Util from 'resource:///org/gnome/shell/misc/util.js';
import Clutter from 'gi://Clutter';
import * as QuickSettings from 'resource:///org/gnome/shell/ui/quickSettings.js';
import * as QuickSettingsMenu from 'resource:///org/gnome/shell/ui/panel/statusArea/quickSettingsMenu.js';

import * as Utility from '../lib/Utility.js';

const ICON_SIZE = 6;


const AttachedToBatteryToggle = GObject.registerClass(
class AttachedToBatteryToggle extends QuickSettings.QuickMenuToggle {
    constructor(all_settings) {
        super();
        this.all_settings = all_settings;
    }

    _init() {
        super._init({
            label: Utility.capitalizeFirstLetter(Utility.getCurrentProfile()),
            gicon : Gio.icon_new_for_string(Me.dir.get_path() + Utility.EXTENSION_ICON_FILE_NAME),
            title: Utility.capitalizeFirstLetter(Utility.getCurrentProfile()),
            toggleMode: true,
        });
        
        // This function is unique to this class. It adds a nice header with an
        // icon, title and optional subtitle. It's recommended you do so for
        // consistency with other menus.
        this.menu.setHeader('selection-mode-symbolic', Utility.capitalizeFirstLetter(Utility.getCurrentProfile()), 'Choose a GPU mode');
        
        // You may also add sections of items to the menu
        this._itemsSection = new PopupMenu.PopupMenuSection();
        this._itemsSection.addAction('Nvidia', () => {
            Utility.switchNvidia(this.all_settings);
            super.title = 'Nvidia'
            this.menu.setHeader('selection-mode-symbolic', 'Nvidia (Reboot needed)', 'Choose a GPU mode');
        });
        this._itemsSection.addAction('Hybrid', () => {
            Utility.switchHybrid(this.all_settings);
            super.title = 'Hybrid'
            this.menu.setHeader('selection-mode-symbolic', 'Hybrid (Reboot needed)', 'Choose a GPU mode');
        });
        this._itemsSection.addAction('Integrated', () => {
            Utility.switchIntegrated();
            super.title = 'Integrated'
            this.menu.setHeader('selection-mode-symbolic', 'Integrated (Reboot needed)', 'Choose a GPU mode');
        });
        this.menu.addMenuItem(this._itemsSection);

        // Add an entry-point for more settings
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        const settingsItem = this.menu.addAction('More Settings',
            () => ExtensionUtils.openPrefs());
            
        // Ensure the settings are unavailable when the screen is locked
        settingsItem.visible = Main.sessionMode.allowSettings;
        this.menu._settingsActions[Extension.uuid] = settingsItem;
    }
});

const AttachedToBatteryView = GObject.registerClass(
class AttachedToBatteryView extends QuickSettings.SystemIndicator {
    _init(all_settings) {
        super._init();
        // Create the icon for the indicator
        this._indicator = this._addIndicator();
        //this._indicator.gicon = Gio.icon_new_for_string(Me.dir.get_path() + Utility.ICON_SELECTOR_FILE_NAME);
        this._indicator.visible = false;
        
        // Create the toggle and associate it with the indicator, being sure to
        // destroy it along with the indicator
        this.quickSettingsItems.push(new AttachedToBatteryToggle(all_settings));
        
        // Add the indicator to the panel and the toggle to the menu
        QuickSettingsMenu._indicators.add_child(this);
        QuickSettingsMenu._addItems(this.quickSettingsItems);
    }

    disable() {
        this.quickSettingsItems.forEach(item => item.destroy());
        this._indicator.destroy();
        super.destroy();
    }
});

export function getAttachedToBatteryView(all_settings) {
    return new AttachedToBatteryView(all_settings);
}


