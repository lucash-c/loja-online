import { useQuasar } from 'quasar'

export function useAppDialog() {
  const $q = useQuasar()

  function confirm({
    title = 'Confirmação',
    message = 'Tem certeza?',
    icon = 'help',
    okLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    okColor = 'positive',
    cancelColor = 'grey-7'
  }) {
    return $q.dialog({
      title: `<q-icon name="${icon}" class="q-mr-sm" /> ${title}`,
      message,
      html: true,
      cancel: true,
      persistent: true,
      ok: { label: okLabel, color: okColor },
      cancel: { label: cancelLabel, color: cancelColor }
    })
  }

  return { confirm }
}
