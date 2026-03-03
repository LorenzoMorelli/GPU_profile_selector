import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import * as Util from 'resource:///org/gnome/shell/misc/util.js';

export const EXTENSION_ICON_FILE_NAME = '/img/icon.png';

export type GpuProfile = 'integrated' | 'hybrid' | 'nvidia' | 'unknown';

export const GPU_PROFILE_INTEGRATED: GpuProfile = "integrated";
export const GPU_PROFILE_HYBRID: GpuProfile = "hybrid";
export const GPU_PROFILE_NVIDIA: GpuProfile = "nvidia";
export const GPU_PROFILE_UNKNOWN: GpuProfile = "unknown";

// TODO: make adjustable from the extension settings menu
const RTD3_MODE = 2;

export function getCurrentProfile(): GpuProfile {
    try {
        const [success, stdout, stderr, exitCode] = GLib.spawn_command_line_sync("envycontrol --query");

        if (success && exitCode === 0) {
            const textDecoder = new TextDecoder();
            const profileString = textDecoder.decode(stdout!).trim().toLowerCase();

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

export function capitalizeFirstLetter(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

export function switchIntegrated(onComplete: (() => void) | null = null): void {
    execSwitch(GPU_PROFILE_INTEGRATED, [], onComplete);
}

export function switchHybrid(allSettings: Gio.Settings, onComplete: (() => void) | null = null): void {
    const args: string[] = [];
    if (allSettings.get_boolean("rtd3")) {
        args.push('--rtd3', String(RTD3_MODE));
    }
    execSwitch(GPU_PROFILE_HYBRID, args, onComplete);
}

export function switchNvidia(allSettings: Gio.Settings, onComplete: (() => void) | null = null): void {
    const args: string[] = [];
    if (allSettings.get_boolean("force-composition-pipeline")) {
        args.push('--force-comp');
    }
    if (allSettings.get_boolean("coolbits")) {
        args.push('--coolbits');
    }
    execSwitch(GPU_PROFILE_NVIDIA, args, onComplete);
}

export function requestReboot(): void {
    (Util as any).spawn(['gnome-session-quit', '--reboot']);
}

function execSwitch(profile: GpuProfile, args: string[], onComplete: (() => void) | null): void {
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
