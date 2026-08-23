import fs from "fs";``
import path from "path";
import matter from "gray-matter";
import markdownit from "markdown-it";
import {
	PAGE_DIR,
	BLOG_DIR,
	CONFIG_DIR
} from "@/constants/constants";
export function mdIt(content: string): string {
	if (!content) return "";
	//
	const md = markdownit({
		// Enable HTML tags in source
		html: false,
		// Autoconvert URL-like text to links
		linkify: true,
	});

	const result = md.render(content);

	// let modifiedHtml = result.replace(
	// 	/<a/g,
	// 	'<a class="font-serif text-xl lg:text-2xl text-dark-red hover:text-red" '
	// );

	// modifiedHtml = modifiedHtml.replace(
	// 	/<li/g,
	// 	'<li class="pomegranate-lis ml-4" '
	// );

	// modifiedHtml = modifiedHtml.replace(
	// 	/<h6/g,
	// 	'<h6 class="text-lg lg:text-xl font-bold font-serif not-prose" '
	// );
	// modifiedHtml = modifiedHtml.replace(
	// 	/<h5/g,
	// 	'<h5 class="text-xl lg:text-2xl font-bold font-serif not-prose" '
	// );
	// modifiedHtml = modifiedHtml.replace(
	// 	/<h4/g,
	// 	'<h4 class="text-2xl lg:text-3xl font-serif not-prose" '
	// );
	// modifiedHtml = modifiedHtml.replace(
	// 	/<h3/g,
	// 	'<h3 class="text-3xl lg:text-4xl font-serif not-prose" '
	// );
	// modifiedHtml = modifiedHtml.replace(
	// 	/<h2/g,
	// 	'<h2 class="text-4xl lg:text-5xl font-serif not-prose" '
	// );
	// modifiedHtml = modifiedHtml.replace(
	// 	/<h1/g,
	// 	'<h1 class="text-5xl lg:text-6xl font-serif not-prose" '
	// );

	// modifiedHtml = modifiedHtml.replace(
	// 	/<blockquote/g,
	// 	'<blockquote class="ml-4 pl-2 border-solid border-l-2 border-red my-4" '
	// );

	return result;
}
export async function getSiteConfig(): Promise<any> {
	try {
		const fullPath = path.join(CONFIG_DIR, `config.json`);
		return await JSON.parse(fs.readFileSync(fullPath, "utf8"));
	} catch (err) {
		console.log(err);
	}
	return null;
}

export function getBlogContent(id: string): any {
	try {
		const fullPath = path.join(BLOG_DIR, `${id}.md`);

		const fileContents = fs.readFileSync(fullPath, "utf8");
		const matterResult = matter(fileContents);
		let frontmatter = matterResult.data;

		const contentHtml = mdIt(matterResult.content);
		return {
			file: `${id}.md`,
			content: contentHtml,
			...frontmatter,
			slug: "/blog/" + id,
		};
	} catch (err) {
		console.log(err);
	}
	return null;
}
export function getPageContent(id: string): any {
	try {
		const fullPath = path.join(PAGE_DIR, `${id}.md`);

		const fileContents = fs.readFileSync(fullPath, "utf8");
		const matterResult = matter(fileContents);
		let frontmatter = matterResult.data;

		console.log(matterResult)
		const contentHtml = mdIt(matterResult.content);
		return {
			file: `${id}.md`,
			content: contentHtml,
			...frontmatter,
			slug: "/blog/" + id,
		};
	} catch (err) {
		console.log(err);
	}
	return null;
}

// export const getBookUsLink = () => {
// 	return getYAML(YAML_DIR, "bookus.yaml") as BookUsLink;
// }

// export const getDedication = () => {
// 	return getYAML(YAML_DIR, "dedication.yaml") as { dedication: string };
// }



// export const getYAML = (directory: string, filename: string): unknown => {
// 	try {
// 		let flName = path.join(process.cwd(), directory, filename);
// 		const file = yaml.load(fs.readFileSync(flName, "utf8"), {
// 			schema: FAILSAFE_SCHEMA,
// 		});
// 		return file;
// 	} catch (error) {
// 		console.error(error);
// 		return null;
// 	}
// };

export const getAllBlogSlugs = () => {
	const pages = getMdFileNames(BLOG_DIR);

	return pages
		.map((slug) => ({ params: { slug } }));
}

export const getAllPageSlugs = () => {
	const pages = getMdFileNames(PAGE_DIR);

	return pages
		.filter((slug) => slug !== 'home')
		.map((slug) => ({ params: { slug } }));
}

export const getAllBlogContent = () => getAllBlogSlugs().map(e => getBlogContent(e.params.slug));

export const getAllPageContent = () => getAllPageSlugs().map(e => getPageContent(e.params.slug));

export const getMdFileNames = (directory: string): string[] => {
	try {
		const files = fs.readdirSync(directory);
		return files
			.filter((file) => path.parse(file).ext == ".md")
			.map((file) => path.parse(file).name);

	} catch (err) {
		console.error("Could not get files.", err);
		return [];
	}
};
