import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';

import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';


function buildPrefsWidget () {
    this._extensionPreferences = extensionPreferences;
    this.settings = extensionPreferences.getSettings('org.gnome.shell.extensions.GPU_profile_selector');
    this.buildable = new Gtk.Builder();
    this._builder.set_translation_domain(extensionPreferences.metadata['gettext-domain']);
    this._builder.add_from_file(`${extensionPreferences.path}/prefs.xml`);


    const box = buildable.get_object('prefs_widget');
    this._bindSettings('rtd3' , buildable.get_object('field_rtd3') , 'active' , Gio.SettingsBindFlags.DEFAULT);
    this._bindSettings('force-composition-pipeline' , buildable.get_object('field_force_composition_pipeline') , 'active' , Gio.SettingsBindFlags.DEFAULT);
    this._bindSettings('coolbits' , buildable.get_object('field_coolbits') , 'active' , Gio.SettingsBindFlags.DEFAULT);
    this._bindSettings('force-topbar-view' , buildable.get_object('field_force_topbar_view') , 'active' , Gio.SettingsBindFlags.DEFAULT);
    return box;
};
