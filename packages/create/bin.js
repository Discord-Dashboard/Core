#!/usr/bin/env node
import { scaffold } from "./src/index.ts"

const target = process.argv[2] ?? "."
const result = scaffold(target, { name: process.argv[3] })
console.log(`Created ${result.name} with ${result.files.length} files.`)
console.log("Copy .env.example to .env and fill in your secrets.")
