const Main = imports.ui.main;
const {St, GLib} = imports.gi;
const GObject = imports.gi.GObject;
const Gio = imports.gi.Gio;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const Util = imports.misc.util;
const Clutter = imports.gi.Clutter;

const BLACKLIST_PATH = '/etc/modprobe.d/blacklist-nvidia.conf';
const UDEV_INTEGRATED_PATH = '/lib/udev/rules.d/50-remove-nvidia.rules';
const XORG_PATH = '/etc/X11/xorg.conf';
const MODESET_PATH = '/etc/modprobe.d/nvidia.conf';
const ICON_SIZE = 3;
const ICON_SELECTOR_FILE_NAME = '/icon.svg';

const GPU_PROFILE_INTEGRATED = "integrated"
const GPU_PROFILE_HYBRID = "hybrid"
const GPU_PROFILE_NVIDIA = "nvidia"
const COMMAND_TO_SWITCH_GPU_PROFILE = "yes | pkexec envycontrol -s {profile}; gnome-session-quit --reboot";

function _getCurrentProfile() {
    // init files needed
    let black_list_file = Gio.File.new_for_path(BLACKLIST_PATH);
    let udev_integrated_file = Gio.File.new_for_path(UDEV_INTEGRATED_PATH);
    let xorg_file = Gio.File.new_for_path(XORG_PATH);
    let modeset_file = Gio.File.new_for_path(MODESET_PATH);

    // check in which mode you are
    if (black_list_file.query_exists(null) && udev_integrated_file.query_exists(null)) {
        return GPU_PROFILE_INTEGRATED;
    } else if (xorg_file.query_exists(null) && modeset_file.query_exists(null)) {
        return GPU_PROFILE_NVIDIA;
    } else {
        return GPU_PROFILE_HYBRID;
    }
}

const TopBarView = GObject.registerClass(
class TopBarView extends PanelMenu.Button {
    _init() {
        super._init(0);
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
            this.remove_child(this.profile_label);
            this.profile_label = new St.Label({ text : 'Integrated', y_align: Clutter.ActorAlign.CENTER})
            this.add_child(this.profile_label);
            // exec switch
            Util.spawn(['/bin/bash', '-c', COMMAND_TO_SWITCH_GPU_PROFILE.replace("{profile}", GPU_PROFILE_INTEGRATED)]);
        });

        // init hybrid GPU profile menu item and its click listener
        this.hybrid_menu_item = new PopupMenu.PopupMenuItem('Hybrid');
        this.hybrid_menu_item_id = this.hybrid_menu_item.connect('activate', () => {
            // view stuff
            this.integrated_menu_item.remove_child(this.icon_selector);
            this.nvidia_menu_item.remove_child(this.icon_selector);
            this.hybrid_menu_item.add_child(this.icon_selector);
            this.remove_child(this.profile_label);
            this.profile_label = new St.Label({ text : 'Hybrid', y_align: Clutter.ActorAlign.CENTER})
            this.add_child(this.profile_label);
            // exec switch
            Util.spawn(['/bin/bash', '-c', COMMAND_TO_SWITCH_GPU_PROFILE.replace("{profile}", GPU_PROFILE_HYBRID)]);
        });

        // init nvidia GPU profile menu item and its click listener
        this.nvidia_menu_item = new PopupMenu.PopupMenuItem('Nvidia');
        this.nvidia_menu_item_id = this.nvidia_menu_item.connect('activate', () => {
            // view stuff
            this.integrated_menu_item.remove_child(this.icon_selector);
            this.hybrid_menu_item.remove_child(this.icon_selector);
            this.nvidia_menu_item.add_child(this.icon_selector);
            this.remove_child(this.profile_label);
            this.profile_label = new St.Label({ text : 'NVIDIA', y_align: Clutter.ActorAlign.CENTER})
            this.add_child(this.profile_label);
            // exec switch
            Util.spawn(['/bin/bash', '-c', COMMAND_TO_SWITCH_GPU_PROFILE.replace("{profile}", GPU_PROFILE_NVIDIA)]);
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
            this.profile_label = new St.Label({ text : 'Integrated', y_align: Clutter.ActorAlign.CENTER})
            this.hybrid_menu_item.remove_child(this.icon_selector);
            this.nvidia_menu_item.remove_child(this.icon_selector);
            this.integrated_menu_item.add_child(this.icon_selector);
        } else if(gpu_profile === GPU_PROFILE_HYBRID) {
            this.profile_label = new St.Label({ text : 'Hybrid', y_align: Clutter.ActorAlign.CENTER})
            this.integrated_menu_item.remove_child(this.icon_selector);
            this.nvidia_menu_item.remove_child(this.icon_selector);
            this.hybrid_menu_item.add_child(this.icon_selector);
        } else {
            this.profile_label = new St.Label({ text : 'NVIDIA', y_align: Clutter.ActorAlign.CENTER})
            this.integrated_menu_item.remove_child(this.icon_selector);
            this.hybrid_menu_item.remove_child(this.icon_selector);
            this.nvidia_menu_item.add_child(this.icon_selector);
        }
        this.add_child(this.profile_label);
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
            Util.spawn(['/bin/bash', '-c', COMMAND_TO_SWITCH_GPU_PROFILE.replace("{profile}", GPU_PROFILE_INTEGRATED)]);
        });

        // init hybrid GPU profile menu item and its click listener
        this.hybrid_menu_item = new PopupMenu.PopupMenuItem('Hybrid');
        this.hybrid_menu_item_id = this.hybrid_menu_item.connect('activate', () => {
            this.integrated_menu_item.remove_child(this.icon_selector);
            this.nvidia_menu_item.remove_child(this.icon_selector);
            this.hybrid_menu_item.add_child(this.icon_selector);
            // exec switch
            Util.spawn(['/bin/bash', '-c', COMMAND_TO_SWITCH_GPU_PROFILE.replace("{profile}", GPU_PROFILE_HYBRID)]);
        });

        // init nvidia GPU profile menu item and its click listener
        this.nvidia_menu_item = new PopupMenu.PopupMenuItem('Nvidia');
        this.nvidia_menu_item_id = this.nvidia_menu_item.connect('activate', () => {
            this.integrated_menu_item.remove_child(this.icon_selector);
            this.hybrid_menu_item.remove_child(this.icon_selector);
            this.nvidia_menu_item.add_child(this.icon_selector);
            // exec switch
            Util.spawn(['/bin/bash', '-c', COMMAND_TO_SWITCH_GPU_PROFILE.replace("{profile}", GPU_PROFILE_NVIDIA)]);
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
        this.power_menu = Main.panel.statusArea['aggregateMenu']._power;
        if (this.power_menu === null) {
            this.extensionView = new TopBarView();
            Main.panel.addToStatusArea("GPU_SELECTOR", this.extensionView, 1);
        } else {
            this.extensionView = new AttachedToBatteryView();
        }
        this.extensionView.enable();
    }

    disable() {
        this.extensionView.disable();
        // topbar popup must be also destroyed
        this.power_menu = Main.panel.statusArea['aggregateMenu']._power;
        if (this.power_menu === null) {
            this.extensionView.destroy();
        }
        this.extensionView = null;
    }
}

function init() {
    return new Extension();
}
