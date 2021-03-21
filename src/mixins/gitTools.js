import TimeoutError from '../assets/js/TimeoutError';
import GitLoginModal from '../components/utility/GitLoginModal.vue';

export default {
  components: {
    GitLoginModal,
  },
  computed: {
    cloneLabel() {
      if (!this.cloneStep) return 'Initialising';
      if (this.cloneStep === 'done') return 'Done';
      if (this.cloneStep === 'checking configuration') return 'Checking Configuration';
      return `${this.cloneStep[0].toUpperCase()}${this.cloneStep.slice(1)}: ${(this.cloneProgress * 100).toFixed(2)}%`;
    },
  },
  data() {
    return {
      cloneProgress: 0,
      cloneStep: '',
      credentialPromise: null,
      credentials: null,
      gitLoginMessage: `This repository seems to be private. Please log into your <strong>${this.gitProvider}</strong> account to confirm that you may perform this action.`,
      showGitLoginModal: false,
    };
  },
  methods: {
    getDefaultBranch(branches) {
      // TODO: find a way to extract the default branch? → Could be done by fetching the repo first, but might be expensive bandwidth wise
      if (branches.includes('main')) return 'main';
      if (branches.includes('master')) return 'master';
      return branches[0];
    },
    handleGitError(err) {
      if (err.code === 'UserCanceledError') {
        this.credentials = null;
        this.errors.repoURL = 'You might not have access to this repository';
      } else if (err.code === 'HttpError' && err.data && err.data.statusCode === 404) { // there might also be a 403 error if we have read- but not write-access, but that only matters if we have forPush active
        this.errors.repoURL = 'This repository doesn’t seem to exist';
      } else if (err instanceof TimeoutError || (err.name === 'TypeError' && err.message === 'Failed to fetch')) { // This is probably not the best way to catch these errors, but there’s hardly any information in that object
        this.errors.repoURL = 'This repository doesn’t exist or is refusing connections';
        this.$store.commit('addToast', { message: 'Could not fetch the repository, please check your network connection and the proxy server settings under ‘Advanced Settings’', type: 'error' });
      } else {
        this.$store.commit('addToast', { message: `Something went wrong while fetching branches: ${err.message}`, type: 'error' });
      }
    },
    async onGitAuth() {
      if (this.credentials && this.credentials.user && this.credentials.password) return { username: this.credentials.user, password: this.credentials.password };
      if (this.$store.state.user.gitAuth) {
        const { user, password } = this.$store.state.user.gitAuth;
        return { username: user, password };
      }
      this.gitLoginMessage = `This repository seems to be private. Please log into your <strong>${this.gitProvider || 'Git'}</strong> account to confirm that you may perform this action.`;
      this.credentials = await this.openGitLoginModal();
      this.showGitLoginModal = false;
      if (this.credentials === 'cancel') return { cancel: true };
      return { username: this.credentials.user, password: this.credentials.password };
    },
    async onGitAuthFailure() {
      if (this.$store.state.user.gitAuth) this.$store.commit('setUserProperty', { key: 'gitAuth', value: null });
      this.gitLoginMessage = 'Sorry, that didn’t work. This might mean that you don’t have access to this repository, or that you typed the wrong username / password combination. Please try again.';
      this.credentials = await this.openGitLoginModal();
      this.showGitLoginModal = false;

      if (this.credentials === 'cancel') return { cancel: true };
      return { username: this.credentials.user, password: this.credentials.password };
    },
    async onGitAuthSuccess() {
      if (this.credentials.savePassword) {
        // WARNING: This might be insecure considering XSS attacks (then again, if there’s a XSS, we probably are screwed anyway)
        this.$store.commit('setUserProperty', { key: 'gitAuth', value: { password: this.credentials.password, user: this.credentials.user } });
      }
    },
    async onGitProgress(progress) {
      this.cloneStep = progress.phase;
      if (progress.total) this.cloneProgress = progress.loaded / progress.total;
      else this.cloneProgress = 0;
    },
    openGitLoginModal() {
      this.showGitLoginModal = true;
      return new Promise((resolve) => { this.credentialPromise = resolve; });
    },
  },
};
