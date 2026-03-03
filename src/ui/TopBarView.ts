import St from 'gi://St';
import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

import * as Utility from '../lib/Utility.js';


const ICON_SIZE = 6;
const ICON_INTEL_FILE_NAME = '/img/intel_icon_plain.svg';
const ICON_NVIDIA_FILE_NAME = '/img/nvidia_icon_plain.svg';
const ICON_HYBRID_FILE_NAME = '/img/hybrid_icon_plain.svg';


export const TopBarView = GObject.registerClass(
class TopBarView extends PanelMenu.Button {
    private allSettings!: Gio.Settings;
    private extensionPath!: string;
    private iconSelector!: St.Icon | null;
    private integratedMenuItem!: PopupMenu.PopupMenuItem | null;
    private integratedMenuItemId!: number;
    private hybridMenuItem!: PopupMenu.PopupMenuItem | null;
    private hybridMenuItemId!: number;
    private nvidiaMenuItem!: PopupMenu.PopupMenuItem | null;
    private nvidiaMenuItemId!: number;
    private separatorMenuItem!: PopupMenu.PopupSeparatorMenuItem | null;
    private iconTop!: St.Icon | null;

    // @ts-expect-error GObject _init signature differs from parent
    _init(extensionObject: Extension): void {
        super._init(0 as any);
        this.allSettings = extensionObject.getSettings();
        this.extensionPath = extensionObject.path;
    }

    public enable(): void {
        this.iconSelector = new St.Icon({
            gicon : Gio.icon_new_for_string(this.extensionPath + Utility.EXTENSION_ICON_FILE_NAME),
            style_class : 'system-status-icon',
            icon_size: ICON_SIZE
        });

        this.integratedMenuItem = new PopupMenu.PopupMenuItem('Integrated');
        this.integratedMenuItemId = this.integratedMenuItem.connect('activate', () => {
            Utility.switchIntegrated(() => this.updateTopBarIcon());
        });

        this.hybridMenuItem = new PopupMenu.PopupMenuItem('Hybrid');
        this.hybridMenuItemId = this.hybridMenuItem.connect('activate', () => {
            Utility.switchHybrid(this.allSettings, () => this.updateTopBarIcon());
        });

        this.nvidiaMenuItem = new PopupMenu.PopupMenuItem('Nvidia');
        this.nvidiaMenuItemId = this.nvidiaMenuItem.connect('activate', () => {
            Utility.switchNvidia(this.allSettings, () => this.updateTopBarIcon());
        });

        this.separatorMenuItem = new PopupMenu.PopupSeparatorMenuItem();
        (this.menu as PopupMenu.PopupMenu).addMenuItem(this.separatorMenuItem);
        (this.menu as PopupMenu.PopupMenu).addMenuItem(this.integratedMenuItem);
        (this.menu as PopupMenu.PopupMenu).addMenuItem(this.hybridMenuItem);
        (this.menu as PopupMenu.PopupMenu).addMenuItem(this.nvidiaMenuItem);

        this.updateTopBarIcon();
    }

    private updateTopBarIcon(): void {
        const profile = Utility.getCurrentProfile();
        const profileConfig: Record<string, { icon: string; menuItem: PopupMenu.PopupMenuItem }> = {
            [Utility.GPU_PROFILE_INTEGRATED]: { icon: ICON_INTEL_FILE_NAME, menuItem: this.integratedMenuItem! },
            [Utility.GPU_PROFILE_HYBRID]: { icon: ICON_HYBRID_FILE_NAME, menuItem: this.hybridMenuItem! },
            [Utility.GPU_PROFILE_NVIDIA]: { icon: ICON_NVIDIA_FILE_NAME, menuItem: this.nvidiaMenuItem! },
        };
        const config = profileConfig[profile];

        // Move selector icon to the active menu item
        const currentParent = this.iconSelector!.get_parent();
        if (currentParent)
            currentParent.remove_child(this.iconSelector!);
        if (config)
            config.menuItem.add_child(this.iconSelector!);

        // Update top bar icon
        if (this.iconTop)
            this.remove_child(this.iconTop);
        this.iconTop = new St.Icon({
            gicon: Gio.icon_new_for_string(this.extensionPath + (config ? config.icon : Utility.EXTENSION_ICON_FILE_NAME)),
            style_class: 'system-status-icon',
        });
        this.add_child(this.iconTop);
    }

    public disable(): void {
        if (this.integratedMenuItemId) {
            this.integratedMenuItem!.disconnect(this.integratedMenuItemId);
            this.integratedMenuItemId = 0;
        }
        this.integratedMenuItem!.destroy();
        this.integratedMenuItem = null;

        if (this.hybridMenuItemId) {
            this.hybridMenuItem!.disconnect(this.hybridMenuItemId);
            this.hybridMenuItemId = 0;
        }
        this.hybridMenuItem!.destroy();
        this.hybridMenuItem = null;

        if (this.nvidiaMenuItemId) {
            this.nvidiaMenuItem!.disconnect(this.nvidiaMenuItemId);
            this.nvidiaMenuItemId = 0;
        }
        this.nvidiaMenuItem!.destroy();
        this.nvidiaMenuItem = null;

        this.separatorMenuItem!.destroy();
        this.separatorMenuItem = null;

        this.iconSelector = null;
    }
});
