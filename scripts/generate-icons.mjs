import sharp from "sharp";
import { readFileSync } from "fs";

const svg = readFileSync("./public/icon.svg");

await sharp(svg).resize(192, 192).png().toFile("./public/icon-192.png");
await sharp(svg).resize(512, 512).png().toFile("./public/icon-512.png");

const inner = await sharp(svg).resize(384, 384).png().toBuffer();
await sharp({
  create: { width: 512, height: 512, channels: 4, background: "#0a0a0a" },
})
  .composite([{ input: inner, gravity: "center" }])
  .png()
  .toFile("./public/icon-maskable-512.png");

console.log("Icons generated!");
