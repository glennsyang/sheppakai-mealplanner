#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import ts from 'typescript';

const rootDir = process.cwd();
const srcDir = path.join(rootDir, 'src');

const targetServerFileRegex = /\+(page|layout)\.server\.(ts|js)$|\+server\.(ts|js)$/;
const ignoredDirs = new Set(['node_modules', '.git', '.svelte-kit', 'build', 'dist']);

/**
 * Collect only SvelteKit server entry files where redirect() should always be thrown.
 */
function collectServerFiles(dir, files = []) {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			if (!ignoredDirs.has(entry.name)) {
				collectServerFiles(fullPath, files);
			}
			continue;
		}

		if (targetServerFileRegex.test(entry.name)) {
			files.push(fullPath);
		}
	}

	return files;
}

function getSvelteKitNamedBindings(statement) {
	if (!ts.isImportDeclaration(statement) || !statement.importClause) {
		return null;
	}

	if (!ts.isStringLiteral(statement.moduleSpecifier)) {
		return null;
	}

	if (statement.moduleSpecifier.text !== '@sveltejs/kit') {
		return null;
	}

	return statement.importClause.namedBindings ?? null;
}

function collectRedirectBindings(namedBindings, redirectIdentifiers, redirectNamespaces) {
	if (ts.isNamedImports(namedBindings)) {
		for (const element of namedBindings.elements) {
			const importedName = element.propertyName?.text ?? element.name.text;
			if (importedName === 'redirect') {
				redirectIdentifiers.add(element.name.text);
			}
		}
		return;
	}

	if (ts.isNamespaceImport(namedBindings)) {
		redirectNamespaces.add(namedBindings.name.text);
	}
}

function getRedirectImports(sourceFile) {
	const redirectIdentifiers = new Set();
	const redirectNamespaces = new Set();

	for (const statement of sourceFile.statements) {
		const namedBindings = getSvelteKitNamedBindings(statement);
		if (!namedBindings) {
			continue;
		}

		collectRedirectBindings(namedBindings, redirectIdentifiers, redirectNamespaces);
	}

	return { redirectIdentifiers, redirectNamespaces };
}

function isRedirectCall(node, redirectIdentifiers, redirectNamespaces) {
	if (ts.isIdentifier(node.expression)) {
		return redirectIdentifiers.has(node.expression.text);
	}

	if (
		ts.isPropertyAccessExpression(node.expression) &&
		ts.isIdentifier(node.expression.expression) &&
		node.expression.name.text === 'redirect'
	) {
		return redirectNamespaces.has(node.expression.expression.text);
	}

	return false;
}

function unwrapExpressionParents(node) {
	let current = node;

	while (
		ts.isParenthesizedExpression(current) ||
		ts.isAsExpression(current) ||
		ts.isTypeAssertionExpression(current) ||
		ts.isNonNullExpression(current) ||
		ts.isSatisfiesExpression(current)
	) {
		current = current.parent;
	}

	return current;
}

if (!fs.existsSync(srcDir)) {
	process.stderr.write('check-redirect-throws: src directory not found.\n');
	process.exit(2);
}

const files = collectServerFiles(srcDir);
const issues = [];

for (const filePath of files) {
	const sourceText = fs.readFileSync(filePath, 'utf8');
	const sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true);
	const { redirectIdentifiers, redirectNamespaces } = getRedirectImports(sourceFile);

	if (redirectIdentifiers.size === 0 && redirectNamespaces.size === 0) {
		continue;
	}

	const visit = (node) => {
		if (
			ts.isCallExpression(node) &&
			isRedirectCall(node, redirectIdentifiers, redirectNamespaces)
		) {
			const unwrappedParent = unwrapExpressionParents(node.parent);
			if (!ts.isThrowStatement(unwrappedParent)) {
				const position = sourceFile.getLineAndCharacterOfPosition(node.getStart());
				issues.push({
					filePath,
					line: position.line + 1,
					column: position.character + 1
				});
			}
		}

		ts.forEachChild(node, visit);
	};

	visit(sourceFile);
}

if (issues.length > 0) {
	process.stderr.write('Non-thrown redirect() calls detected:\n');
	for (const issue of issues) {
		const relativePath = path.relative(rootDir, issue.filePath);
		process.stderr.write(
			`  ${relativePath}:${issue.line}:${issue.column} - use "throw redirect(...)"\n`
		);
	}
	process.exit(1);
}

process.stdout.write('check-redirect-throws: OK\n');
