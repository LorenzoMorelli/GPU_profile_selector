import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';

import {
    ExtensionPreferences,
    gettext as _
} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';


const GpuSelector = GObject.registerClass(
  {
    Implements: [Gtk.BuilderScope],
  },
  class GpuSelectorSettings extends GObject.Object {
    _init(extensionPreferences) {
      super._init();

      this._extensionPreferences = extensionPreferences;
      this._settings = extensionPreferences.getSettings('org.gnome.shell.extensions.GPU_profile_selector');

      this._builder = new Gtk.Builder();
      this._builder.set_scope(this);
      this._builder.set_translation_domain(extensionPreferences.metadata['gettext-domain']);
      this._builder.add_from_file(`${extensionPreferences.path}/prefs.xml`);

      const box = this._builder.get_object('prefs_widget');
      this._bindSettings('rtd3', this._builder.get_object('field_rtd3'), 'active', Gio.SettingsBindFlags.DEFAULT);
      this._bindSettings('force-composition-pipeline', this._builder.get_object('field_force_composition_pipeline'), 'active', Gio.SettingsBindFlags.DEFAULT);
      this._bindSettings('coolbits', this._builder.get_object('field_coolbits'), 'active', Gio.SettingsBindFlags.DEFAULT);
      this._bindSettings('force-topbar-view', this._builder.get_object('field_force_topbar_view'), 'active', Gio.SettingsBindFlags.DEFAULT);
      return box;
    }
  }
);

