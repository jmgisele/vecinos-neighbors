<template lang="html">
  <button class="user-switcher" @click="popover.show = true">
    <span class="name">{{activeUser.name}}</span>
    <img :src="activeUser.avatar" :alt="`${activeUser.name}’s Avatar`" @load="freeAvatarURL">
    <MbPopover class="user-popover" :dark="dark" from-right :visible="popover.show" :x="popover.x" :y="popover.y" @close="popover.show = false">
      <p>Hi!</p>
    </MbPopover>
  </button>
</template>

<script>
import fs from '../../fs';

export default {
  async created() {
    const activeUserAvatarData = await fs.readFile(`/users/${this.$store.state.application.activeUser}.jpg`);
    this.activeUser.avatar = URL.createObjectURL(new Blob([activeUserAvatarData], { type: 'image/jpeg' }));
    this.activeUser.name = this.$store.state.user.name;
  },
  data() {
    return {
      activeUser: {
        avatar: null,
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
    freeAvatarURL() {
      URL.revokeObjectURL(this.activeUser.avatar);
    },
  },
  mounted() {
    const elRect = this.$el.getBoundingClientRect();
    this.popover.x = elRect.right;
    this.popover.y = elRect.top;
  },
  props: {
    dark: Boolean,
  },
};
</script>

<style lang="stylus" scoped>
@require '../../assets/styles/colors'

.user-switcher
  background-color: transparent
  border: none
  padding: 0
  margin: 0
  display: inline-flex
  align-items: center
  cursor: pointer

  span
    text-transform: capitalize
    margin-right: 1rem

  img
    display: block
    width: (48 / 16)rem
    height: @width
    border-radius: 50%

.user-popover p
  width: 100%
</style>
