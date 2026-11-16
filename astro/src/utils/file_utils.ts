import fs from "fs";
``;
import path from "path";
import matter from "gray-matter";
import markdownit from "markdown-it";
import { PAGE_DIR, BLOG_DIR, CONFIG_DIR } from "@/constants/constants";
export function mdIt(content: string): string {
  if (!content) return "";
  const md = markdownit({
    // Enable HTML tags in source
    html: false,
    // Autoconvert URL-like text to links
    linkify: true,
  });

  return md.render(content);
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
    //    const contentHtml = mdIt(matterResult.data.body[getLangCode()]);
    frontmatter = traverseLocalize(frontmatter);
    frontmatter = traverseMdIt(frontmatter);
    return {
      file: `${id}.md`,
      ...frontmatter,
      slug: "/blog/" + id,
    };
  } catch (err) {
    console.log(err);
  }
  return null;
}

export function getLangCode() {
  return import.meta.env.LANGUAGE_CODE ?? "english";
}

export function traverseLocalize(anyObject: any) {
  if (anyObject === null || typeof anyObject != "object") return anyObject;
  if (anyObject[getLangCode()]) return anyObject[getLangCode()];

  const content = Array.isArray(anyObject) ? [...anyObject] : { ...anyObject };
  if (anyObject.constructor !== Object && !Array.isArray(anyObject)) return anyObject; 

  Object.entries(anyObject).forEach(([key, value]) => {
    content[key] = traverseLocalize(value);
  });
  return content;
}

export function traverseMdIt(anyObject: any) {
  if (typeof anyObject !== "object" || !anyObject) return anyObject;
  const newObj = Array.isArray(anyObject) ? [...anyObject] : { ...anyObject };

  Object.entries(anyObject).forEach(([key, value]) => {
    if (key == "content" && typeof value == "string") {
      newObj["content"] = mdIt(value);
    } else if (key == "body" && typeof value == "string") {
      newObj["body"] = mdIt(value);
    } else if (
      value !== null &&
      typeof value === "object" &&
      (Array.isArray(value) || value.constructor === Object)
    ) {
      newObj[key] = traverseMdIt(value);
    }
  });
  return newObj;
}

export function getPageContent(id: string): any {
  try {
    const fullPath = path.join(PAGE_DIR, `${id}.md`);
    const fileContents = fs.readFileSync(fullPath, "utf8");
    const matterResult = matter(fileContents);

    let frontmatter = matterResult.data;

    frontmatter.blocks = traverseLocalize(frontmatter.blocks);
    frontmatter = traverseMdIt(frontmatter);
    return {
      file: `${id}.md`,
      ...frontmatter,
      slug: "/blog/" + id,
    };
  } catch (err) {
    console.log(err);
  }
  return null;
}

export const getAllBlogSlugs = () => {
  const pages = getMdFileNames(BLOG_DIR);

  return pages.map((slug) => ({ params: { slug } }));
};

export const getAllPageSlugs = () => {
  const pages = getMdFileNames(PAGE_DIR);

  return pages
    .filter((slug) => slug !== "home")
    .map((slug) => ({ params: { slug } }));
};

export const getAllBlogContent = () =>
  getAllBlogSlugs().map((e) => getBlogContent(e.params.slug));

export const getAllPageContent = () =>
  getAllPageSlugs().map((e) => getPageContent(e.params.slug));

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
