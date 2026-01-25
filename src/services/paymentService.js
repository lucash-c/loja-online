const PAYMENT_API_BASE_URL = 'http://dwgkk4gwgwok0koo8480k8oo.109.199.124.100.sslip.io/'

// ID fixo da planilha (pode mover para .env se quiser)
const SHEET_ID = "1yJ3Hn7wYZeGc5sagoHeyjmSWd6RittvUaUQ0FDqoA4A";

export async function gerarPixQrCode(valor, descricao = "Pedido") {
  try {
    const response = await fetch(`${PAYMENT_API_BASE_URL}/pagar/${SHEET_ID}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        descricao,
        valor,
      }),
    });

    if (!response.ok) {
      throw new Error("Erro ao gerar QR Code PIX");
    }

    const data = await response.json();

    // retorna o base64 do QR Code e o código copia/cola
    return {
      paymentId: data.paymentId,
      qrCodeBase64: data.point_of_interaction?.transaction_data?.qr_code_base64,
      qrCodeText: data.point_of_interaction?.transaction_data?.qr_code,
      ticketUrl: data.point_of_interaction?.transaction_data?.ticket_url,
    };
  } catch (err) {
    console.error("Erro no gerarPixQrCode:", err);
    return null;
  }
}

export async function verificarStatusPix(paymentId) {
  try {
    const res = await fetch(
      `${PAYMENT_API_BASE_URL}/status/${paymentId}`
    );
    const data = await res.json();
    return data.status || "pending";
  } catch (err) {
    console.error("Erro ao verificar status do PIX:", err);
    return "pending";
  }
}

// Simula a aprovação de um pagamento PIX (apenas sandbox)
export async function simularPagamentoPix(paymentId) {
  try {
    const res = await fetch(`${PAYMENT_API_BASE_URL}/simular/${paymentId}`, {
      method: "POST",
    });
    const data = await res.json();
    return data.success;
  } catch (err) {
    console.error("Erro ao simular pagamento PIX:", err);
    return false;
  }
}
