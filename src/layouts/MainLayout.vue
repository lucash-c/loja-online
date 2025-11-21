<template>
  <q-layout view="hHh lpR FfF">
    <!-- Cabeçalho -->
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <!-- Botão menu (visível apenas no mobile) -->
        <q-btn
          v-if="isMobile"
          flat
          dense
          round
          icon="menu"
          @click="toggleLeftDrawer"
          class="q-mr-sm"
        />

        <!-- Logo -->
        <q-img
          v-if="logoSrc"
          :key="logoSrc"
          :src="logoSrc"
          alt="logo"
          class="logo"
        />

        <!-- Nome da loja e status -->
        <div
          v-if="loja"
          class="q-ml-sm text-white flex flex-column justify-center"
        >
          <div class="text-h6">{{ loja.nome }}</div>
          <div
            :class="[
              'text-subtitle2 q-ml-sm',
              loja.status === 'aberto' ? 'text-positive' : 'text-negative',
            ]"
          >
            {{ loja.status === "aberto" ? "Aberto" : "Fechado" }}
          </div>
        </div>

        <q-space />

        <!-- Tabs de categorias (desktop apenas) -->
        <q-tabs
          v-if="!isSearching && !isMobile"
          v-model="activeTab"
          align="center"
          dense
        >
          <ScrollTab
            v-for="(items, category) in productStore.groupedProducts"
            :key="category"
            :label="category"
            :target-id="normalizeId(category)"
            @click="scrollToCategory(normalizeId(category))"
          />
        </q-tabs>

        <q-space />

        <!-- Busca -->
        <q-input
          dense
          standout="bg-secondary text-primary"
          debounce="300"
          v-model="searchTerm"
          placeholder="Buscar produto..."
          class="q-mr-sm"
          style="max-width: 250px"
          @update:model-value="emitSearch"
        >
          <template #append>
            <q-icon name="search" />
          </template>
        </q-input>
      </q-toolbar>
    </q-header>

    <!-- Drawer lateral (menu mobile) -->
    <q-drawer
      v-model="leftDrawerOpen"
      :width="$q.screen.width"
      behavior="mobile"
      overlay
      bordered
      class="bg-white"
    >
      <q-toolbar class="bg-primary text-white">
        <q-toolbar-title>Categorias</q-toolbar-title>
        <q-btn dense flat round icon="close" @click="leftDrawerOpen = false" />
      </q-toolbar>

      <q-scroll-area style="height: calc(100% - 50px)">
        <q-list padding>
          <Categories
            v-for="(items, category) in productStore.groupedProducts"
            :key="category"
            :title="category"
            icon="label"
            @click="handleCategoryClick(category)"
          />
        </q-list>
      </q-scroll-area>
    </q-drawer>

    <!-- Conteúdo principal -->
    <q-page-container>
      <router-view
        :key="routerViewKey"
        :filtered-products="filteredProducts"
        :search-term="searchTerm"
      />
      <div style="height: 200px" />
    </q-page-container>

    <!-- Rodapé -->
    <div class="footer bg-grey-8 text-white q-pa-md text-center">
      &copy; {{ new Date().getFullYear() }} Todos os direitos reservados.
    </div>
  </q-layout>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, onBeforeUnmount } from "vue";
import { useQuasar, LocalStorage } from "quasar";
import { useProductStore } from "src/store/products";
import { useRouter } from "vue-router";
import ScrollTab from "src/components/ScrollTab.vue";
import Categories from "src/components/Categories.vue";
import { normalizeId } from "src/utils/normalizeId";
import { getImageSrc } from "src/utils/image";

defineOptions({ name: "MainLayout" });

const $q = useQuasar();
const router = useRouter();
const productStore = useProductStore();

const activeTab = ref("");
const leftDrawerOpen = ref(false);
const searchTerm = ref("");
const isScrollingProgrammatically = ref(false);
const observers = [];
const routerViewKey = ref(0);
const loja = ref(null);

// Responsividade
const isMobile = computed(() => $q.screen.lt.md);

// Logo da loja
const logoSrc = computed(() => {
  return loja.value?.logo ? getImageSrc(loja.value.logo) : null;
});

// Carregar loja e produtos
onMounted(() => {
  const lojaStr = LocalStorage.getItem("loja");
  if (lojaStr) {
    try {
      loja.value = JSON.parse(lojaStr);
      console.log("Loja carregada:", loja.value);
    } catch (err) {
      console.error("Erro ao parsear loja:", err);
      loja.value = null;
    }
  }

  document.title = loja.value.nome || "Pedido Online";

  productStore.loadProducts().then(() => {
    nextTick(() => {
      const firstCategory = Object.keys(productStore.groupedProducts)[0];
      if (firstCategory) activeTab.value = normalizeId(firstCategory);
      watchScroll();
    });
  });
});

const isSearching = computed(() => searchTerm.value.trim().length > 0);

const filteredProducts = computed(() => {
  const term = searchTerm.value.toLowerCase().trim();
  if (!term) return [];
  return productStore.products.filter((p) =>
    p.nome.toLowerCase().includes(term)
  );
});

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

function emitSearch() {
  router.replace({ query: { search: searchTerm.value } });
}

/**
 * handleCategoryClick:
 * - Fecha o drawer primeiro (remove bloqueio de scroll do Quasar)
 * - Em seguida, no nextTick + pequeno timeout, faz o scroll suave
 */
function handleCategoryClick(category) {
  const targetId = normalizeId(category);

  // Fecha o drawer primeiro
  leftDrawerOpen.value = false;

  // Depois que o drawer fechou e o DOM estabilizar, rola a página
  nextTick(() => {
    // pequeno atraso para garantir que o lock de scroll foi removido
    setTimeout(() => {
      scrollToCategory(targetId);
    }, 80); // 80ms funciona bem; se quiser ajustar, experimente 50-200ms
  });
}

function watchScroll() {
  const categories = Object.keys(productStore.groupedProducts);
  categories.forEach((category) => {
    const el = document.getElementById(normalizeId(category));
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isScrollingProgrammatically.value) {
            activeTab.value = normalizeId(category);
          }
        });
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0.1 }
    );

    observer.observe(el);
    observers.push(observer);
  });
}

function cleanupObservers() {
  observers.forEach((o) => o.disconnect());
}

function scrollToCategory(targetId) {
  const el = document.getElementById(targetId);
  if (el) {
    isScrollingProgrammatically.value = true;
    const offset = el.getBoundingClientRect().top + window.pageYOffset - 80;
    window.scrollTo({ top: offset, behavior: "smooth" });
    setTimeout(() => (isScrollingProgrammatically.value = false), 600);
  }
}

onBeforeUnmount(cleanupObservers);
</script>

<style scoped>
.logo {
  height: 60px;
  min-width: 60px;
  width: auto;
}
.logo:hover {
  transform: scale(1.05);
}
.q-tab--active {
  background: #e3f2fd;
  color: #1976d2;
  border-radius: 8px;
  transition: background 0.3s ease;
  text-decoration: none !important;
}
.footer {
  font-size: 14px;
}
</style>
