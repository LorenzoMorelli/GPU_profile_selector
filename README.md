# GPU profile selector Gnome-Shell-Extension

## Description
A simple gnome shell extension which provides a simple way to switch between GPU profiles on Nvidia Optimus systems (i.e laptops with Intel + Nvidia or AMD + Nvidia configurations) in a few clicks.
In particular this extension is a graphic interface for [envycontrol](https://github.com/geminis3/envycontrol) program.

![screenshot example](./extension_screenshot.png)


## Dependencies
- [bash](https://www.gnu.org/software/bash/)
- [pkexec command](https://command-not-found.com/pkexec)
- [envycontrol](https://github.com/geminis3/envycontrol) (make sure to have EnvyControl installed globally!)


## Installation

### Gnome-shell Extension website
- Install all the [dependencies](#Dependencies)
- Enable extension in official [Gnome Extension](https://extensions.gnome.org/extension/5009/gpu-profile-selector/) store

### Manual
- Install all the [dependencies](#Dependencies)
- Clone this repo with:
```
git clone https://github.com/LorenzoMorelli/GPU_profile_selector.git ~/.local/share/gnome-shell/extensions/GPU_profile_selector@lorenzo9904.gmail.com
```


## Debuging and packaging

### For looking command line logs
```
journalctl -f -o cat /usr/bin/gnome-shell
```

### For looking updates using wayland (open a new wayland session in a window)
```
dbus-run-session -- gnome-shell --nested --wayland
```

### For packaging the extension source
```
gnome-extensions pack GPU_profile_selector@lorenzo9904.gmail.com \
--extra-source="LICENSE" --extra-source="icon.png" \
--extra-source="intel_icon_plain.svg" --extra-source="hybrid_icon_plain.svg" \
--extra-source="nvidia_icon_plain.svg" --extra-source="README.md"
```

## TODO
- Add a notify for the case that the user didn't choose to reboot.
- After profile is changed add a text at the end (reboot needed).
- Add option panel for customizing EnvyControl settings.
