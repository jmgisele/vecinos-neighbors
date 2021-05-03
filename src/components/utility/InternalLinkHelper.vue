<template lang="html">
  <div class="internal-link-helper">
    <transition mode="out-in">
      <div v-if="view === 'collection'" class="view collection" key="collection">
        <ul>
          <li v-for="collection in linkableCollections" :key="collection.value" @click="handleCollectionClick(collection.value)">
            <MbIcon icon="folder" />
            <span>{{collection.label}}</span>
          </li>
        </ul>
      </div>
      <div v-else-if="view === 'files'" class="view files" key="files">
        <MbFileList :dark="dark"  :empty-state="{ noFiles: 'There are no content elements in this directory', noFolders: 'There are no folders in this directory', empty: 'There are no content elements in this collection' }" file-list-label="Content elements" :filetypes="['json']" pretty-filenames :root="currentRoot" :sortable="false" @fileclick="handleFileClick" />
      </div>
      <div v-else-if="view === 'url'" class="view url" key="url">
        <span>{{modelValue}}</span>
        <MbButton :dark="dark" icon="replace-alt" tooltip="Change link" @click="view = 'collection'" />
      </div>
      <div v-else class="loading" key="loading">
        <MbLoader />
      </div>
    </transition>
  </div>
</template>

<script>
import slugify from '@sindresorhus/slugify';
import { get } from 'lodash-es';
import { isValid } from 'date-fns';
import fs, { pathDirname } from '../../fs';

import prettifyEntityName from '../../assets/js/prettifyEntityName';

export default {
  async created() {
    if (this.modelValue) this.view = 'url'; // if we have a value already, we can just show it
    try {
      const collectionFiles = await fs.readdir(this.collectionsPath);
      const collectionStrings = await Promise.all(collectionFiles.map((file) => fs.readFile(`${this.collectionsPath}/${file}`, 'utf8')));
      const collections = collectionStrings.map((collection) => collection && JSON.parse(collection)).filter((collection) => typeof collection !== 'undefined');
      this.linkableCollections = collections.reduce((acc, collection, index) => {
        if (collection.linkable) acc.push({ label: prettifyEntityName(collectionFiles[index]), value: collection.dir });
        return acc;
      }, []);
      if (!this.modelValue) this.view = 'collection';
    } catch (err) {
      this.$store.commit('addToast', { message: `Somethin went wrong while fetching all linkable collections: ${err.message}`, type: 'error' });
    }
  },
  data() {
    return {
      currentRoot: '/',
      linkableCollections: [],
      view: null,
    };
  },
  emits: ['update:modelValue'],
  methods: {
    handleCollectionClick(dir) {
      this.currentRoot = dir;
      this.view = 'files';
    },
    async handleFileClick(path) {
      let newUrl;
      if (this.useFilePath || !this.urlTemplate) {
        const pathWithoutExtension = path.substring(0, path.lastIndexOf('.')); // we know there’s a .json at the end that we want to strip off, and since in the future we might also have .md or .yml / .yaml, let’s use this more ambiguous approach
        const fileRoot = pathDirname(this.currentRoot);
        newUrl = pathWithoutExtension.replace(fileRoot, '');
        if (typeof this.urlSuffix !== 'undefined') newUrl = `${pathWithoutExtension.replace(fileRoot, '')}${this.urlSuffix}`;
      } else {
        try {
          const fields = JSON.parse(await fs.readFile(path, 'utf8'));
          const hasParameters = /\[(year|month|day)\]/;
          newUrl = this.urlTemplate.replace(
            /:((?:\w|\.)+\[(?:year|month|day|[0-9])\]|(?:\w|\.)+)/g, // this regex matches any word, dot, or parameter in [] between : and a non-word character. It could probably be made more DRY, but I don’t know how
            (match, fieldKey) => { // passing replacer functions to string.replace is a powerful thing
              if (hasParameters.test(fieldKey)) { // we’re trying to get something out of a date
                const [rawKey, parameterWithBracket] = fieldKey.split('[');
                const parameter = parameterWithBracket.slice(0, -1);
                const value = get(fields, rawKey);
                const potentialDate = new Date(value); // if value is not a valid date, it’s not our problem
                if (isValid(potentialDate)) {
                  if (parameter === 'day') return String(potentialDate.getDate()).padStart(2, '0');
                  if (parameter === 'month') return String(potentialDate.getMonth() + 1).padStart(2, '0'); // months are zero-based
                  if (parameter === 'year') return String(potentialDate.getFullYear());
                }
                return 'invalid-date';
              }

              const value = get(fields, fieldKey);

              if (typeof value === 'object' && !Array.isArray(value)) { // it might be a localised field
                if (!this.lang) return 'undefined';
                const localisedValue = value[this.lang];
                if (localisedValue) return slugify(String(localisedValue), this.$store.state.currentProject.slugifyOptions || { lowercase: true, decamelize: true, preserveLeadingUnderscore: true });
                return 'undefined';
              }
              return slugify(String(value), this.$store.state.currentProject.slugifyOptions || { lowercase: true, decamelize: true, preserveLeadingUnderscore: true });
            },
          );
        } catch (err) {
          if (err.name === 'SyntaxError') {
            this.$store.commit('addToast', { message: 'The file you selected is not a valid JSON file', type: 'error' });
            return;
          }
          this.$store.commit('addToast', { message: `Something went wrong while reading the selected file: ${err.message}`, type: 'error' });
          return;
        }
      }
      this.$emit('update:modelValue', newUrl);
      this.view = 'url';
    },
  },
  props: {
    collectionsPath: {
      type: String,
      required: true,
    },
    dark: Boolean,
    lang: String,
    modelValue: String,
    urlSuffix: String,
    urlTemplate: String,
    useFilePath: Boolean,
  },
};
</script>

<style lang="stylus" scoped>
</style>
