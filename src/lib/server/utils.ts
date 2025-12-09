import { sha256 } from '@oslojs/crypto/sha2';
import { encodeBase64url, encodeHexLowerCase } from '@oslojs/encoding';

export function generateId(length: number = 16): string {
	const bytes = crypto.getRandomValues(new Uint8Array(length));
	return encodeBase64url(bytes).slice(0, length);
}

export function generateToken(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(32));
	return encodeBase64url(bytes);
}

export function hashPassword(password: string): string {
	return encodeHexLowerCase(sha256(new TextEncoder().encode(password)));
}

export function verifyPassword(password: string, hash: string): boolean {
	return hashPassword(password) === hash;
}

export function generateSlug(name: string): string {
	// Create URL-safe slug from name
	const slug = name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');

	// Append short unique ID to ensure uniqueness
	const uniqueId = generateId(6);
	return `${slug}-${uniqueId}`;
}
