# ServiceHub

A dead simple homepage for your self-hosted services.

## What does it do?

It provides a simple web server with links to your services, configured with a simple JSON file.
Nothing more, nothing less.

## How to use it?

1. Clone the repository
2. Run `docker build -t servicehub .`
3. Run this compose:
```yaml
services:
  cfphome:
    container_name: cfphome
    image: cfphome
    restart: unless-stopped
    ports:
			- 3000:3000
    volumes:
      - ./config:/app/config
```

It will automatically create a `config.json` and `services.json` file in the `config` folder.
The config files will automatically be reread each request, so you can change them on the fly.
(This does not apply to the icon cache, restart the container after deleting the icon cache)

### config.json

```json
{
  "name": "My cool Homelab!",
  "accent": "63dd76",
  "text": "Hello!",
  "background": "https://live.staticflickr.com/65535/53220049083_81bfd62a04_c.jpg"
}
```

Here you can set the name of your homelab, the accent color, the header text that will be displayed and the background image.

### services.json

```json
[
	{
		"name": "Jellyfin",
		"icon": "sh:jellyfin",
		"url": "https://..."
	},
	{
		"name": "Immich",
		"icon": "sh:immich",
		"url": "https://..."
	}
]
```

Here you can set the services you want to display. Each service has a name, an icon and a URL.

The icon can be one of the following:
- A [selfh.st icon](https://selfh.st/icons/) starting with `sh:` (e.g. `sh:jellyfin`)
- A docker hub icon starting with `docker-hub:` (e.g. `docker-hub:jellyfin/jellyfin`)
- A HTTP URL to an image (e.g. `https://.../icon.png`)
- A data URL (e.g. `data:image/png;base64,...`)

These icons will be automatically cached and served as data: URLs.
If you modify an icon, you will need to delete the iconCache.json file in the config folder.
