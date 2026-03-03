UUID = GPU_profile_selector@lorenzo9904.gmail.com
INSTALL_DIR = $(HOME)/.local/share/gnome-shell/extensions/$(UUID)

.PHONY: build clean install package

build:
	npm run build
	cp metadata.json dist/
	cp -r schemas dist/
	cp -r img dist/

clean:
	rm -rf dist *.zip

install: build
	mkdir -p $(INSTALL_DIR)
	cp -r dist/* $(INSTALL_DIR)/

package: build
	cd dist && zip -r ../$(UUID).zip .
