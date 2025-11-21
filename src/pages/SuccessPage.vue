<template>
  <q-page class="flex flex-center bg-green-1">
    <div class="text-center">
      <q-icon name="check_circle" size="100px" color="green" />
      <div class="text-h4 text-bold q-mt-md">Pedido enviado com sucesso!</div>
      <div class="text-subtitle1 q-mt-sm">Acompanhe pelo seu WhatsApp 📱</div>
      <q-btn
        color="primary"
        label="Voltar ao início"
        class="q-mt-lg"
        @click="$router.push('/')"
      />
    </div>
  </q-page>
</template>
