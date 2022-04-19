# My Tutorial for gnome extension

## Debuging

### For looking command line logs
```journalctl -f -o cat /usr/bin/gnome-shell```

### For looking updates using wayland (open a new wayland session in a window)
```dbus-run-session -- gnome-shell --nested --wayland```

In this case you can see logs directly in this terminal

## TODO
- Add a confirm dialog with restart later and restart now
- After profile is changed add a text at the end (reboot needed)
