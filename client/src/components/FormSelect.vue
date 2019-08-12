<!-- Copyright Serotonin Software 2019 -->
<template>
  <div class="form-component">
    <label v-if="label">{{ label }}<span class="required" v-if=required>*</span></label>
    <select :id="id" v-model="selectVal">
      <option v-for="opt in options" :key="opt.value" :value="opt.value" :selected="opt.value === selectVal">
        {{ opt.label || opt.value }}
      </option>
    </select>
    <div v-if="hint" class="hint">{{ hint }}</div>
    <div v-if="errorMsg" class="error-message">{{ errorMsg }}</div>
  </div>
</template>

<script>
export default {
  props: {
    label: String,
    required: Boolean,
    id: String,
    value: String,
    errorMsg: String,
    hint: String,
    options: Array
  },
  data() {
    return {
      selectVal: this.value
    }
  },
  watch: {
    value(val) {
      this.selectVal = val
    },
    selectVal(val) {
      this.$emit('input', val)
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
