<template>
  <q-tab
    :label="label"
    :name="targetId"
    no-caps
    class="text-weight-medium"
  />
</template>

<script setup>
const props = defineProps({
  label: String,
  targetId: String,
});
</script>
