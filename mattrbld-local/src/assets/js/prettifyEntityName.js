/**
 * Replaces dashes with spaces and removes file extensions in an effort to make
 * slugified file names more readable for non-technical users
 *
 * @param {String} name The entity name to prettify
 * @param {Boolean} isFolder Whether the {@link name} is attached to a folder
 * @returns {String} The prettified string
 */
export default function prettifyEntityName(name, isFolder) {
  if (!isFolder) {
    const cleanedName = name.replace(/-/g, ' ');
    // returns Infinity for leading or missing dots, otherwise returns the last
    // index of a dot in a string
    const dotIndex = (Math.max(0, cleanedName.lastIndexOf('.')) || Infinity);
    return cleanedName.replace(/-/g, ' ').substring(0, dotIndex);
  }

  return name.replace(/-/g, ' ');
}
