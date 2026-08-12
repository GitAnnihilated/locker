const sharp = require("sharp");
const path = require("path");

const jobs = [
  { in: "icon-color.svg", out: "icon-color.png", width: 1024 },
  { in: "icon-mono.svg", out: "icon-mono.png", width: 1024 },
  { in: "icon-color.svg", out: "favicon-64.png", width: 64 },
  { in: "icon-color.svg", out: "app-icon-512.png", width: 512 },
  { in: "horizontal-color.svg", out: "horizontal-color.png", width: 2400 },
  { in: "horizontal-mono.svg", out: "horizontal-mono.png", width: 2400 },
  { in: "sheet.svg", out: "sheet.png", width: 2200 },
];

(async () => {
  for (const j of jobs) {
    await sharp(path.join(__dirname, j.in), { density: 600 })
      .resize({ width: j.width })
      .png()
      .toFile(path.join(__dirname, j.out));
    console.log("wrote", j.out);
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
