<template lang="html">
  <div class="table table-wrapper">
    <table>
      <thead>
        <tr>
          <th v-for="(header, index) in headers" :key="index">{{header}}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, index) in data" :key="index">
          <td v-for="(value, key) in row" :key="key">
            <code v-if="value.toString().startsWith('`') && value.toString().endsWith('`')">{{value.toString().substring(1, value.length - 1)}}</code>
            <em v-else-if="value.toString().startsWith('*') && value.toString().endsWith('*')">{{value.toString().substring(1, value.length - 1)}}</em>
            <strong v-else-if="value.toString().startsWith('**') && value.toString().endsWith('**')">{{value.toString().substring(2, value.length - 2)}}</strong>
            <template v-else>{{value}}</template>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
export default {
  computed: {
    headers() {
      return Object.keys(this.data[0]);
    },
  },
  props: {
    data: Array,
  },
};
</script>

<style lang="stylus" scoped>
</style>
