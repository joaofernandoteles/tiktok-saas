export default function Privacy() {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '4rem 2rem', color: '#fff', fontFamily: 'Inter, sans-serif', lineHeight: 1.8 }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Política de Privacidade</h1>
      <p style={{ color: '#a0a0a0', marginBottom: '3rem' }}>Última atualização: abril de 2025</p>

      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1rem' }}>1. Dados Coletados</h2>
        <p>Coletamos apenas as informações necessárias para o funcionamento da plataforma:</p>
        <ul style={{ marginTop: '0.8rem', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <li>Nome e e-mail (para criação de conta)</li>
          <li>Token de acesso do TikTok (para publicação de vídeos agendados)</li>
          <li>Vídeos salvos e curtidos (para personalização da IA)</li>
        </ul>
      </section>

      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1rem' }}>2. Uso dos Dados</h2>
        <p>Seus dados são utilizados exclusivamente para:</p>
        <ul style={{ marginTop: '0.8rem', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <li>Autenticar sua conta na plataforma</li>
          <li>Publicar vídeos agendados no TikTok em seu nome</li>
          <li>Personalizar as recomendações da IA com base nos seus interesses</li>
        </ul>
      </section>

      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1rem' }}>3. Compartilhamento de Dados</h2>
        <p>Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros, exceto quando necessário para o funcionamento do serviço (ex: API do TikTok).</p>
      </section>

      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1rem' }}>4. Token do TikTok</h2>
        <p>O token de acesso da sua conta TikTok é armazenado de forma segura e utilizado apenas para publicar os vídeos que você mesmo agendou. Você pode revogar esse acesso a qualquer momento acessando as configurações de privacidade do TikTok.</p>
      </section>

      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1rem' }}>5. Segurança</h2>
        <p>Utilizamos criptografia (bcrypt) para senhas e JWT para autenticação de sessões. Tomamos medidas razoáveis para proteger seus dados contra acesso não autorizado.</p>
      </section>

      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1rem' }}>6. Seus Direitos</h2>
        <p>Você pode solicitar a exclusão da sua conta e todos os dados associados a qualquer momento entrando em contato conosco.</p>
      </section>

      <section>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1rem' }}>7. Contato</h2>
        <p>Para questões de privacidade: <a href="mailto:joaofernando.teles.silva@gmail.com" style={{ color: '#00f2fe' }}>joaofernando.teles.silva@gmail.com</a></p>
      </section>
    </div>
  );
}
