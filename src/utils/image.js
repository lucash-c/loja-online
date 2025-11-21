export function getImageSrc(imagem) {
  const imagemPadrao = new URL("../assets/produto-padrao.jpg", import.meta.url).href;

  try {
    if (!imagem || typeof imagem !== "string" || imagem.trim() === "") {
      return imagemPadrao;
    }

    // Verifica se é um link do Google Drive
    const driveMatch = imagem.match(/drive\.google\.com\/file\/d\/([\w-]+)\//);
    if (driveMatch) {
      const id = driveMatch[1];
      return `http://45.77.163.37:32769/img/${id}`;
    }

    // Links absolutos ou caminhos locais
    if (imagem.startsWith("http") || imagem.startsWith("/")) {
      return imagem;
    }

    // Caminho relativo padrão
    return `/icons/${imagem}`;
  } catch (error) {
    console.warn("Erro ao carregar imagem:", imagem, error);
    return imagemPadrao;
  }
}
