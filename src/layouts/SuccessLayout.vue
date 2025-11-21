<template>
  <q-layout view="lHh Lpr lFf">
    <!-- Cabeçalho minimalista -->
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-toolbar-title class="text-h6"> Pedido Enviado </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <!-- Conteúdo da página -->
    <q-page-container>
      <router-view
        :key="routerViewKey"
        :filtered-products="filteredProducts"
        :search-term="searchTerm"
      />
    </q-page-container>
  </q-layout>
</template>

<script setup>
// Layout simples para páginas de sucesso
</script>

<style scoped>
</style>
