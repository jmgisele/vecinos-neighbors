<template lang="html">
  <button class="user-switcher" :class="{dark}" @click="activatePopover">
    <span v-if="!isMobile" class="name">{{activeUser.name}}</span>
    <img draggable="false" :src="activeUser.avatar" :alt="`${activeUser.name}’s Avatar`">
    <MbPopover class="user-popover" :dark="dark" from-right no-content-padding :visible="popover.show" :x="popover.x" :y="popover.y" @close="popover.show = false">
      <div class="users">
        <div v-for="user in users" class="user" :class="{ active: currentActiveUser === user.id }" :key="user.id" tabindex="0" @click="setActiveUser(user.id)" @keyup.enter="setActiveUser(user.id)" @keyup.space="setActiveUser(user.id)">
          <img :src="user.avatar" :alt="`${user.name}’s avatar`">
          <span v-if="!isMobile">{{user.name}}</span>
          <span v-else>{{user.name.split(' ')[0]}}</span>
          <span class="email">({{user.email}})</span>
        </div>
      </div>
      <template #footer>
        <MbButton :dark="dark" icon="settings">{{ isMobile ? 'Settings' : 'User Settings' }}</MbButton>
        <MbButton :dark="dark" icon="plus" type="positive">{{ isMobile ? 'Add' : 'Add User' }}</MbButton>
      </template>
    </MbPopover>
    <!-- Todo: add user settings modal & add user modal -->
  </button>
</template>

<script>
import fs from '../../fs';

export default {
  beforeUnmount() {
    this.users.forEach((user) => {
      URL.revokeObjectURL(user.avatar);
    });
  },
  computed: {
    currentActiveUser() {
      return this.$store.state.application.activeUser;
    },
    isMobile() {
      return this.$store.state.application.mobile;
    },
  },
  created() {
    if (this.currentActiveUser) {
      this.fetchActiveUser();
      this.fetchUsers();
    }
  },
  data() {
    return {
      activeUser: {
        avatar: null,
        email: '',
        id: null,
        name: '',
      },
      popover: {
        show: false,
        x: 0,
        y: 0,
      },
      users: [],
    };
  },
  methods: {
    async activatePopover() {
      const elRect = this.$el.getBoundingClientRect();
      this.popover.x = elRect.right;
      this.popover.y = elRect.top;
      if (this.users.length === 0) await this.fetchUsers();
      this.popover.show = true;
    },
    async fetchActiveUser() {
      const activeUserAvatarData = await fs.readFile(`/users/${this.$store.state.application.activeUser}.jpg`);
      this.activeUser.avatar = URL.createObjectURL(new Blob([activeUserAvatarData], { type: 'image/jpeg' }));
      this.activeUser.email = this.$store.state.user.email;
      this.activeUser.name = this.$store.state.user.name;
      this.activeUser.id = this.currentActiveUser;
    },
    async fetchUsers() {
      try {
        const users = await fs.readdir('/users');
        const userIds = [];
        const userPromises = [];
        const avatarPromises = [];

        users.forEach((userFile) => {
          if (userFile.endsWith('.json')) {
            userPromises.push(fs.readFile(`/users/${userFile}`, 'utf8'));
            userIds.push(userFile.slice(0, -5)); // without .json
          }
          if (userFile.endsWith('.jpg')) avatarPromises.push(fs.readFile(`/users/${userFile}`));
        });

        const userJsonStrings = await Promise.all(userPromises);
        const avatarData = await Promise.all(avatarPromises);

        const userData = userJsonStrings.map((json) => JSON.parse(json));

        this.users = userData.map((user, index) => {
          const id = userIds[index];
          let avatar;

          if (id === this.currentActiveUser) avatar = this.activeUser.avatar;
          else avatar = URL.createObjectURL(new Blob([avatarData[index]], { type: 'image/jpeg' }));
          return { ...user, id, avatar };
        });
      } catch (err) {
        this.$store.commit('addToast', { message: `Something went wrong while fetching all users: ${err.message}`, type: 'error' });
      }
    },
    setActiveUser(id) {
      if (id === this.currentActiveUsert) return;
      const user = this.users.find((existingUser) => existingUser.id === id);
      const userData = {
        ...user,
        gitAuth: null,
        theme: user.theme || 'auto',
      };
      this.$store.commit('setUserData', userData);
      this.$store.commit('setAppProperty', { key: 'activeUser', value: id });
      this.$store.dispatch('saveAppData');
    },
  },
  props: {
    dark: Boolean,
  },
  watch: {
    currentActiveUser(nv) {
      if (nv) this.fetchActiveUser();
    },
  },
};
</script>

<style lang="stylus" scoped>
@require '../../assets/styles/breakpoints'
@require '../../assets/styles/colors'
@require '../../assets/styles/corners'

.user-switcher
  user-select: none
  background-color: transparent
  color: currentColor
  border: none
  padding: 0
  margin: 0
  display: inline-flex
  align-items: center
  cursor: pointer
  padding: (2 / 16)rem
  padding-left: 1.5rem
  border-radius: (26 / 16)rem
  transition: background-color 200ms ease

  @media $mobile
    padding: 0

  &:hover,
  &:focus
    background-color: $bg-secondary

    &.dark
      background-color: $bg-secondary-dark

  span
    text-transform: capitalize
    margin-right: 1rem

  img
    display: block
    width: (48 / 16)rem
    height: @width
    border-radius: 50%
    background-color: $accent-secondary

.user-popover
  &.dark
    .users .user
      &:hover,
      &:focus
        background-color: $bg-tertiary-dark

        &.active
          color: $text-dark

          .email
            color: $text-secondary-dark

      .email
        color: $text-secondary-dark

  .users
    padding: 0.5rem
    max-width: 100%
    width: (488 / 16)rem

    .user
      display: flex
      align-items: center
      padding: 1rem
      cursor: pointer
      border-radius: $radius-m
      transition: background-color 200ms ease

      &:not(:last-child)
        margin-bottom: 0.5rem

      &.active
        background-color: $accent
        color: $text-dark

        img
          box-shadow: 0 0 0 2px $text-dark

        .email
          color: $text-secondary-dark

      &:hover,
      &:focus
        background-color: $bg-secondary
        color: $text

        &.active
          box-shadow: inset 0 0 0 (2 / 16)rem $accent

          .email
            color: $text-secondary

      img
        display: block
        width: 2rem
        height: @width
        margin-right: 1rem
        border-radius: 50%

      span
        text-transform: capitalize
        text-overflow: ellipsis
        overflow: hidden
        white-space: nowrap
        margin-right: 1rem

        @media $mobile
          &:not(.email)
            flex-shrink: 0

        &.email
          text-transform: none
          color: $text-secondary
          margin-left: auto
          margin-right: 0
</style>
