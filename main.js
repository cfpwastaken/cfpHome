import express from "express";
import { readFile } from "fs/promises";

const fetchBufferCache = new Map();

async function fetchCachedBuffer(url) {
	if(fetchBufferCache.has(url)) {
		return fetchBufferCache.get(url);
	} else {
		const res = await fetch(url);
		if(res.status !== 200) return null;
		const buffer = Buffer.from(await res.arrayBuffer());
		fetchBufferCache.set(url, buffer);
		return buffer;
	}
}

const app = express();

app.get("/", async (req, res) => {
	const config = JSON.parse(await readFile("config/config.json", "utf-8"));
	const services = JSON.parse(await readFile("config/services.json", "utf-8"));

	let content = await readFile("public/index.html", "utf-8");
	content = content.replaceAll("{{name}}", config.name).replaceAll("{{accent}}", config.accent).replaceAll("{{text}}", config.text);
	content = content.replaceAll("{{services}}", (await Promise.all(services.map(async s => {
		// const icon = s.icon.startsWith("docker-hub:") ? `https://github.com/docker-library/docs/blob/master/${s.icon.replace("docker-hub:", "")}/logo.png?raw=true` : s.icon;
		let icon = s.icon;
		if(icon.startsWith("docker-hub:")) {
			const res = await fetchCachedBuffer(`https://github.com/docker-library/docs/blob/master/${s.icon.replace("docker-hub:", "")}/logo.png?raw=true`);
			if(res != null) {
				icon = `data:image/png;base64,${res.toString("base64")}`;
			} else {
				const res = await fetchCachedBuffer(`https://github.com/docker-library/docs/blob/master/${s.icon.replace("docker-hub:", "")}/logo.svg?raw=true`);
				if(res != null) {
					icon = `data:image/svg+xml;base64,${res.toString("base64")}`;
				}
			}
		} else if(icon.startsWith("http:") || icon.startsWith("https:")) {
			const res = await fetchCachedBuffer(icon);
			if(res != null) {
				if(icon.endsWith(".svg")) {
					icon = `data:image/svg+xml;base64,${res.toString("base64")}`;
				} else {
					icon = `data:image/png;base64,${res.toString("base64")}`;
				}
			}
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