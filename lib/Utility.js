const Gio = imports.gi.Gio;
const Util = imports.misc.util;

const BLACKLIST_PATH = '/etc/modprobe.d/blacklist-nvidia.conf';
const UDEV_INTEGRATED_PATH = '/lib/udev/rules.d/50-remove-nvidia.rules';
const XORG_PATH = '/etc/X11/xorg.conf';
const MODESET_PATH = '/etc/modprobe.d/nvidia.conf';

const COMMAND_TO_SWITCH_GPU_PROFILE = "printf '%s\n' {choice1} {choice2} | pkexec envycontrol -s {profile}; gnome-session-quit --reboot";

var EXTENSION_ICON_FILE_NAME = '/img/icon.png';

var GPU_PROFILE_INTEGRATED = "integrated"
var GPU_PROFILE_HYBRID = "hybrid"
var GPU_PROFILE_NVIDIA = "nvidia"


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

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
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

function _isSettingActive(all_settings, setting_name) {
    return all_settings.get_boolean(setting_name) ? "y" : "n";
}

function switchIntegrated() {
    _execSwitch(GPU_PROFILE_INTEGRATED, "", "")
}

function switchHybrid(all_settings) {
    _execSwitch(GPU_PROFILE_HYBRID, _isSettingActive(all_settings, "rtd3"), "")
}

function switchNvidia(all_settings) {
    _execSwitch(GPU_PROFILE_NVIDIA, _isSettingActive(all_settings, "force-composition-pipeline"), _isSettingActive(all_settings, "coolbits"));
}
