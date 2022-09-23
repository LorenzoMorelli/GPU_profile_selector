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


const BLACKLIST_PATH = '/etc/modprobe.d/blacklist-nvidia.conf';
const UDEV_INTEGRATED_PATH = '/lib/udev/rules.d/50-remove-nvidia.rules';
const XORG_PATH = '/etc/X11/xorg.conf';
const MODESET_PATH = '/etc/modprobe.d/nvidia.conf';
const ICON_SIZE = 6;
const ICON_SELECTOR_FILE_NAME = '/icon.png';
const ICON_INTEL_FILE_NAME = '/intel_icon_plain.svg';
const ICON_NVIDIA_FILE_NAME = '/nvidia_icon_plain.svg';
const ICON_HYBRID_FILE_NAME = '/hybrid_icon_plain.svg';

const GPU_PROFILE_INTEGRATED = "integrated"
const GPU_PROFILE_HYBRID = "hybrid"
const GPU_PROFILE_NVIDIA = "nvidia"
//const COMMAND_TO_SWITCH_GPU_PROFILE = "yes | pkexec envycontrol -s {profile}; gnome-session-quit --reboot";
const COMMAND_TO_SWITCH_GPU_PROFILE = "printf '%s\n' {choice1} {choice2} | pkexec envycontrol -s {profile}; gnome-session-quit --reboot";

function _getCurrentProfile() {
    // init files needed
    const black_list_file = Gio.File.new_for_path(BLACKLIST_PATH);
    const udev_integrated_file = Gio.File.new_for_path(UDEV_INTEGRATED_PATH);
    const xorg_file = Gio.File.new_for_path(XORG_PATH);
    const modeset_file = Gio.File.new_for_path(MODESET_PATH);

    // check in which mode you are
    if (black_list_file.query_exists(null) && udev_integrated_file.query_exists(null)) {
        return GPU_PROFILE_INTEGRATED;
    } else if (xorg_file.query_exists(null) && modeset_file.query_exists(null)) {
        return GPU_PROFILE_NVIDIA;
    } else {
        return GPU_PROFILE_HYBRID;
    }
}

function isBatteryPlugged() {
    const directory = Gio.File.new_for_path('/sys/class/power_supply/');
        // Synchronous, blocking method
    const iter = directory.enumerate_children('standard::*', Gio.FileQueryInfoFlags.NOFOLLOW_SYMLINKS, null);

    while (true) {
        const info = iter.next_file(null);
    
        if (info == null) {
            break;
        }
            
        if(info.get_name().includes("BAT")) {
            return true;
        }
    }
    return false;
}

function _execSwitch(profile, c1, c2) {
    // exec switch
    Util.spawn(['/bin/bash', '-c', COMMAND_TO_SWITCH_GPU_PROFILE
        .replace("{profile}", profile)
        .replace("{choice1}", c1)
        .replace("{choice2}", c2)
    ]);
}

const TopBarView = GObject.registerClass(
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
            _execSwitch(GPU_PROFILE_INTEGRATED, "", "");
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
            _execSwitch(GPU_PROFILE_HYBRID, this._setting_rtd3, "");
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
            _execSwitch(GPU_PROFILE_NVIDIA, this._setting_force_composition_pipeline, this._setting_coolbits);
        });

        // add all menu item to power menu
        this.separator_menu_item = new PopupMenu.PopupSeparatorMenuItem();
        this.menu.addMenuItem(this.separator_menu_item);
        this.menu.addMenuItem(this.integrated_menu_item);
        this.menu.addMenuItem(this.hybrid_menu_item);
        this.menu.addMenuItem(this.nvidia_menu_item);

        // check GPU profile

        const gpu_profile = _getCurrentProfile();
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

class AttachedToBatteryView {
    _init(setting_rtd3, setting_force_composition_pipeline, setting_coolbits) {
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
            _execSwitch(GPU_PROFILE_INTEGRATED, "", "");
        });

        // init hybrid GPU profile menu item and its click listener
        this.hybrid_menu_item = new PopupMenu.PopupMenuItem('Hybrid');
        this.hybrid_menu_item_id = this.hybrid_menu_item.connect('activate', () => {
            this.integrated_menu_item.remove_child(this.icon_selector);
            this.nvidia_menu_item.remove_child(this.icon_selector);
            this.hybrid_menu_item.add_child(this.icon_selector);
            // exec switch
            _execSwitch(GPU_PROFILE_HYBRID, this._setting_rtd3, "");
        });

        // init nvidia GPU profile menu item and its click listener
        this.nvidia_menu_item = new PopupMenu.PopupMenuItem('Nvidia');
        this.nvidia_menu_item_id = this.nvidia_menu_item.connect('activate', () => {
            this.integrated_menu_item.remove_child(this.icon_selector);
            this.hybrid_menu_item.remove_child(this.icon_selector);
            this.nvidia_menu_item.add_child(this.icon_selector);
            // exec switch
            _execSwitch(GPU_PROFILE_NVIDIA, this._setting_force_composition_pipeline, this._setting_coolbits);
        });

        // set icon_selector on current status profile
        let current_profile = _getCurrentProfile();
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

class Extension {
    enable() {
        settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.GPU_profile_selector');
        setting_rtd3 = settings.get_boolean('rtd3') ? "y" : "n";
		setting_force_composition_pipeline = settings.get_boolean('force-composition-pipeline') ? "y" : "n";
		setting_coolbits = settings.get_boolean('coolbits') ? "y" : "n";

        // if there is no battery, there is no power management panel, so the extension moves to TopBar
        if (isBatteryPlugged()) {
            this.extensionView = new AttachedToBatteryView(setting_rtd3, setting_force_composition_pipeline, setting_coolbits);
        } else {
            this.extensionView = new TopBarView(setting_rtd3, setting_force_composition_pipeline, setting_coolbits);
            Main.panel.addToStatusArea("GPU_SELECTOR", this.extensionView, 1);
        }
        this.extensionView.enable();
    }

    disable() {
        this.extensionView.disable();
        // also topbar popup must be destroyed
        if (!isBatteryPlugged()) {
            this.extensionView.destroy();
        }
        this.extensionView = null;
    }
}

function init() {
    return new Extension();
}
