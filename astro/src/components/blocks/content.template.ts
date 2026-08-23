export const contentBlockSchema = {
	name: 'content',
	label: 'Content',
	fields: [
		{ type: 'rich-text', label: 'Body', name: 'body' },
	],
	ui: {
		defaultItem: {
			body: 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Donec odio.',
		},
	},
};
