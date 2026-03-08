import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { pantryItems } from '../db/schema';
import type { PantryItem } from '$lib/types';
import { logger } from '$lib/logger';
import { randomUUID } from 'crypto';

function rowToItem(row: typeof pantryItems.$inferSelect): PantryItem {
	return {
		id: row.id,
		userId: row.userId,
		name: row.name,
		quantity: row.quantity,
		unit: row.unit,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt
	};
}

export async function listPantryItems(userId: string): Promise<PantryItem[]> {
	logger.debug('listPantryItems', { userId });
	const rows = await db
		.select()
		.from(pantryItems)
		.where(eq(pantryItems.userId, userId))
		.all();
	return rows.map(rowToItem);
}

export async function addPantryItem(
	userId: string,
	name: string,
	quantity?: number | null,
	unit?: string | null
): Promise<PantryItem> {
	logger.debug('addPantryItem', { userId, name });
	const now = new Date();
	const id = randomUUID();
	await db.insert(pantryItems).values({
		id,
		userId,
		name,
		quantity: quantity ?? null,
		unit: unit ?? null,
		createdAt: now,
		updatedAt: now
	});
	const [row] = await db
		.select()
		.from(pantryItems)
		.where(eq(pantryItems.id, id))
		.all();
	return rowToItem(row);
}

export async function removePantryItem(userId: string, itemId: string): Promise<void> {
	logger.debug('removePantryItem', { userId, itemId });
	await db
		.delete(pantryItems)
		.where(and(eq(pantryItems.id, itemId), eq(pantryItems.userId, userId)));
}

export async function clearPantry(userId: string): Promise<void> {
	logger.debug('clearPantry', { userId });
	await db.delete(pantryItems).where(eq(pantryItems.userId, userId));
}
