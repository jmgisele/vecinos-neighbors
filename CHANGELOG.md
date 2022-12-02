---
currentVersion: 0.3.0
updatedAt: 2022-08-26
---

## Version 0.4.0 Beta

## New Features

* If tracking with Umami is enabled, Mattrbld tracks events using the new syntax
  introduced in Umami 1.37.0
* There are now new UI scaling options for 75%, 87% and 112% to provide finer
  scaling control on certain sceens, mapping to even font sizes at 12, 14 and 18px
* When generating a Schema from existing content, internal fields that might be
  present will be ignored by default, unless it is a repeating field. In that case
  information in `___mb_type` will be used to generate more accurate keys for the
  repeating elements

## Bugfixes

* Fixed an issue caused by `.gitkeep` files in folders that have their content
  automatically parsed

## Version 0.3.0 Beta

### New Features

* You can now sync selected changes right after entering a message by pressing
  `Ctrl` + `Enter` while the input field is still focussed
* You can now manually pull in the latest remote changes when no local changes
  are selected for sync in the changes modal
* It is now possible to create folders when uploading media while editing content
* If the Live Preview is open in a new tab or window, this tab or window will now
  be closed when the content item being edited is closed
* It is now possible to specify a global maximum file size for the Media Library.
  If specified, users will not be able to upload files with a size greater than
  the one specified. This value can be overwritten on a per-field basis
* File fields were upgraded to allow enabling uploads straight from the file picker.
  **Users will no longer be able to upload unless the field is upgraded and the new option enabled**
* Localised fields will no longer be grouped if the content item has only one
  language enabled
* Adding images to rich text editors is now supported

### Bugfixes

* When modifying the Advanced Media Library Schema, nested and image fields are
  now properly handled during validation
* Newly uploaded media files will now have their names slugified according to the
  slugify settings of the project
* Folders created in the Media Library will now be properly slugified according
  to the slugify settings of the project
* The empty state message when there are no local changes to be synced is now readable
  in dark mode
* The project is now reloaded after discarding changes to the project configuration
  in order to restore the original configuration without having to refresh the page
* The warning messages on input fields should now be more legible
* The `url` property sent to the live preview is now always the final URL, even
  when the content is still marked as a draft
* ID Fields using a `type` of `filepath` will now correctly reflect the path of
  the file within the project, not within Mattrbld. Additionally, the path will
  always reflect the **final** path of the file, even when it is a draft
* Image fields with resolution hints that don’t contain a number will no longer break
* Creating new folders now always adds a `.gitkeep` file in that folder to ensure it's synced.
  This fixes the issue that a folder only containing drafts wasn't visible on other
  devices until it was created there

## Version 0.2.0 Alpha

### New Features

* It is now possible to filter the available options in repeating fields if there
  are more than six

### Bugfixes

* You can now add tel and mailto URLs to Link-fields without causing validation errors
* The linking helper in text editors and Link-fields is now better at determining
  whether a value is an internal or external link
* Any open field groups are now properly closed when the preview is activated
* Users will now be prompted to install Mattrbld only once

## Version 0.1.7 Alpha

### Bugfixes

* Fixed template-based ID generation when a Schema is assigned to a piece of content
* Removed hard-coded references to project IDs to avoid issues with importing
  pre-configured projects
* Ensured that the first user of a project is always set as its owner, even if
  the project was pre-configured

## Version 0.1.6 Alpha

### Bugfixes

* Fixed an issue that prevented saving content with fields in a tab grouped under
  a specific key
* Fixed an issue that could prevent the generation of a Schema from an existing
  file when some nested fields were set to be ignored

## Version 0.1.5 Alpha

### Bugfixes

* Fixed the URL validation of Link fields so simple hashes (e.g. #about-us) are
  recognised as valid URLs

## Version 0.1.4 Alpha

### Bugfixes

* Fixed an issue with top-level container fields in tabs that are grouped as
  objects under a key
* Fixed an issue that was causing duplicated news after a refresh in the News
  and Announcements section

## Version 0.1.3 Alpha

### Bugfixes

* Fixed the Chrome autofill issue (again)
* Ironed out some visual quirks

## Version 0.1.2 Alpha

### Bugfixes

* Fixed an issue where content using repeating fields that had collapsible
  fields as children could not be displayed correctly after having their type
  changed

## Version 0.1.1 Alpha

### Bugfixes

* Attempted to fix an issue where Chrome would autofill login details in unrelated
  input fields, it might not be fully working yet

## Version 0.1.0 Alpha

This is the initial alpha release of Mattrbld. Please note that this is a
pre-release and parts of the application may still change. If you encounter any
bugs, please report them [here](https://twitter.com/mattrbld) (until the
official issue tracker becomes available) and make sure to leave feedback and
feature requests while you’re there. Enjoy managing your content with Mattrbld!
😊
