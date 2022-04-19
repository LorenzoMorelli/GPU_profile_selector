const Main = imports.ui.main;
//const St = imports.gi.St;
const {St, GLib} = imports.gi;
const GObject = imports.gi.GObject;
const Gio = imports.gi.Gio;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Me = imports.misc.extensionUtils.getCurrentExtension();

const BLACKLIST_PATH = '/etc/modprobe.d/blacklist-nvidia.conf';
const UDEV_INTEGRATED_PATH = '/lib/udev/rules.d/50-remove-nvidia.rules';
const XORG_PATH = '/etc/X11/xorg.conf';
const MODESET_PATH = '/etc/modprobe.d/nvidia.conf';
const ICON_SIZE = 3;

let myPopup, panelLabel;

class Extension {
    constructor() {
        this.icon_selector = new St.Icon({
            //icon_name : 'security-low-symbolic',
            gicon : Gio.icon_new_for_string( Me.dir.get_path() + '/icon.svg' ),
            style_class : 'system-status-icon',
            icon_size: ICON_SIZE
        });
    }

    _getCurrentProfile() {
        // check in which mode you are
        let [ok_BLACKLIST_PATH, out_BLACKLIST_PATH, err_BLACKLIST_PATH, exit_BLACKLIST_PATH] = GLib.spawn_command_line_sync("ls " + BLACKLIST_PATH);
        let [ok_UDEV_INTEGRATED_PATH, out_UDEV_INTEGRATED_PATH, err_UDEV_INTEGRATED_PATH, exit_UDEV_INTEGRATED_PATH] = GLib.spawn_command_line_sync("ls " + UDEV_INTEGRATED_PATH);
        let [ok_XORG_PATH, out_XORG_PATH, err_XORG_PATH, exit_XORG_PATH] = GLib.spawn_command_line_sync("ls " + XORG_PATH);
        let [ok_MODESET_PATH, out_MODESET_PATH, err_MODESET_PATH, exit_MODESET_PATH] = GLib.spawn_command_line_sync("ls " + MODESET_PATH);
        
        if (out_BLACKLIST_PATH.toString().length > 0 && out_UDEV_INTEGRATED_PATH.toString().length > 0) {
            return "integrated";
        } else if (out_XORG_PATH.toString().length > 0 && out_MODESET_PATH.toString().length > 0) {
            return "nvidia";
        } else {
            return "hybrid";
        }
    }

    _change_profile_with_priveleged_exec(profile) {
        let args = ["envycontrol", "-s " + profile]
        try {
            let proc = Gio.Subprocess.new(
                ['pkexec'].concat(args),
                Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
            );
    
            proc.communicate_utf8_async(null, null, (proc, res) => {
                try {
                    let [, stdout, stderr] = proc.communicate_utf8_finish(res);
    
                    // Failure
                    if (!proc.get_successful())
                        throw new Error(stderr);
    
                    // Success
                    log(stdout);
                } catch (e) {
                    logError(e);
                }
            });
        } catch (e) {
            logError(e);
        }
    }   

    enable() {
        // get power menu section
        this.power_menu = Main.panel.statusArea['aggregateMenu']._power._item.menu;

        // init integrated GPU profile menu item and its click listener
        this._integrated_menu_item = new PopupMenu.PopupMenuItem('Integrated');
        this._integrated_menu_item_id = this._integrated_menu_item.connect('activate', () => {
            this._hybrid_menu_item.remove_child(this.icon_selector);
            this._nvidia_menu_item.remove_child(this.icon_selector);
            this._integrated_menu_item.add_child(this.icon_selector);
            //let [ok, out, err, exit] = GLib.spawn_command_line_sync('pkexec envycontrol -s integrated');
            this._change_profile_with_priveleged_exec("integrated");
        });

        // init hybrid GPU profile menu item and its click listener
        this._hybrid_menu_item = new PopupMenu.PopupMenuItem('Hybrid');
        this._hybrid_menu_item_id = this._hybrid_menu_item.connect('activate', () => {
            this._integrated_menu_item.remove_child(this.icon_selector);
            this._nvidia_menu_item.remove_child(this.icon_selector);
            this._hybrid_menu_item.add_child(this.icon_selector);
            //let [ok, out, err, exit] = GLib.spawn_command_line_sync('pkexec envycontrol -s hybrid');
            this._change_profile_with_priveleged_exec("hybrid");
        });

        // init nvidia GPU profile menu item and its click listener
        this._nvidia_menu_item = new PopupMenu.PopupMenuItem('Nvidia');
        this._nvidia_menu_item_id = this._nvidia_menu_item.connect('activate', () => {
            this._integrated_menu_item.remove_child(this.icon_selector);
            this._hybrid_menu_item.remove_child(this.icon_selector);
            this._nvidia_menu_item.add_child(this.icon_selector);
            //let [ok, out, err, exit] = GLib.spawn_command_line_sync('pkexec envycontrol -s nvidia');
            this._change_profile_with_priveleged_exec("nvidia");
        });

        // set icon_selector on current status profile
        let current_profile = this._getCurrentProfile();
        if(current_profile === "integrated") {
            this._hybrid_menu_item.remove_child(this.icon_selector);
            this._nvidia_menu_item.remove_child(this.icon_selector);
            this._integrated_menu_item.add_child(this.icon_selector);
        } else if(current_profile === "nvidia") {
            this._integrated_menu_item.remove_child(this.icon_selector);
            this._hybrid_menu_item.remove_child(this.icon_selector);
            this._nvidia_menu_item.add_child(this.icon_selector);
        } else {
            this._integrated_menu_item.remove_child(this.icon_selector);
            this._nvidia_menu_item.remove_child(this.icon_selector);
            this._hybrid_menu_item.add_child(this.icon_selector);
        }

        // add all menu item to power menu
        this.separator_menu = new PopupMenu.PopupSeparatorMenuItem();
        this.power_menu.addMenuItem(this.separator_menu);
        this.power_menu.addMenuItem(this._integrated_menu_item);
        this.power_menu.addMenuItem(this._hybrid_menu_item);
        this.power_menu.addMenuItem(this._nvidia_menu_item);
    }

    disable() {
        if (this._integrated_menu_item_id) {
            this._integrated_menu_item.disconnect(this._integrated_menu_item_id);
            this._integrated_menu_item_id = 0;
        }
        this._integrated_menu_item.destroy();

        if (this._hybrid_menu_item_id) {
            this._hybrid_menu_item.disconnect(this._hybrid_menu_item_id);
            this._hybrid_menu_item_id = 0;
        }
        this._hybrid_menu_item.destroy();

        if (this._nvidia_menu_item_id) {
            this._nvidia_menu_item.disconnect(this._nvidia_menu_item_id);
            this._nvidia_menu_item_id = 0;
        }
        this._nvidia_menu_item.destroy();

        this.separator_menu.destroy();
    }
}

let extension;

function init() {
    extension = new Extension();
}

function enable() {
    extension.enable();
}

function disable() {
    extension.disable();
}

