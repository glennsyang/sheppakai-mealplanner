#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import ts from 'typescript';

const rootDir = process.cwd();

const targetRoots = ['src/routes', 'src/lib/server', 'src/lib/schemas', 'src/lib/components'].map(
	(relativePath) => path.join(rootDir, relativePath)
);

const ignoredDirs = new Set(['node_modules', '.git', '.svelte-kit', 'build', 'dist']);

const supportedScriptExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mts', '.cts']);

/**
 * @param {string} directory
 * @param {string[]} files
 */
function collectFiles(directory, files = []) {
	if (!fs.existsSync(directory)) {
		return files;
	}

	for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
		const fullPath = path.join(directory, entry.name);

		if (entry.isDirectory()) {
			if (!ignoredDirs.has(entry.name)) {
				collectFiles(fullPath, files);
			}
			continue;
		}

		if (entry.name.endsWith('.svelte') || entry.name.endsWith('.svelte.ts')) {
			files.push(fullPath);
			continue;
		}

		if (supportedScriptExtensions.has(path.extname(entry.name))) {
			files.push(fullPath);
		}
	}

	return files;
}

/**
 * @param {string} sourceText
 * @returns {number[]}
 */
function buildLineStarts(sourceText) {
	const starts = [0];
	for (let i = 0; i < sourceText.length; i += 1) {
		if (sourceText[i] === '\n') {
			starts.push(i + 1);
		}
	}

	return starts;
}

/**
 * @param {number[]} lineStarts
 * @param {number} offset
 */
function getLineNumber(lineStarts, offset) {
	let low = 0;
	let high = lineStarts.length - 1;

	while (low <= high) {
		const mid = Math.floor((low + high) / 2);
		const start = lineStarts[mid];
		const nextStart = mid + 1 < lineStarts.length ? lineStarts[mid + 1] : Number.POSITIVE_INFINITY;

		if (offset >= start && offset < nextStart) {
			return mid + 1;
		}

		if (offset < start) {
			high = mid - 1;
		} else {
			low = mid + 1;
		}
	}

	return 1;
}

/**
 * @param {string} filePath
 * @param {string} scriptSource
 * @param {number} lineOffset
 * @param {Array<{filePath:string;line:number}>} issues
 */
function findAnyInScript(filePath, scriptSource, lineOffset, issues) {
	const sourceFile = ts.createSourceFile(filePath, scriptSource, ts.ScriptTarget.Latest, true);

	const visit = (node) => {
		if (node.kind === ts.SyntaxKind.AnyKeyword) {
			const lineAndChar = sourceFile.getLineAndCharacterOfPosition(node.getStart());
			issues.push({
				filePath,
				line: lineOffset + lineAndChar.line + 1
			});
		}

		ts.forEachChild(node, visit);
	};

	visit(sourceFile);
}

/**
 * @param {string} filePath
 * @param {Array<{filePath:string;line:number}>} issues
 */
function analyzeFile(filePath, issues) {
	const sourceText = fs.readFileSync(filePath, 'utf8');

	if (filePath.endsWith('.svelte') && !filePath.endsWith('.svelte.ts')) {
		const lineStarts = buildLineStarts(sourceText);
		const scriptBlockRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
		let match = scriptBlockRegex.exec(sourceText);

		while (match) {
			const scriptContent = match[1] ?? '';
			const scriptStartOffset = match.index + match[0].indexOf(scriptContent);
			const scriptStartLine = getLineNumber(lineStarts, scriptStartOffset) - 1;

			findAnyInScript(filePath, scriptContent, scriptStartLine, issues);
			match = scriptBlockRegex.exec(sourceText);
		}

		return;
	}

	findAnyInScript(filePath, sourceText, 0, issues);
}

const files = targetRoots.flatMap((targetRoot) => collectFiles(targetRoot));
const issues = [];

for (const filePath of files) {
	analyzeFile(filePath, issues);
}

if (issues.length === 0) {
	process.stdout.write('check-no-explicit-any-reviewed-scope: OK\n');
	process.exit(0);
}

process.stderr.write(`Explicit any detected in reviewed scope (${issues.length} occurrences):\n`);
for (const issue of issues) {
	const relativePath = path.relative(rootDir, issue.filePath);
	process.stderr.write(`  ${relativePath}:${issue.line} - explicit any\n`);
}

process.exit(1);
