// Pede Direto API — integração futura
// Quando a API estiver disponível, este serviço vai:
// 1. Autenticar com credenciais Pede Direto
// 2. Buscar perfil de negócio por ID ou slug
// 3. Popular automaticamente os campos do Passo 1 sem necessidade de copy-paste
// 4. Aceder à galeria de fotos do negócio para seleccionar o frame inicial

export const PedeDiretoAPI = {
  baseUrl: import.meta.env.VITE_PEDEDIRETO_API_URL || 'https://api.pededireto.pt',

  async getBusinessProfile(businessId: string) {
    // TODO: implementar quando API disponível
    // return await fetch(`${this.baseUrl}/businesses/${businessId}`)
    throw new Error('API Pede Direto não disponível ainda — usar modo manual')
  },

  async getBusinessGallery(businessId: string) {
    // TODO: implementar quando API disponível
    throw new Error('API Pede Direto não disponível ainda — usar upload manual')
  }
}
