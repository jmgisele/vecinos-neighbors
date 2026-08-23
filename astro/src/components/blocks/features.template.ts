import type { FeatureItem } from '../../lib/data';

export const featuresBlockSchema = {
	name: 'features',
	label: 'Features',
	fields: [
		{ type: 'string', label: 'Title', name: 'title' },
		{ type: 'string', label: 'Description', name: 'description' },
		{
			type: 'object', label: 'Feature Items', name: 'items', list: true,
			ui: { itemProps: (i: FeatureItem) => ({ label: i?.title ?? '' }), defaultItem: { title: "Here's a feature", text: 'Describe it here.' } },
			fields: [
				{ type: 'string', label: 'Icon', name: 'icon', description: "Any Tabler icon name, e.g. brand-x, book-2, brand-github. Browse at https://icones.js.org/collection/tabler", },
				{ type: 'string', label: 'Title', name: 'title' },
				{ type: 'rich-text', label: 'Text', name: 'text' },
			],
		},
	],
	ui: {
		defaultItem: {
			title: 'Built to cover your needs',
			description: 'Everything you need to build content-driven sites.',
			items: [
				{ title: 'Visual editing', text: 'Edit in context.', icon: 'edit' },
				{ title: 'Composable blocks', text: 'Build pages from blocks.', icon: 'layout-grid' },
				{ title: 'Git-backed', text: 'Content lives in your repo.', icon: 'brand-git' },
			],
		},
	},
};
