import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import * as Util from 'resource:///org/gnome/shell/misc/util.js';

const BLACKLIST_PATH = '/etc/modprobe.d/blacklist-nvidia.conf';
const UDEV_INTEGRATED_PATH = '/lib/udev/rules.d/50-remove-nvidia.rules';
const XORG_PATH = '/etc/X11/xorg.conf';
const MODESET_PATH = '/etc/modprobe.d/nvidia.conf';


const EXTENSION_ICON_FILE_NAME = '/img/icon.png';

const GPU_PROFILE_INTEGRATED = "integrated";
const GPU_PROFILE_HYBRID = "hybrid";
const GPU_PROFILE_NVIDIA = "nvidia";
const GPU_PROFILE_UNKNOWN = "unknown";

// in future version, this will be adjustible from the extension settings menu. 
// set RTD3 mode when enabled (value: 1-3)
let RTD3_mode = 2;

export function getCurrentProfile() {
    try {
        const [success, stdout, stderr, exitCode] = GLib.spawn_command_line_sync("envycontrol --query");

        if (success && exitCode === 0) {
            const textDecoder = new TextDecoder();
            const profileString = textDecoder.decode(stdout).trim().toLowerCase();

            if (profileString === GPU_PROFILE_INTEGRATED ||
                profileString === GPU_PROFILE_HYBRID ||
                profileString === GPU_PROFILE_NVIDIA) {
                return profileString;
            }
        }

        // If the command failed or returned an unexpected profile
        return GPU_PROFILE_UNKNOWN;
    } catch (e) {
        // If there was an error running the command
        return GPU_PROFILE_UNKNOWN;
    }
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

export function _execSwitch(profile, args, onComplete) {
    let proc = Gio.Subprocess.new(
        ['pkexec', 'envycontrol', '-s', profile, ...args],
        Gio.SubprocessFlags.NONE
    );

    proc.wait_async(null, () => {
        if (typeof onComplete === 'function') {
            onComplete();
        }
    });
}

// NOT USED
export function _isSettingActive(all_settings, setting_name) {
    return all_settings.get_boolean(setting_name) ? "y" : "n";
}

export function switchIntegrated(onComplete = null) {
    _execSwitch(GPU_PROFILE_INTEGRATED, [], onComplete);
}

export function switchHybrid(all_settings, onComplete = null) {
    const args = ['--rtd3', all_settings.get_boolean("rtd3") ? String(RTD3_mode) : '0'];
    _execSwitch(GPU_PROFILE_HYBRID, args, onComplete);
}

export function switchNvidia(all_settings, onComplete = null) {
    const args = [];
    if (all_settings.get_boolean("force-composition-pipeline")) args.push('--force-comp');
    if (all_settings.get_boolean("coolbits")) args.push('--coolbits');
    _execSwitch(GPU_PROFILE_NVIDIA, args, onComplete);
}

export function requestReboot() {
    Util.spawn(['gnome-session-quit', '--reboot']);
}