const fs = require("fs");
const chokidar = require("chokidar");

const sass = require("node-sass");
const postcss = require("postcss");
const autoprefixer = require("autoprefixer");
const mqpacker = require("css-mqpacker");
const stylefmt = require("stylefmt");

const ENTRY_FILE = "./dev/main.scss";
const DIST_FILE = "./public/main.css";
const includePaths = [];

const isWatched = process.argv[2] === "watch";

function getNow() {
  return new Date().toLocaleString("ja-JP");
}

/**
 * @param {Buffer} css
 */
function cssTransform(css) {
  const from = DIST_FILE;
  const to = DIST_FILE;

  postcss([
    autoprefixer,
    mqpacker({
      sort: true
    }),
    stylefmt
  ])
    .process(css, { from, to })
    .then(result => {
      fs.writeFile(DIST_FILE, result.css, () => true);

      if (result.map) {
        console.info("Has sourcemap.");
      }

      console.log(`Compiled Sass. ${getNow()}.`);
    })
    .catch(error => console.error(error));
}

function runPostCSS() {
  fs.readFile(DIST_FILE, (error, css) =>
    !error ? cssTransform(css) : console.error("Failed read css file.", error)
  );
}

/**
 * @param {Buffer} css
 */
function compileSass({ css }) {
  fs.writeFile(DIST_FILE, css, error =>
    !error ? runPostCSS() : console.error("Failed write css file.", error)
  );
}

function render() {
  sass.render(
    {
      file: ENTRY_FILE,
      outFile: DIST_FILE,
      outputStyle: "expanded",
      includePaths
    },
    (error, result) =>
      !error ? compileSass(result) : console.error("Failed Sass render.", error)
  );
}

function watch() {
  chokidar.watch("./dev").on("change", (e, path) => {
    render();
  });
}

isWatched ? watch() : render();
