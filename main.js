import express from "express";
import { readFile, writeFile, stat } from "fs/promises";

const app = express();

async function exists(path) {
	const stats = await stat(path).catch(() => null);
	return stats != null;
}

if(!await exists("config/config.json")) {
	await writeFile("config/config.json", JSON.stringify({
		name: "My cool Homelab!",
		accent: "63dd76",
		text: "Hello!"
	}));
}
if(!await exists("config/services.json")) {
	await writeFile("config/services.json", JSON.stringify([]));
}
if(!await exists("config/iconCache.json")) {
	await writeFile("config/iconCache.json", JSON.stringify({}));
}

const iconCache = JSON.parse(await readFile("config/iconCache.json", "utf-8"));

app.get("/", async (req, res) => {
	const config = JSON.parse(await readFile("config/config.json", "utf-8"));
	const services = JSON.parse(await readFile("config/services.json", "utf-8"));

	let content = await readFile("public/index.html", "utf-8");
	content = content.replaceAll("{{name}}", config.name).replaceAll("{{accent}}", config.accent).replaceAll("{{text}}", config.text);
	content = content.replaceAll("{{services}}", (await Promise.all(services.map(async s => {
		// const icon = s.icon.startsWith("docker-hub:") ? `https://github.com/docker-library/docs/blob/master/${s.icon.replace("docker-hub:", "")}/logo.png?raw=true` : s.icon;
		let icon = iconCache[s.name] || s.icon;
		if(icon.startsWith("data:")) {
		} else if(icon.startsWith("docker-hub:")) {
			const res = await fetch(`https://github.com/docker-library/docs/blob/master/${s.icon.replace("docker-hub:", "")}/logo.png?raw=true`);
			if(res.status == 200) {
				icon = `data:image/png;base64,${Buffer.from(await res.arrayBuffer()).toString("base64")}`;
			} else {
				const res = await fetch(`https://github.com/docker-library/docs/blob/master/${s.icon.replace("docker-hub:", "")}/logo.svg?raw=true`);
				if(res.status == 200) {
					icon = `data:image/svg+xml;base64,${Buffer.from(await res.arrayBuffer()).toString("base64")}`;
				}
			}
		} else if(icon.startsWith("http:") || icon.startsWith("https:")) {
			const res = await fetch(icon);
			if(res.status == 200) {
				if(icon.endsWith(".svg")) {
					icon = `data:image/svg+xml;base64,${Buffer.from(await res.arrayBuffer()).toString("base64")}`;
				} else {
					icon = `data:image/png;base64,${Buffer.from(await res.arrayBuffer()).toString("base64")}`;
				}
			}
		}
		if(icon != s.icon) {
			iconCache[s.name] = icon;
			await writeFile("config/iconCache.json", JSON.stringify(iconCache));
		}
		return `<div class="app">
			<a href="${s.url}" target="_blank">
				<img src="${icon}" alt="${s.name}" />
			</a>
			<span>${s.name}</span>
		</div>`.trim();
	}))).join("<br>"));
	res.send(content);
})

app.use(express.static("public"));

app.listen(3000, () => {
	console.log("Server is running on port 3000");
});