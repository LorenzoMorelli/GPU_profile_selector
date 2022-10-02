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

const {TopBarView, AttachedToBatteryView} = Me.imports.views;
const {Utility} = Me.imports.models;


class Extension {
    enable() {
        const all_settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.GPU_profile_selector');

        // if there is no battery, there is no power management panel, so the extension moves to TopBar
        if (Utility.isBatteryPlugged()) {
            this.extensionView = new AttachedToBatteryView.AttachedToBatteryView(all_settings);
        } else {
            this.extensionView = new TopBarView.TopBarView(all_settings);
            Main.panel.addToStatusArea("GPU_SELECTOR", this.extensionView, 1);
        }
        this.extensionView.enable();
    }

    disable() {
        this.extensionView.disable();
        // also topbar popup must be destroyed
        if (!Utility.isBatteryPlugged()) {
            this.extensionView.destroy();
        }
        this.extensionView = null;
    }
}

function init() {
    return new Extension();
}
