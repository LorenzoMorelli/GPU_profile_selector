import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';

function buildPrefsWidget () {
    const settings = this.getSettings();
    const buildable = new Gtk.Builder();
    buildable.add_from_file( Me.dir.get_path() + '/prefs.xml' );

    const box = buildable.get_object('prefs_widget');
    settings.bind('rtd3' , buildable.get_object('field_rtd3') , 'active' , Gio.SettingsBindFlags.DEFAULT);
    settings.bind('force-composition-pipeline' , buildable.get_object('field_force_composition_pipeline') , 'active' , Gio.SettingsBindFlags.DEFAULT);
    settings.bind('coolbits' , buildable.get_object('field_coolbits') , 'active' , Gio.SettingsBindFlags.DEFAULT);
    settings.bind('force-topbar-view' , buildable.get_object('field_force_topbar_view') , 'active' , Gio.SettingsBindFlags.DEFAULT);
    return box;
};
