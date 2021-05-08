import fs, { joinPath } from '../fs';

export default {
  methods: {
    async updateLocallyChangedFiles(path) {
      const entities = await fs.readdir(path);
      return Promise.all(entities.map((entity) => {
        if (entity.endsWith('.json')) return this.$store.commit('addLocallyChangedFile', joinPath(path, entity));
        return this.updateLocallyChangedFiles(joinPath(path, entity));
      }));
    },
  },
};
