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
const ICON_INTEL_FILE_NAME = '/intel_icon_plain.svg';
const ICON_NVIDIA_FILE_NAME = '/nvidia_icon_plain.svg';
const ICON_HYBRID_FILE_NAME = '/hybrid_icon_plain.svg';

const GPU_PROFILE_INTEGRATED = "integrated"
const GPU_PROFILE_HYBRID = "hybrid"
const GPU_PROFILE_NVIDIA = "nvidia"


var TopBarView = GObject.registerClass(
class TopBarView extends PanelMenu.Button {  
    _init(setting_rtd3, setting_force_composition_pipeline, setting_coolbits) {
        super._init(0);
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

        // init integrated GPU profile menu item and its click listener
        this.integrated_menu_item = new PopupMenu.PopupMenuItem('Integrated');
        this.integrated_menu_item_id = this.integrated_menu_item.connect('activate', () => {
            // view stuff
            this.hybrid_menu_item.remove_child(this.icon_selector);
            this.nvidia_menu_item.remove_child(this.icon_selector);
            this.integrated_menu_item.add_child(this.icon_selector);
            this.remove_child(this.icon_top);
            this.icon_top = new St.Icon({
                gicon : Gio.icon_new_for_string(Me.dir.get_path() + ICON_INTEL_FILE_NAME),
                style_class: 'system-status-icon',
            });
            this.add_child(this.icon_top);
            // exec switch
            Utility.execSwitch(GPU_PROFILE_INTEGRATED, "", "");
        });

        // init hybrid GPU profile menu item and its click listener
        this.hybrid_menu_item = new PopupMenu.PopupMenuItem('Hybrid');
        this.hybrid_menu_item_id = this.hybrid_menu_item.connect('activate', () => {
            // view stuff
            this.integrated_menu_item.remove_child(this.icon_selector);
            this.nvidia_menu_item.remove_child(this.icon_selector);
            this.hybrid_menu_item.add_child(this.icon_selector);
            this.remove_child(this.icon_top);
            this.icon_top = new St.Icon({
                gicon : Gio.icon_new_for_string(Me.dir.get_path() + ICON_HYBRID_FILE_NAME),
                style_class: 'system-status-icon',
            });
            this.add_child(this.icon_top);
            // exec switch
            Utility.execSwitch(GPU_PROFILE_HYBRID, this._setting_rtd3, "");
        });

        // init nvidia GPU profile menu item and its click listener
        this.nvidia_menu_item = new PopupMenu.PopupMenuItem('Nvidia');
        this.nvidia_menu_item_id = this.nvidia_menu_item.connect('activate', () => {
            // view stuff
            this.integrated_menu_item.remove_child(this.icon_selector);
            this.hybrid_menu_item.remove_child(this.icon_selector);
            this.nvidia_menu_item.add_child(this.icon_selector);
            this.remove_child(this.icon_top);
            this.icon_top = new St.Icon({
                gicon : Gio.icon_new_for_string(Me.dir.get_path() + ICON_NVIDIA_FILE_NAME),
                style_class: 'system-status-icon',
            });
            this.add_child(this.icon_top);
            // exec switch
            Utility.execSwitch(GPU_PROFILE_NVIDIA, this._setting_force_composition_pipeline, this._setting_coolbits);
        });

        // add all menu item to power menu
        this.separator_menu_item = new PopupMenu.PopupSeparatorMenuItem();
        this.menu.addMenuItem(this.separator_menu_item);
        this.menu.addMenuItem(this.integrated_menu_item);
        this.menu.addMenuItem(this.hybrid_menu_item);
        this.menu.addMenuItem(this.nvidia_menu_item);

        // check GPU profile

        const gpu_profile = Utility.getCurrentProfile();
        if (gpu_profile === GPU_PROFILE_INTEGRATED) {
            this.hybrid_menu_item.remove_child(this.icon_selector);
            this.nvidia_menu_item.remove_child(this.icon_selector);
            this.integrated_menu_item.add_child(this.icon_selector);
            this.icon_top = new St.Icon({
                gicon : Gio.icon_new_for_string(Me.dir.get_path() + ICON_INTEL_FILE_NAME),
                style_class: 'system-status-icon',
            });
        } else if(gpu_profile === GPU_PROFILE_HYBRID) {
            this.integrated_menu_item.remove_child(this.icon_selector);
            this.nvidia_menu_item.remove_child(this.icon_selector);
            this.hybrid_menu_item.add_child(this.icon_selector);
            this.icon_top = new St.Icon({
                gicon : Gio.icon_new_for_string(Me.dir.get_path() + ICON_HYBRID_FILE_NAME),
                style_class: 'system-status-icon',
            });
        } else {
            this.integrated_menu_item.remove_child(this.icon_selector);
            this.hybrid_menu_item.remove_child(this.icon_selector);
            this.nvidia_menu_item.add_child(this.icon_selector);
            this.icon_top = new St.Icon({
                gicon : Gio.icon_new_for_string(Me.dir.get_path() + ICON_NVIDIA_FILE_NAME),
                style_class: 'system-status-icon',
            });
        }
        this.add_child(this.icon_top);
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
});