#!/usr/bin/env node
import { scaffold } from "./dist/index.js"

const target = process.argv[2] ?? "."
const result = scaffold(target, { name: process.argv[3] })
console.log(`Created ${result.name} with ${result.files.length} files.`)
console.log("\nNext:")
if (target !== ".") console.log(`  cd ${target}`)
console.log("  npm install")
console.log("  copy .env.example to .env and fill in your Discord app and bot token")
console.log("  npm start")
