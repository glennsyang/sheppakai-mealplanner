#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import process from 'node:process';

const IGNORED_FILE_PREFIXES = [];

function runKnipJsonReport() {
	const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
	const args = ['knip', '--exports', '--no-progress', '--reporter', 'json', '--no-exit-code'];

	const env = {
		...process.env,
		DATABASE_URL: process.env.DATABASE_URL || './data/db.sqlite'
	};

	const result = spawnSync(command, args, {
		encoding: 'utf8',
		env,
		maxBuffer: 20 * 1024 * 1024
	});

	if (result.error) {
		process.stderr.write(`check-dead-exports: failed to run knip (${result.error.message}).\n`);
		process.exit(2);
	}

	if ((result.status ?? 0) === 2) {
		if (result.stderr) {
			process.stderr.write(result.stderr);
		}
		if (result.stdout) {
			process.stderr.write(result.stdout);
		}
		process.exit(2);
	}

	return result.stdout;
}

function isIgnoredFile(filePath) {
	return IGNORED_FILE_PREFIXES.some((prefix) => filePath.startsWith(prefix));
}

function countIssueSymbols(issue) {
	const exportCount = Array.isArray(issue.exports) ? issue.exports.length : 0;
	const typeCount = Array.isArray(issue.types) ? issue.types.length : 0;
	const duplicateCount = Array.isArray(issue.duplicates) ? issue.duplicates.length : 0;
	const enumMembers =
		issue.enumMembers && typeof issue.enumMembers === 'object' ? issue.enumMembers : {};
	const enumMemberCount = Object.values(enumMembers).reduce((total, members) => {
		return total + (Array.isArray(members) ? members.length : 0);
	}, 0);

	return exportCount + typeCount + duplicateCount + enumMemberCount;
}

const rawReport = runKnipJsonReport();

let report;
try {
	report = JSON.parse(rawReport);
} catch {
	process.stderr.write('check-dead-exports: unable to parse knip JSON output.\n');
	process.stderr.write(rawReport);
	process.exit(2);
}

const issues = Array.isArray(report.issues) ? report.issues : [];
const filteredIssues = issues.filter((issue) => !isIgnoredFile(issue.file));

if (filteredIssues.length === 0) {
	process.stdout.write('check-dead-exports: OK\n');
	process.exit(0);
}

const totalSymbols = filteredIssues.reduce((total, issue) => total + countIssueSymbols(issue), 0);
process.stderr.write(
	`Dead exports detected (${totalSymbols} symbols in ${filteredIssues.length} files):\n`
);

for (const issue of filteredIssues) {
	for (const item of issue.exports || []) {
		process.stderr.write(`  ${issue.file}:${item.line}:${item.col} - export ${item.name}\n`);
	}
	for (const item of issue.types || []) {
		process.stderr.write(`  ${issue.file}:${item.line}:${item.col} - type ${item.name}\n`);
	}
	for (const item of issue.duplicates || []) {
		const duplicateName = typeof item === 'string' ? item : JSON.stringify(item);
		process.stderr.write(`  ${issue.file} - duplicate export ${duplicateName}\n`);
	}

	const enumMembers =
		issue.enumMembers && typeof issue.enumMembers === 'object' ? issue.enumMembers : {};
	for (const [enumName, members] of Object.entries(enumMembers)) {
		if (!Array.isArray(members)) {
			continue;
		}
		for (const member of members) {
			process.stderr.write(`  ${issue.file} - enum member ${enumName}.${member}\n`);
		}
	}
}

process.exit(1);
