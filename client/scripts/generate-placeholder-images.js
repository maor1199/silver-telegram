const fs = require("fs");
const path = require("path");

const publicDir = path.join(__dirname, "..", "public");

// Minimal 1x1 grey PNG (valid PNG file)
const minimalPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

// Minimal 1x1 JPG (valid JPEG, ~200 bytes)
const minimalJpg = Buffer.from(
  "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMAAAQEAwAAHwD/2Q==",
  "base64"
);

const pngFiles = [
  "apple-icon.png",
  "icon-dark-32x32.png",
  "icon-light-32x32.png",
  "placeholder-logo.png",
];
const jpgFiles = ["placeholder-user.jpg", "placeholder.jpg"];

pngFiles.forEach((file) => {
  fs.writeFileSync(path.join(publicDir, file), minimalPng);
  console.log("Created", file);
});
jpgFiles.forEach((file) => {
  fs.writeFileSync(path.join(publicDir, file), minimalJpg);
  console.log("Created", file);
});
