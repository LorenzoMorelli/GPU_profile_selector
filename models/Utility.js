const Gio = imports.gi.Gio;
const Util = imports.misc.util;

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


function getCurrentProfile() {
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

function execSwitch(profile, c1, c2) {
    // exec switch
    Util.spawn(['/bin/bash', '-c', COMMAND_TO_SWITCH_GPU_PROFILE
        .replace("{profile}", profile)
        .replace("{choice1}", c1)
        .replace("{choice2}", c2)
    ]);
}
