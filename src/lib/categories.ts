// Registry describing every content category: its route, JSON table, display
// style, and sidebar grouping. Drives the sidebar nav, the home grid, and the
// generic index/detail pages.

export type PageStyle = 'single' | 'list';

export interface Category {
	/** route segment + JSON table name (src/data/json/<key>.json) */
	key: string;
	title: string;
	/** 'single' = one long page with anchors; 'list' = index + per-entry pages */
	style: PageStyle;
	blurb: string;
	group: string;
}

export const GROUPS = [
	'Core Rules',
	'Heroes',
	'Treasures',
	'Bestiary',
	'Encounters',
	"Director's Tools",
	'Reference'
] as const;

export const CATEGORIES: Category[] = [
	// Core Rules
	{ key: 'rules', title: 'Rules Glossary', style: 'single', group: 'Core Rules', blurb: 'Core rules terms: movement, distance, cover, conditions of play, and more.' },
	{ key: 'conditions', title: 'Conditions', style: 'single', group: 'Core Rules', blurb: 'Status conditions such as bleeding, dazed, frightened, and grabbed.' },

	// Heroes
	{ key: 'ancestries', title: 'Ancestries', style: 'list', group: 'Heroes', blurb: 'Playable peoples and their signature traits.' },
	{ key: 'cultures', title: 'Cultures', style: 'list', group: 'Heroes', blurb: 'Environment, organisation, and upbringing backgrounds.' },
	{ key: 'careers', title: 'Careers', style: 'list', group: 'Heroes', blurb: 'What your hero did before adventuring.' },
	{ key: 'classes', title: 'Classes', style: 'list', group: 'Heroes', blurb: 'The nine heroic classes, their subclasses, features, and abilities.' },
	{ key: 'domains', title: 'Domains', style: 'list', group: 'Heroes', blurb: 'Divine and primordial domains for conduits and others.' },
	{ key: 'kits', title: 'Kits', style: 'list', group: 'Heroes', blurb: 'Combat kits granting equipment styles and bonuses.' },
	{ key: 'perks', title: 'Perks', style: 'list', group: 'Heroes', blurb: 'Optional talents across crafting, lore, exploration, and more.' },
	{ key: 'complications', title: 'Complications', style: 'list', group: 'Heroes', blurb: 'Character flaws and hooks with mechanical upsides and downsides.' },
	{ key: 'titles', title: 'Titles', style: 'list', group: 'Heroes', blurb: 'Earned titles that grant features as your legend grows.' },
	{ key: 'abilities', title: 'Standard Abilities', style: 'list', group: 'Heroes', blurb: 'Free strikes and other abilities available to everyone.' },
	{ key: 'projects', title: 'Projects', style: 'list', group: 'Heroes', blurb: 'Downtime and crafting projects.' },

	// Treasures
	{ key: 'items', title: 'Treasures', style: 'list', group: 'Treasures', blurb: 'Artifacts, consumables, trinkets, and leveled gear.' },
	{ key: 'imbuements', title: 'Imbuements', style: 'list', group: 'Treasures', blurb: 'Enchantments that can be applied to weapons, armor, and implements.' },

	// Bestiary
	{ key: 'monsters', title: 'Bestiary', style: 'list', group: 'Bestiary', blurb: 'Monster groups and their stat blocks.' },

	// Encounters
	{ key: 'terrain', title: 'Terrain', style: 'list', group: 'Encounters', blurb: 'Hazards, fieldworks, siege engines, and other battlefield fixtures.' },

	// Director's Tools
	{ key: 'monster-basics', title: 'Monster Basics', style: 'single', group: "Director's Tools", blurb: 'Running monsters: reading a stat block, roles, organizations, minions, captains, and malice.' },
	{ key: 'montages', title: 'Montages', style: 'list', group: "Director's Tools", blurb: 'Structured montage test challenges.' },
	{ key: 'negotiations', title: 'Negotiations', style: 'list', group: "Director's Tools", blurb: 'Social encounter frameworks with motivations and pitfalls.' },

	// Reference
	{ key: 'skills', title: 'Skills', style: 'single', group: 'Reference', blurb: 'The full skill list by group.' },
	{ key: 'languages', title: 'Languages', style: 'single', group: 'Reference', blurb: 'Languages spoken across the setting.' }
];

export const byKey = (key: string): Category | undefined => CATEGORIES.find(c => c.key === key);

export const byGroup = (group: string): Category[] => CATEGORIES.filter(c => c.group === group);
