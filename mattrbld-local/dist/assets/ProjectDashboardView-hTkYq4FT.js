import{C as e,F as t,L as n,N as r,S as i,W as a,_ as o,bt as s,c,d as l,ft as u,g as d,h as f,i as p,mt as m,n as h,r as g,v as _}from"./fs-Ds824KaV.js";import{o as v,t as y}from"./runtime-dom.esm-bundler-DONEwY9x.js";import{c as b,s as x,t as S}from"./toDate-De2X_-UR.js";import{C,Ct as w,E as T,St as E,Tt as D,_t as O,bt as k,c as ee,ct as A,dt as j,vt as M,wt as N,xt as P,yt as F}from"./index-g8SRjIgI.js";function I(e,t,n){let[r,i]=w(n?.in,e,t),a=r.getFullYear()-i.getFullYear(),o=r.getMonth()-i.getMonth();return a*12+o}function L(e,t){return S(e)-+S(t)}function R(e,t){let n=S(e,t?.in);return+F(n,t)==+M(n,t)}function z(e,t,n){let[r,i,a]=w(n?.in,e,e,t),o=E(i,a),s=Math.abs(I(i,a));if(s<1)return 0;i.getMonth()===1&&i.getDate()>27&&i.setDate(30),i.setMonth(i.getMonth()-o*s);let c=E(i,a)===-o;R(r)&&s===1&&E(r,a)===1&&(c=!1);let l=o*(s-+c);return l===0?0:l}function B(e,t,n){let r=L(e,t)/1e3;return k(n?.roundingMethod)(r)}function V(e,t,n){let r=D(),i=n?.locale??r.locale??O,a=E(e,t);if(isNaN(a))throw RangeError(`Invalid time value`);let o=Object.assign({},n,{addSuffix:n?.addSuffix,comparison:a}),[s,c]=w(n?.in,...a>0?[t,e]:[e,t]),l=B(c,s),u=(N(c)-N(s))/1e3,d=Math.round((l-u)/60),f;if(d<2)return n?.includeSeconds?l<5?i.formatDistance(`lessThanXSeconds`,5,o):l<10?i.formatDistance(`lessThanXSeconds`,10,o):l<20?i.formatDistance(`lessThanXSeconds`,20,o):l<40?i.formatDistance(`halfAMinute`,0,o):l<60?i.formatDistance(`lessThanXMinutes`,1,o):i.formatDistance(`xMinutes`,1,o):d===0?i.formatDistance(`lessThanXMinutes`,1,o):i.formatDistance(`xMinutes`,d,o);if(d<45)return i.formatDistance(`xMinutes`,d,o);if(d<90)return i.formatDistance(`aboutXHours`,1,o);if(d<1440){let e=Math.round(d/60);return i.formatDistance(`aboutXHours`,e,o)}else if(d<2520)return i.formatDistance(`xDays`,1,o);else if(d<43200){let e=Math.round(d/x);return i.formatDistance(`xDays`,e,o)}else if(d<43200*2)return f=Math.round(d/b),i.formatDistance(`aboutXMonths`,f,o);if(f=z(c,s),f<12){let e=Math.round(d/b);return i.formatDistance(`xMonths`,e,o)}else{let e=f%12,t=Math.trunc(f/12);return e<3?i.formatDistance(`aboutXYears`,t,o):e<9?i.formatDistance(`overXYears`,t,o):i.formatDistance(`almostXYears`,t+1,o)}}function H(e,t){return V(e,P(e),t)}var U=s(A()),W=`---
currentVersion: 1.6.0
updatedAt: 2026-03-06
---
## Version 1.7.0

### New Features


### Bugfixes

* Uncollapsible container fields no longer stick to consecutive collapsible
  container fields
* Editable lists now try harder to keep the input field visible in supported
  browsers
* If a project import fails on the home screen due to a network or other error,
  the importing modal will now properly reset
* If a project import fails during onboarding, the progress steps are now reset
  correctly
* Copying the URL of a file in a Media Collection now correctly applies the first
  available URL template

### Other Changes

* Collapsible container fields now animate between collapsed and uncollapsed
  states in supported browsers
* The underlying tool stack was upgraded to newest versions, improving bundle
  size and improving development time

## Version 1.6.0

### New Features

* You can now enable an option in th ecollection settings to show raw file and
  folder names

### Bugfixes

* The algorithm for prettyifing file and folder names is now more robust and
  will no longer try stripping (non-existent) file extensions from folder names

## Version 1.5.1

### Other Changes

* Fix versioning info display in the Project Dashboard

## Version 1.5.0

### New Features

* When opening an Invite-Link for a project that was imported before by the
  current user, Mattrbld will now redirect straight to the project Dashboard.
  This allows for \`/admin\` URLs on websites which redirect to a generic Mattrbld
  [Invite-Link](https://mattrbld.com/docs/importing-projects/#import-via-invite-link)
* Consecutive collapsible visual container fields are now visually grouped into
  an accordion
* There is a new icon field for picking an icon from a source folder, you can
  [learn more in the docs](https://mattrbld.com/docs/fields/icon/)

### Bugfixes

* Re-trying to import a project in case the onboarding was aborted is now more
  reliable
* Showing fields conditionally by the value of another field now works properly
  when the other field is within a visual container
* Unsetting the “Show if” rule of a field now properly clears the underlying
  values
* The display value for group fields will now be correctly fetched even if the
  referenced field is within a visual container
* The versions of custom fields will now always be increased, even if the field
  type of the custom field was changed
* Changing the field type of a custom field and then updating outdated versions
  of that field in other Schemas now works reliably

### Other Changes

* During onboarding, the buttons now switch to a loading state if the file
  system is congested by a large download
* When hovering icons, a tooltip will be shown with the full icon name. This way
  even truncated names can be read fully

## Version 1.4.2

### Bugfixes

* \`\\.\` in URL templates will now be correctly replaced with \`.\` in all cases

## Version 1.4.1

### Bugfixes

* The new fetching status toast no longer covers the buttons in the Git
  authentication modal

### Other Changes

* The colours of autofilled text should now be more readable across all browsers

## Version 1.4.0

### New Features

* Avif images are now supported in the Media Library
* Newly created or duplicated Collections will now automatically be added to the
  project sidebar
* Deleted Collections will be automatically removed from the project sidebar
* Collections which aren’t accessible via the project sidebar will now show a warning
  and a button to open them in the collection settings
* You can now copy the URL of an item in Media Collections if the Collection is
  linkable and has a URL template as well as in the Media Library
* There will now be a toast showing the status of the initial sync when the
  project sidebar is not visible
* The new \`transliterate\` option for slugification is now supported

### Bugfixes

* The input field for the \`preserveCharacters\` slugify option now accurately
  reflects the value of that setting
* The slugify options now accurately display the defaults when no options were
  set for the project
* \`\\.\` in URL templates is now consistently unescaped to \`.\`
* There will no longer be consecutive slashes in the image src when \`outputPath\`
  is set to a path ending in a slash in the Media Library
* Localized Sortable List fields now work as intended when content languages are
  changed

### Other Changes

* The labels of the “Add” and empty state action buttons in file lists have been
  uniformly changed to “New” in order to make their function clearer and unify
  the wording
* Additional “Add” labels throughout the UI have been changed to “Create” where
  appropriate to improve clarity and consistency
* The option to move top level group fields into separate tabs while generating
  a Schema from existing content now only shows up if there are top level group
  fields

## Version 1.3.0

### New Features

* Support non-JPG avatars
* Project avatars are now higher resolution and stored as webP to mitigate the
  increase in storage, this way the generated avatars are roughly the same size
  as their lower-resolution JPG equivalents
* Collections now support selecting a default name for new files created in
  them. This is opt-in and controlled per-collection.

### Bugfixes

* Fixed an issue where the users directory was missing after importing a
  pre-configured project

### Other Changes

* Added a new progress step while importing a project to show activity while
  the files are downloaded from the remote repository

## Version 1.2.1

### Bugfixes

* The project sidebar should no longer close unexpectedly when scrolling down

## Version 1.2.0

### New Features

* When replacing an image file, the change details now show the old and new image
  side by side
* The last sorting state for file lists is now stored locallly on a per-user basis

### Bugfixes

* Field visibility rules referring to other fields in the schema will now work
  more reliably, especially in custom fields and nested fields
* Opening the project sidebar via the button will now work more reliably on small
  screen devices

## Version 1.1.2

### Bugfixes

* The sidebar no longer gets stuck if it is swiped only a little into the screen
  on small screen devices

## Version 1.1.1

### Other Changes

* “Full Name” labels throughout the UI have been shortened to just “Name” to
  better reflect the fact that a username can be anything
* User avatars can now consist of just a single letter if only a first name or
  pseudonym are used as a username
* The link to the Quickstart Guide now shows earlier in the onboarding process

### Bugfixes

* The sidebar no longer flashes when swiping to open it on small screen devices
* Users that are not part of the currently open project are now properly
  styled when using dark mode
* The Umami integration (if enabled) now properly doesn’t auto-track and reports
  import events correctly

## Version 1.1.0

### New Features

* Allow \`width\`, \`height\`, \`loading\`, and \`decoding\` values to be passed as
  non-data attributes to images inserted into rich-text fields

### Bugfixes

* The “Refresh to update” notification will only be shown once, even if there
  have been multiple updates since it was last shown
* Using the shortcut ⌘ / Ctrl + Shift + S to enable strikethrough formatting in
  rich text fields no longer also saves the content item you are editing

## Version 1.0.2

### Bugfixes

* Ensure the name in the PWA manifest is set to “Mattrbld” with a capital ‘M’
* Include a .htaccess file which always redirects to index.html for virutal routing

## Version 1.0.1

### New Features

* Mattrbld is using a faster way to extract colours from images
* The custom and default sections of the Project Sidebar have been merged, you
  can now customise and rearrange the Dashboard, Media Library, and Settings
  options. Please note that for projects initialised pre-v1.0, you will have to
  manually add the new entries to the sidebar by editing the \`config.json\` file
  in your \`.mattrbld\` directory in a text editor if you want to customise them.
* You can now add separator lines to the Project Sidebar
* The error message in the sync modal is now selectable
* You can now simply highlight one or more words and paste a URL to format that
  selection as a link
* You can now save content, Schemas and custom fields by pressing ⌘ / Ctrl + S
* You can now duplicate Schemas, Collections and custom fields in the project
  settings
* There are more links to the documentation placed in key areas of the UI, for
  example a link to the authentication documentation in the authentication modal
  or a link to the quickstart guide when importing a project for the very first
  time

### Bugfixes

* Setting the \`preserveTrailingDash\` and \`preserveCharacters\` options in the
  slugify options of a project now works correctly

### Other Changes

* User names are no longer required to contain a space character
* You can no longer use ⌘ / Ctrl + S to enable the strikethrough format in rich
  text editors, use ⌘ / Ctrl + Shift + S instead
* Umami 2.0 is now supported for collecting basic analytics
* There is now a button for inserting hard line breaks in rich text editors
  which have them enabled, making the feature more discoverable
* Mattrbld is now an open source project released under AGPL 3.0! 🥳

## Version 0.7.1 Beta

### Bugfixes

* Disabling Smartquotes for rich text fields outputting Markdown will
  no longer cause the editor to crash

## Version 0.7.0 Beta

### New Features

* Link, File, Image and Column fields now show the full file name when
  hovering
* Folders and thumbnails in the file browser now also show the full file
  name when hovering
* The "Prevent double spaces" option for rich text editors no longer
  gets undone when pressing backspace

### Bugfixes

* Files should now be marked as locally changed more reliably
* Dashboard cards for projects still having static project IDs for sidebar
  entries should no longer lead to unexpected behaviours (404 or Access
  Denied screens)

## Version 0.6.0 Beta

### New Features

* There is a new Collection type: Media Collections. They allow users to
  upload media files into dedicated Collections outside the Media Library
  and allow for making these files linkable through link fields. You can
  learn more about the feature in the [official documentation](https://mattrbld.com/docs/media-collections/)

### Other Changes

* File and Image fields no longer have a maximum file size set by default
  since it is usually preferable to use the maximum file size set in the
  Media Library settings

### Bugfixes

* The skeletons of deleted projects will no longer show up again right
  after their deletion
* The project thumbnail of a project is now correctly re-fetched if the
  deletion of a project is undone
* Files uploaded through the file field will now be slugified correctly

## Version 0.5.0 Beta

### New Features

* Uploading a profile image with transparency now uses a background colour
  matching your current theme instead of black
* It’s now possible to add new fields to a Schema by right-clicking another
  field, which makes working on Schemas with many fields more comfortable

### Bugfixes

* Fixed a bug that caused a crash when opening a content item that had an
  unallowed Schema assigned to it
* Content will no longer immediately be validated as soon as a Content
  Languages field is present
* Localised fields will no longer look broken when only one content language
  is active
* Tag fields with complex models will now work more reliably

## Version 0.4.0 Beta

### New Features

* If tracking with Umami is enabled, Mattrbld tracks events using the new syntax
  introduced in Umami 1.37.0
* There are now new UI scaling options for 75%, 87% and 112% to provide finer
  scaling control on certain sceens, mapping to even font sizes at 12, 14 and 18px
* When generating a Schema from existing content, internal fields that might be
  present will be ignored by default, unless it is a repeating field. In that case
  information in \`___mb_type\` will be used to generate more accurate keys for the
  repeating elements
* It is now possible to disable previews for specific Collections in the Collection
  settings
* It is now possible to change the \`preserveTrailingDash\` and \`preserveCharacters\`
  Slugify options in the General Settings
* Content items, Schemas and Custom Fields now show a tooltip with the full title
  when hovered
* While on medium sized screens, the Settings, Preview and Save buttons in editors
  now show a tooltip with the label that would be visible on a larger screen
* It is now possible to add comments to the real-time content previews, you can
  learn more about this feature in the [official documentation](https://mattrbld.com/docs/preview-features/comments/)

### Bugfixes

* Fixed an issue caused by \`.gitkeep\` files in folders that have their content
  automatically parsed
* Group fields without editable content now show a message informing about that
  in content editors
* Fixed an issue where the active languages for a piece of content weren’t being
  accurately detected
* Fixed an issue that caused wrong selections after inserting an image into a
  rich text field

## Version 0.3.0 Beta

### New Features

* You can now sync selected changes right after entering a message by pressing
  \`Ctrl\` + \`Enter\` while the input field is still focussed
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
* The \`url\` property sent to the live preview is now always the final URL, even
  when the content is still marked as a draft
* ID Fields using a \`type\` of \`filepath\` will now correctly reflect the path of
  the file within the project, not within Mattrbld. Additionally, the path will
  always reflect the **final** path of the file, even when it is a draft
* Image fields with resolution hints that don’t contain a number will no longer break
* Creating new folders now always adds a \`.gitkeep\` file in that folder to ensure it's synced.
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
`,G=new j,te={beforeUnmount(){this.log.forEach(e=>{e.author.avatar&&e.author.avatar.startsWith(`blob:`)&&URL.revokeObjectURL(e.author.avatar)})},components:{AsyncImage:T},computed:{changelog(){let{data:e,content:t}=(0,U.default)(W);return{content:t,date:new Date(e.updatedAt),version:e.currentVersion}},firstName(){return this.$store.getters.userInCurrentProject?this.$store.getters.userInCurrentProject.name.split(` `)[0]:`Anonymous`},locallyChangedFiles(){return this.$store.state.application.locallyChangedFiles.filter(e=>e.startsWith(this.projectDir))},projectDir(){return`/projects/${this.$store.state.currentProject.id}`},sidebarCards(){let{sidebar:e}=this.$store.state.currentProject;return e.filter(e=>e.showInDashboard&&e.target&&(!e.limitToRoles||e.limitToRoles.length===0||e.limitToRoles.includes(this.$store.getters.userInCurrentProject.role))).map(e=>(e.target.params?.id&&(e.target.params.id=this.$store.state.currentProject.id),e))},sortedNews(){return this.newsLoading?[]:[...this.news,{author:`Mattrbld`,createdAt:this.changelog.date,formattedDate:H(this.changelog.date,{addSuffix:!0}),type:`changelog`}].sort((e,t)=>t.createdAt-e.createdAt)}},created(){this.refresh()},data(){return{activeNews:{},log:[],logLoading:!0,news:[],newsLoading:!0,renderedChangelog:null,showDetails:!1}},emits:[`push`],methods:{async fetchLog(){let e=await ee({fs:h,dir:this.projectDir,depth:10}),t=new Map,n=[];e.forEach(e=>{let{email:n,name:r}=e.commit.author,{id:i}=this.$store.state.currentProject.users.find(e=>e.email===n)||{};t.set(n,{id:i,name:r})});let r=(0,p.join)(this.projectDir,`.mattrbld`,`users`),[i,a]=await Promise.all([g.readdir(r),g.readdir(`/users`)]),o=[];t.forEach(({id:e,name:t},s)=>{i.includes(`${e}.jpg`)?o.push(g.readFile(`${r}/${e}.jpg`)):a.includes(`${e}.jpg`)?o.push(g.readFile(`/users/${e}.jpg`)):s===this.$store.state.user.email&&a.includes(`${this.$store.state.user.id}.jpg`)?o.push(g.readFile(`/users/${this.$store.state.user.id}.jpg`)):o.push(C(t,`#A29BFE`,`#6c5ce7`,`light`,s)),n.push(s)});let s=await Promise.all(o),c=new Map;s.forEach((e,t)=>{typeof e==`string`?c.set(n[t],e):c.set(n[t],URL.createObjectURL(new Blob([e]),{type:`image/jpeg`}))}),this.log=e.map(e=>{let{commit:t}=e;return{message:t.message.split(`
`)[0],date:t.committer.timestamp*1e3,formattedDate:H(new Date(t.committer.timestamp*1e3),{addSuffix:!0}),author:{avatar:c.get(t.author.email),name:t.author.name}}}),this.logLoading=!1},async fetchNews(){try{let e=(0,p.join)(this.projectDir,`.mattrbld`,`news`),t=(await g.readdir(e)).filter(e=>e.endsWith(`.md`)),n=await Promise.all(t.map(t=>g.readFile((0,p.join)(e,t),`utf8`)));this.news=[],n.forEach(e=>{let{data:t,content:n}=(0,U.default)(e);this.news.push({author:t.author,blurb:t.blurb,createdAt:new Date(t.createdAt),formattedDate:H(new Date(t.createdAt),{addSuffix:!0}),renderedContent:G.parse(n),title:t.title,type:`article`})})}catch(e){e.code!==`ENOENT`&&this.$store.commit(`addToast`,{message:`Something went wrong while fetching the news: ${e.message}`,type:`error`})}this.newsLoading=!1},openChangelog(){this.renderedChangelog===null&&(this.renderedChangelog=G.parse(this.changelog.content)),this.activeNews=this.sortedNews.find(e=>e.type===`changelog`),this.showDetails=!0},refresh(){this.logLoading=!0,this.newsLoading=!0,this.fetchLog(),this.fetchNews()}},props:{dark:Boolean}},K={class:`project-dashboard`},q={class:`wrapper cards`},J={key:0,class:`number h1`},Y={class:`label`},X={class:`label`},Z={class:`wrapper news`},Q={key:1},ne={key:0},re=[`onClick`],ie={class:`wrapper commits`},ae={key:1},oe={class:`message`},$={class:`wrapper local-changes`},se={class:`path`},ce=[`innerHTML`];function le(s,c,p,h,g,b){let x=n(`MbIcon`),S=n(`MbButton`),C=n(`MbScroller`),w=n(`MbLoader`),T=n(`AsyncImage`),E=n(`MbModal`);return r(),_(`div`,K,[f(`header`,null,[f(`h1`,null,`Welcome back, `+m(b.firstName)+`!`,1)]),f(`section`,q,[e(C,null,{default:a(()=>[f(`div`,{class:u([`card`,{dark:p.dark}])},[b.locallyChangedFiles.length>0?(r(),_(`p`,J,m(b.locallyChangedFiles.length),1)):(r(),d(x,{key:1,icon:`check`})),f(`p`,Y,m(b.locallyChangedFiles.length===1?`Local change`:b.locallyChangedFiles.length===0?`Everything is in sync`:`Local changes`),1),e(S,{dark:p.dark,type:`primary`,onClick:c[0]||=e=>s.$emit(`push`)},{default:a(()=>[i(m(b.locallyChangedFiles.length===0?`Check for Updates`:`Synchronise`),1)]),_:1},8,[`dark`])],2),(r(!0),_(l,null,t(b.sidebarCards,t=>(r(),_(`div`,{class:u([`card`,{dark:p.dark}]),key:t.label},[e(x,{icon:t.icon||(t.target.name===`Project.Collection`?`folder`:`document`)},null,8,[`icon`]),f(`p`,X,m(t.label),1),t.target.name===`Edit Content`?(r(),d(S,{key:0,dark:p.dark,onClick:e=>s.$router.push({name:`Edit Content`,params:{...t.target.params,path:`${b.projectDir}${t.target.params.path}`}})},{default:a(()=>[...c[4]||=[i(`Edit`,-1)]]),_:1},8,[`dark`,`onClick`])):(r(),d(S,{key:1,dark:p.dark,onClick:e=>s.$router.push(t.target)},{default:a(()=>[...c[5]||=[i(`Open`,-1)]]),_:1},8,[`dark`,`onClick`]))],2))),128))]),_:1})]),f(`section`,Z,[c[6]||=f(`h2`,null,`News and Announcements`,-1),e(y,{mode:`out-in`},{default:a(()=>[g.newsLoading?(r(),d(w,{key:0})):(r(),_(`div`,Q,[(r(!0),_(l,null,t(b.sortedNews,(e,t)=>(r(),_(`section`,{class:u([`news-section`,[e.type,{dark:p.dark}]]),key:t},[e.type===`changelog`?(r(),_(l,{key:0},[f(`p`,null,[i(`You’re running version `+m(b.changelog.version)+` of Mattrbld. `,1),f(`a`,{href:`#`,onClick:c[1]||=v((...e)=>b.openChangelog&&b.openChangelog(...e),[`prevent`])},`See what’s new`)]),f(`footer`,null,[f(`span`,null,m(e.author)+`, `+m(e.formattedDate),1)])],64)):(r(),_(l,{key:1},[e.title?(r(),_(`h3`,ne,m(e.title),1)):o(``,!0),f(`p`,null,[i(m(e.blurb)+` `,1),e.renderedContent?(r(),_(`a`,{key:0,href:`#`,onClick:v(t=>{g.activeNews=e,g.showDetails=!0},[`prevent`])},`Read more`,8,re)):o(``,!0)]),f(`footer`,null,[f(`span`,null,m(e.author)+`, `+m(e.formattedDate),1)])],64))],2))),128))]))]),_:1})]),f(`section`,ie,[c[7]||=f(`h2`,null,`Recent Updates`,-1),e(y,{mode:`out-in`},{default:a(()=>[g.logLoading?(r(),d(w,{key:0})):(r(),_(`ul`,ae,[(r(!0),_(l,null,t(g.log,(t,n)=>(r(),_(`li`,{class:u({dark:p.dark}),key:n},[e(T,{src:t.author.avatar},null,8,[`src`]),f(`span`,oe,m(t.message),1),f(`span`,null,m(t.author.name)+`, `+m(t.formattedDate),1)],2))),128))]))]),_:1})]),f(`section`,$,[c[8]||=f(`h2`,null,`Local Changes`,-1),f(`ul`,null,[(r(!0),_(l,null,t(b.locallyChangedFiles,(e,t)=>(r(),_(`li`,{class:u([`change-indicator`,{dark:p.dark}]),key:t},[f(`span`,se,m(e.replace(`${b.projectDir}/`,``)),1)],2))),128)),b.locallyChangedFiles.length===0?(r(),_(`li`,{key:0,class:u([`empty-state`,{dark:p.dark}])},`Your local changes will appear here once you edit some content`,2)):o(``,!0)])]),e(E,{class:`details-modal`,dark:p.dark,title:g.activeNews.type===`changelog`?`Changelog`:g.activeNews.title,visible:g.showDetails,onClose:c[3]||=e=>g.showDetails=!1},{actions:a(()=>[e(S,{dark:p.dark,onClick:c[2]||=e=>g.showDetails=!1},{default:a(()=>[...c[9]||=[i(`Close`,-1)]]),_:1},8,[`dark`])]),default:a(()=>[f(`article`,{innerHTML:g.activeNews.type===`changelog`?g.renderedChangelog:g.activeNews.renderedContent},null,8,ce)]),_:1},8,[`dark`,`title`,`visible`])])}var ue=c(te,[[`render`,le],[`__scopeId`,`data-v-12966b98`]]);export{ue as default};