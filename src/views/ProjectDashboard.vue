<template lang="html">
  <div class="project-dashboard">
    <header>
      <h1>Welcome back, {{firstName}}!</h1>
    </header>
    <section class="wrapper cards">
      <MbScroller>
        <div class="card" :class="{ dark }">
          <p v-if="locallyChangedFiles > 0" class="number h1">{{locallyChangedFiles}}</p>
          <MbIcon v-else icon="check" />
          <p class="label">{{locallyChangedFiles === 1 ? 'Local change' : locallyChangedFiles !== 0 ? 'Local changes' : 'Everything is in sync'}}</p>
          <MbButton :dark="dark" type="primary" @click="$emit('push')">{{ locallyChangedFiles !== 0 ? 'Synchronise' : 'Check for Updates'}}</MbButton>
        </div>
        <div v-for="entry in sidebarCards" class="card" :class="{ dark }" :key="entry.label">
          <MbIcon :icon="entry.icon || (entry.target.name === 'Project.Collection' ? 'folder' : 'document')" />
          <p class="label">{{entry.label}}</p>
          <MbButton v-if="entry.target.name === 'Edit Content'" :dark="dark" @click="$router.push({ name: 'Edit Content', params: { ...entry.target.params, path: `${projectDir}${entry.target.params.path}` } })">Edit</MbButton>
          <MbButton v-else :dark="dark" @click="$router.push(entry.target)">Open</MbButton>
        </div>
      </MbScroller>
    </section>
    <section class="wrapper">
      <h2>News and Announcements</h2>
    </section>
    <section class="wrapper commits">
      <h2>Recent Updates</h2>
      <transition mode="out-in">
        <MbLoader v-if="logLoading" />
        <ul v-else>
          <li v-for="(commit, index) in log" :class="{ dark }" :key="index">
            <AsyncImage :src="commit.author.avatar" />
            <span class="message">{{commit.message}}</span>
            <span>{{commit.author.name}}, {{commit.formattedDate}}</span>
          </li>
        </ul>
      </transition>
    </section>
    <section class="wrapper">
      <h2>Local Changes</h2>
    </section>
  </div>
</template>

<script>
import { formatDistanceToNow } from 'date-fns';
import { log } from 'isomorphic-git';
import fs, { joinPath, PlainFS } from '../fs';

import generateAvatar from '../assets/js/generateAvatar';

import AsyncImage from '../components/utility/AsyncImage.vue';

export default {
  beforeUnmount() {
    this.log.forEach((entry) => {
      if (entry.author.avatar && entry.author.avatar.startsWith('blob:')) URL.revokeObjectURL(entry.author.avatar);
    });
  },
  components: {
    AsyncImage,
  },
  computed: {
    firstName() {
      if (!this.$store.getters.userInCurrentProject) return 'Anonymous'; // Dashboard gets unloaded after Project so this is needed to avoid an error
      return this.$store.getters.userInCurrentProject.name.split(' ')[0];
    },
    locallyChangedFiles() {
      return this.$store.state.application.locallyChangedFiles.length;
    },
    projectDir() {
      return `/projects/${this.$store.state.currentProject.id}`;
    },
    sidebarCards() {
      const { sidebar } = this.$store.state.currentProject;
      return sidebar.filter((entry) => entry.showInDashboard && entry.target);
    },
  },
  created() {
    this.fetchLog();
  },
  data() {
    return {
      log: [],
      logLoading: true,
    };
  },
  emits: ['push'],
  methods: {
    async fetchLog() {
      const rawLog = await log({
        fs: PlainFS,
        dir: this.projectDir,
        depth: 10,
      });
      const userIds = new Map();
      const userEmails = []; // needed to assign avatars to emails

      rawLog.forEach((entry) => {
        const { email, name } = entry.commit.author;
        const { id } = this.$store.state.currentProject.users.find((user) => user.email === email);
        userIds.set(email, { id, name });
      });

      const usersPath = joinPath(this.projectDir, '.mattrbld', 'users');
      const [avatarFiles, localAvatars] = await Promise.all([fs.readdir(usersPath), fs.readdir('/users')]);
      const avatarPromises = [];

      userIds.forEach(({ id, name }, email) => {
        if (avatarFiles.includes(`${id}.jpg`)) avatarPromises.push(fs.readFile(`${usersPath}/${id}.jpg`));
        else if (localAvatars.includes(`${id}.jpg`)) avatarPromises.push(fs.readFile(`/users/${id}.jpg`)); // only works if the local user id matches the repo user’s id, which should be the case
        else if (email === this.$store.state.user.email && localAvatars.includes(`${this.$store.state.user.id}.jpg`)) avatarPromises.push(fs.readFile(`/users/${this.$store.state.user.id}.jpg`)); // if not at least we can show the current users local avatar, since we know their local id
        else {
          const split = name.split(' ');
          const initials = `${split[0][0]}${split[split.length - 1][0]}`.toUpperCase();
          avatarPromises.push(generateAvatar(initials, '#A29BFE', '#6c5ce7', 'light', email));
        }
        userEmails.push(email);
      });

      const avatars = await Promise.all(avatarPromises);
      const avatarMap = new Map();
      avatars.forEach((avatar, index) => {
        if (typeof avatar !== 'string') avatarMap.set(userEmails[index], URL.createObjectURL(new Blob([avatar]), { type: 'image/jpeg' }));
        else avatarMap.set(userEmails[index], avatar);
      });

      this.log = rawLog.map((entry) => {
        const { commit } = entry;
        const cleanCommit = {
          message: commit.message.split('\n')[0],
          date: commit.committer.timestamp * 1000,
          formattedDate: formatDistanceToNow(new Date(commit.committer.timestamp * 1000), { addSuffix: true }),
          author: {
            avatar: avatarMap.get(commit.author.email),
            name: commit.author.name,
          },
        };
        return cleanCommit;
      });
      this.logLoading = false;
    },
  },
  props: {
    dark: Boolean,
  },
};
</script>

<style lang="stylus" scoped>
@require '../assets/styles/breakpoints'
@require '../assets/styles/colors'
@require '../assets/styles/corners'

.project-dashboard
  padding: 0 2rem 8rem 2rem
  user-select: none

  @media $mobile
    padding-left: 1rem
    padding-right: 1rem
    padding-bottom: 4rem

  header,
  section.wrapper
    max-width: (1120 / 16)rem
    margin: 0 auto

  header
    margin-bottom: 4rem

    h1
      margin-top: 1.5rem
      line-height: 2.5rem

  section.wrapper
    &:not(:last-child)
      margin-bottom: 8rem

      @media $mobile
        margin-bottom: 4rem

    &.cards
      @media $mobile
        margin-left: -1rem
        margin-right: @margin-left

      .scroller::v-deep(.scroll-area)
        display: flex

        @media $mobile
          padding-left: 1rem
          padding-right: @padding-left

      .card
        min-width: 16rem
        padding: 0.5rem
        border-radius: $radius-l
        border: 0.0625rem solid alpha($text-tertiary, 0.12)
        text-align: center

        &.dark
          border-color: alpha($text-tertiary-dark, 0.12)

        &:not(:last-child)
          margin-right: 1rem

        .number
          margin-top: 3.5rem
          margin-bottom: 0.5rem

        .icon
          margin: 3.5rem auto 0.5rem auto
          width: 3rem
          height: @width

        .label
          margin: 0
          margin-bottom: (56 / 16)rem

        .button
          width: 100%

    &.commits
      .loader,
      ul
        &.v-enter-active,
        &.v-leave-active
          transition: opacity 200ms ease

          &.v-enter-from,
          &.v-leave-to
            opacity: 0

      ul
        list-style:  none
        margin: 0

        li
          display: flex
          align-items: center
          padding: 1rem
          border: 0.0625rem solid alpha($text, 0.12)
          border-radius: $radius-m

          &.dark
            border-color: alpha($text-dark, 0.12)

            span:last-of-type
              color: $text-secondary-dark

          &:not(:last-child)
            margin-bottom: 1rem

          .async-image
            width: 2.5rem
            height: @width
            border-radius: 50%
            margin-right: 1rem

            @media $mobile
              width: 1.5rem
              height: @width

          span
            white-space: nowrap
            flex-shrink: 0
            text-overflow: ellipsis
            overflow: hidden

            &.message
              flex-shrink: 1
              margin-right: auto

            &:last-of-type
              color: $text-secondary
              font-size: (14 / 16)rem
              margin-left: 1rem

              @media $mobile
                display: none
</style>
