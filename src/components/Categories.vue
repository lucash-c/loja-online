<template>
  <q-item clickable @click="$emit('click')">
    <q-item-section avatar>
      <q-icon :name="icon || 'label'" color="primary" size="24px" />
    </q-item-section>

    <q-item-section>
      <q-item-label class="text-weight-medium">{{ title }}</q-item-label>
    </q-item-section>
  </q-item>
</template>

<script setup>
defineOptions({ name: "Categories" });

defineProps({
  title: { type: String, required: true },
  icon: { type: String, default: "label" },
});
</script>

<style scoped>
.q-item {
  border-radius: 10px;
  margin: 6px 10px;
  transition: background 0.25s ease;
}
.q-item:hover {
  background: rgba(25, 118, 210, 0.08);
}
.q-icon {
  margin-right: 6px;
}
</style>
