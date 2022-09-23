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

const {Utility} = Me.imports.models;

const ICON_SIZE = 6;
const ICON_SELECTOR_FILE_NAME = '/icon.png';

const GPU_PROFILE_INTEGRATED = "integrated"
const GPU_PROFILE_HYBRID = "hybrid"
const GPU_PROFILE_NVIDIA = "nvidia"


var AttachedToBatteryView = class {
    constructor(setting_rtd3, setting_force_composition_pipeline, setting_coolbits) {
        // Load settings
        this._setting_rtd3 = setting_rtd3;
        this._setting_force_composition_pipeline = setting_force_composition_pipeline;
        this._setting_coolbits = setting_coolbits;
    }

    enable() {
        this.icon_selector = new St.Icon({
            gicon : Gio.icon_new_for_string(Me.dir.get_path() + ICON_SELECTOR_FILE_NAME),
            style_class : 'system-status-icon',
            icon_size: ICON_SIZE
        });


        // get power menu section
        this.power_menu = Main.panel.statusArea['aggregateMenu']._power._item.menu;

        // init integrated GPU profile menu item and its click listener
        this.integrated_menu_item = new PopupMenu.PopupMenuItem('Integrated');
        this.integrated_menu_item_id = this.integrated_menu_item.connect('activate', () => {
            this.hybrid_menu_item.remove_child(this.icon_selector);
            this.nvidia_menu_item.remove_child(this.icon_selector);
            this.integrated_menu_item.add_child(this.icon_selector);
            // exec switch
            Utility.execSwitch(GPU_PROFILE_INTEGRATED, "", "");
        });

        // init hybrid GPU profile menu item and its click listener
        this.hybrid_menu_item = new PopupMenu.PopupMenuItem('Hybrid');
        this.hybrid_menu_item_id = this.hybrid_menu_item.connect('activate', () => {
            this.integrated_menu_item.remove_child(this.icon_selector);
            this.nvidia_menu_item.remove_child(this.icon_selector);
            this.hybrid_menu_item.add_child(this.icon_selector);
            // exec switch
            Utility.execSwitch(GPU_PROFILE_HYBRID, this._setting_rtd3, "");
        });

        // init nvidia GPU profile menu item and its click listener
        this.nvidia_menu_item = new PopupMenu.PopupMenuItem('Nvidia');
        this.nvidia_menu_item_id = this.nvidia_menu_item.connect('activate', () => {
            this.integrated_menu_item.remove_child(this.icon_selector);
            this.hybrid_menu_item.remove_child(this.icon_selector);
            this.nvidia_menu_item.add_child(this.icon_selector);
            // exec switch
            Utility.execSwitch(GPU_PROFILE_NVIDIA, this._setting_force_composition_pipeline, this._setting_coolbits);
        });

        // set icon_selector on current status profile
        let current_profile = Utility.getCurrentProfile();
        if(current_profile === GPU_PROFILE_INTEGRATED) {
            this.hybrid_menu_item.remove_child(this.icon_selector);
            this.nvidia_menu_item.remove_child(this.icon_selector);
            this.integrated_menu_item.add_child(this.icon_selector);
        } else if(current_profile === GPU_PROFILE_NVIDIA) {
            this.integrated_menu_item.remove_child(this.icon_selector);
            this.hybrid_menu_item.remove_child(this.icon_selector);
            this.nvidia_menu_item.add_child(this.icon_selector);
        } else {
            this.integrated_menu_item.remove_child(this.icon_selector);
            this.nvidia_menu_item.remove_child(this.icon_selector);
            this.hybrid_menu_item.add_child(this.icon_selector);
        }

        // add all menu item to power menu
        this.separator_menu_item = new PopupMenu.PopupSeparatorMenuItem();
        this.power_menu.addMenuItem(this.separator_menu_item);
        this.power_menu.addMenuItem(this.integrated_menu_item);
        this.power_menu.addMenuItem(this.hybrid_menu_item);
        this.power_menu.addMenuItem(this.nvidia_menu_item);
    }

    disable() {

        if (this.integrated_menu_item_id) {
            this.integrated_menu_item.disconnect(this.integrated_menu_item_id);
            this.integrated_menu_item_id = 0;
        }
        this.integrated_menu_item.destroy();
        this.integrated_menu_item = null;

        if (this.hybrid_menu_item_id) {
            this.hybrid_menu_item.disconnect(this.hybrid_menu_item_id);
            this.hybrid_menu_item_id = 0;
        }
        this.hybrid_menu_item.destroy();
        this.hybrid_menu_item = null;

        if (this.nvidia_menu_item_id) {
            this.nvidia_menu_item.disconnect(this.nvidia_menu_item_id);
            this.nvidia_menu_item_id = 0;
        }
        this.nvidia_menu_item.destroy();
        this.nvidia_menu_item = null;

        this.separator_menu_item.destroy();
        this.separator_menu_item = null;

        this.icon_selector = null;
    }
}
