import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import * as Util from 'resource:///org/gnome/shell/misc/util.js';

export const EXTENSION_ICON_FILE_NAME = '/img/icon.png';

export const GPU_PROFILE_INTEGRATED = "integrated";
export const GPU_PROFILE_HYBRID = "hybrid";
export const GPU_PROFILE_NVIDIA = "nvidia";
export const GPU_PROFILE_UNKNOWN = "unknown";

// TODO: make adjustable from the extension settings menu
const RTD3_MODE = 2;

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

export function switchIntegrated(onComplete = null) {
    _execSwitch(GPU_PROFILE_INTEGRATED, [], onComplete);
}

export function switchHybrid(all_settings, onComplete = null) {
    const args = [];
    if (all_settings.get_boolean("rtd3")) {
        args.push('--rtd3', String(RTD3_MODE));
    }
    _execSwitch(GPU_PROFILE_HYBRID, args, onComplete);
}

export function switchNvidia(all_settings, onComplete = null) {
    const args = [];
    if (all_settings.get_boolean("force-composition-pipeline")) {
        args.push('--force-comp');
    }
    if (all_settings.get_boolean("coolbits")) {
        args.push('--coolbits');
    }
    _execSwitch(GPU_PROFILE_NVIDIA, args, onComplete);
}

export function requestReboot() {
    Util.spawn(['gnome-session-quit', '--reboot']);
}

function _execSwitch(profile, args, onComplete) {
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
