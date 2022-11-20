const Main = imports.ui.main;
const {St, GLib} = imports.gi;
const GObject = imports.gi.GObject;
const Gio = imports.gi.Gio;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const Util = imports.misc.util;
const Clutter = imports.gi.Clutter;

const {TopBarView, AttachedToBatteryView} = Me.imports.ui;
const {Utility} = Me.imports.lib;


class Extension {
    enable() {
        const all_settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.GPU_profile_selector');
        
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
        const all_settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.GPU_profile_selector');
        if (this.extensionViewTopbar !== null && this.extensionViewTopbar) {
            this.extensionViewTopbar = null
            this.extensionView.destroy();
        }
        this.extensionView = null;
    }
}

function init() {
    return new Extension();
}
