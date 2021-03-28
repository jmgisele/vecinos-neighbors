<template lang="html">
  <TabContent class="user-settings" :class="{ dark }" :dark="dark">
    <section class="wrapper wide">
      <h1 class="h2">Users</h1>
      <header>
        <MbInput v-model="userFilter" :dark="dark" icon="search" placeholder="Filter users" />
        <MbButton :dark="dark" icon="plus" type="positive" @click="handleInvite">Invite User</MbButton>
      </header>
      <ul>
        <li v-for="(user, index) in filteredUsers" :key="index" tabindex="0" @click="handleUserClick($event, user.id)" @kedown.space.prevent @keyup.space.enter="handleUserClick($event, user.id)">
          <AsyncImage :src="user.avatar" />
          <span v-show="user.localChanges" class="local-changes-indicator"/>
          <span>{{user.details.name}}</span>
          <span class="email">{{user.details.email}}</span>
          <MbSelect :dark="dark" :model-value="user.details.role" :options="availableRoles" @update:model-value="handleRoleChange(user.id, $event)" />
        </li>
      </ul>
    </section>
    <section class="wrapper">
      <MbHighlightBox color="negative" :dark="dark">
        <p>The user’s role and the privileges that come with each role are <strong>only enforced on the client</strong>. This means that the might be circumvented by tampering with the code (the client can’t be trusted).</p>
        <p>Make sure to not rely on these settings as your only security and configure your server-side Git-environment to reflect these permissions as closely as possible. This also means making sure that users can actually read and write to the branches you use for your content.</p>
      </MbHighlightBox>
    </section>
  </TabContent>
</template>

<script>
import slugify from '@sindresorhus/slugify';

import fs from '../../fs';

// import AvatarUploader from '../../components/utility/AvatarUploader.vue';
import AsyncImage from '../../components/utility/AsyncImage.vue';
import TabContent from '../../components/utility/TabContent.vue';

import availableRoles from '../../data/availableRoles';
import generateAvatar from '../../assets/js/generateAvatar';

export default {
  beforeUnmount() {
    this.users.forEach((user) => {
      if (user.avatar.startsWith('blob:')) URL.revokeObjectURL(user.avatar);
    });
  },
  components: {
    // AvatarUploader,
    AsyncImage,
    TabContent,
  },
  computed: {
    currentProject() {
      return this.$store.state.currentProject;
    },
    filteredUsers() {
      if (!this.userFilter) return this.users;
      return this.users.filter((user) => user.details.name.includes(this.userFilter) || user.details.email.includes(this.userFilter));
    },
  },
  created() {
    this.users = this.currentProject.users.map((user) => ({ details: user }));
    this.users.forEach((user) => {
      user.id = slugify(user.details.email); // eslint-disable-line no-param-reassign
      if (this.$store.getters.hasLocalChanges(`/projects/${this.currentProject.id}/.mattrbld/users/${slugify(user.details.email).json}`)) user.localChanges = true; // eslint-disable-line no-param-reassign
    });
    this.fetchUserAvatars();
  },
  data() {
    return {
      availableRoles,
      errors: {
        name: null,
        email: null,
      },
      users: [],
      userFilter: '',
    };
  },
  methods: {
    async fetchUserAvatars() {
      const usersPath = `/projects/${this.currentProject.id}/.mattrbld/users`;
      const [avatarFiles, localAvatars] = await Promise.all([fs.readdir(usersPath), fs.readdir('/users')]);

      const avatarPromises = this.users.reduce((acc, user) => {
        const { id } = user;

        if (avatarFiles.includes(`${id}.jpg`)) acc.push(fs.readFile(`${usersPath}/${id}.jpg`));
        else if (localAvatars.includes(`${id}.jpg`)) acc.push(fs.readFile(`/users/${id}.jpg`));
        else {
          const split = user.details.name.split(' ');
          const initials = `${split[0][0]}${split[split.length - 1][0]}`.toUpperCase();
          acc.push(new Promise((res) => res(generateAvatar(initials, '#A29BFE', '#6c5ce7', 'light', this.newUserData.email))));
        }

        return acc;
      }, []);

      const avatars = await Promise.all(avatarPromises);
      avatars.forEach((avatar, index) => {
        if (typeof avatar !== 'string') this.users[index].avatar = URL.createObjectURL(new Blob([avatar]), { type: 'image/jpeg' });
        else this.users[index].avatar = avatar;
      });
    },
    handleInvite() {},
    handleRoleChange(id, newRole) {
      console.log(id, newRole);
    },
    handleUserClick(event, id) {
      if (!event.target.classList.contains('button')) console.log(id);
    },
  },
  props: {
    dark: Boolean,
  },
};
</script>

<style lang="stylus" scoped>
@require '../../assets/styles/breakpoints'
@require '../../assets/styles/colors'
@require '../../assets/styles/corners'

.user-settings
  user-select: none;

  &.dark
    .wrapper.wide ul li
      background-color: $bg-secondary-dark

      &:hover
        background-color: $bg-tertiary-dark

      &:active
        background-color: $bg-dark

      span.email
        color: $text-secondary-dark

  .wrapper
    max-width: 40rem
    margin-left: auto
    margin-right: auto

    &.wide
      max-width: (960 / 16)rem
      margin-bottom: 8rem

      header
        display: flex
        margin-bottom: 2rem

        .input
          margin: 0
          margin-right: 1rem
          max-width: 30rem

        .button
          margin-left: auto

      ul
        list-style: none
        margin: 0

        li
          position: relative
          background-color: $bg-secondary
          padding: 0.5rem
          padding-left: 1rem
          border-radius: $radius-m
          display: flex
          align-items: center
          cursor: pointer
          transition: background-color 200ms ease

          &:hover
            background-color: $bg-tertiary

          &:not(:last-child)
            margin-bottom: 1rem

          &:focus,
          &:active
            &::before
              opacity: 1

          &:active
            transform: translateY(0.125rem)
            background-color: $bg

          &::before
            content: ''
            position: absolute
            top: 0px
            left: @top
            right: @top
            bottom: @top
            border: 2px solid $accent
            opacity: 0
            border-radius: $radius-m
            z-index: 1
            pointer-events: none
            transition: opacity 200ms ease

          .local-changes-indicator
            width: 0.5rem
            height: @width
            border-radius: 50%
            background-color: $warning-saturated
            display: inline-block
            margin-right: 0.5rem

          .icon:not(.button)
            margin-right: 1rem
            flex-shrink: 0

          .async-image
            width: 2.5rem
            height: @width
            border-radius: 50%
            margin-right: 1rem

          span
            white-space: nowrap
            text-overflow: ellipsis
            overflow: hidden
            text-transform: capitalize
            margin-right: 2rem

            &.email
              text-transform: none
              color: $text-secondary

          ::v-deep(.select)
            margin-left: auto

    .input
      width: 100%
      margin-bottom: 2rem

      & + h2
        margin-top: 1rem
</style>
