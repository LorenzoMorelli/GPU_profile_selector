import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import GLib from 'gi:://GLib';
import St from 'gi://St';
import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import {Utility} from './lib/Utility.js';
import {TopBarView} from './ui/TopBarView.js';
import {AttachedToBatteryView} from './ui/AttachedToBatteryView.js';

import * as Util from 'resource:///org/gnome/shell/misc/util.js';
import Clutter from 'gi://Clutter';

import * as Extension from 'resource:///org/gnome/shell/extensions/extension.js';


export default class GpuSelector extends Extension.Extension {
    enable() {
        all_settings = this.getSettings('org.gnome.shell.extensions.GPU_profile_selector');
        // if there is no battery, there is no power management panel, so the extension moves to TopBar
        if (Utility.isBatteryPlugged() && all_settings.get_boolean("force-topbar-view") !== true) {
            this.extensionViewTopbar = false
            this.extensionView = AttachedToBatteryView.getAttachedToBatteryView(all_settings);
        } else {
            this.extensionViewTopbar = true
            this.extensionView = new TopBarView.TopBarView(all_settings);
            Main.panel.addToStatusArea("GPU_SELECTOR", this.extensionView, 1);
            this.extensionView.enable();
        }
    }

    disable() {
            this.extensionView.disable();
            // also topbar popup must be destroyed
            if (this.extensionViewTopbar !== null && this.extensionViewTopbar) {
                this.extensionViewTopbar = null
                this.extensionView.destroy();
            }
            this.extensionView = null;
        }
}
