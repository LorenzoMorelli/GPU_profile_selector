import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import * as Util from 'resource:///org/gnome/shell/misc/util.js';

const BLACKLIST_PATH = '/etc/modprobe.d/blacklist-nvidia.conf';
const UDEV_INTEGRATED_PATH = '/lib/udev/rules.d/50-remove-nvidia.rules';
const XORG_PATH = '/etc/X11/xorg.conf';
const MODESET_PATH = '/etc/modprobe.d/nvidia.conf';

const COMMAND_TO_SWITCH_GPU_PROFILE = "printf '%s\n' {choice1} {choice2} | pkexec envycontrol -s {profile}; gnome-session-quit --reboot";

const EXTENSION_ICON_FILE_NAME = '/img/icon.png';

const GPU_PROFILE_INTEGRATED = "integrated"
const GPU_PROFILE_HYBRID = "hybrid"
const GPU_PROFILE_NVIDIA = "nvidia"


export function getCurrentProfile() {
    let profile = GLib.spawn_command_line_sync("envycontrol --query")[1].toString().trim();
    return profile;
}

export function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// DEPRECATED: not usefull anymore
export function isBatteryPlugged() {
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

export function _execSwitch(profile, c1, c2) {
    // exec switch
    Util.spawn(['/bin/sh', '-c', COMMAND_TO_SWITCH_GPU_PROFILE
        .replace("{profile}", profile)
        .replace("{choice1}", c1)
        .replace("{choice2}", c2)
    ]);
}

export function _isSettingActive(all_settings, setting_name) {
    return all_settings.get_boolean(setting_name) ? "y" : "n";
}

export function switchIntegrated() {
    _execSwitch(GPU_PROFILE_INTEGRATED, "", "")
}

export function switchHybrid(all_settings) {
    _execSwitch(GPU_PROFILE_HYBRID, _isSettingActive(all_settings, "rtd3"), "")
}

export function switchNvidia(all_settings) {
    _execSwitch(GPU_PROFILE_NVIDIA, _isSettingActive(all_settings, "force-composition-pipeline"), _isSettingActive(all_settings, "coolbits"));
}
