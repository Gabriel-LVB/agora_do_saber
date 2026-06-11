# Deploy privado da Ágora 2.0

## 1. Criar um Firebase separado

No Firebase Console:

1. Criar um novo projeto no plano gratuito, por exemplo `agora-do-saber-2-dev`.
2. Ativar Authentication com Google.
3. Criar um banco Firestore.
4. Cadastrar um app Web.
5. Copiar as configurações para as variáveis descritas em `.env.example`.
6. Autorizar `localhost` e, depois, o domínio do novo projeto Vercel.

Não reutilizar o projeto Firebase atual durante a reforma.

## 2. Testar localmente

Criar `.env.local` a partir de `.env.example` e preencher com o Firebase 2.0:

```bash
npm run dev
```

O `.env.local` não deve ser commitado.

## 3. Criar outro projeto na Vercel

Na Vercel:

1. Importar novamente o repositório `Gabriel-LVB/agora_do_saber`.
2. Nomear o projeto como `agora-do-saber-2-dev`.
3. Definir a branch de produção do projeto como `agora-2.0`.
4. Cadastrar todas as variáveis `VITE_FIREBASE_*`.
5. Manter o projeto atual apontando para `main`.
6. Ativar proteção de acesso da Vercel, se disponível no plano, ou manter apenas seu email na whitelist do Firebase 2.0.

## 4. Evitar publicação acidental

- Nunca trocar a branch de produção do projeto Vercel atual.
- Nunca cadastrar as credenciais do Firebase atual no projeto Vercel 2.0.
- Antes de cada push, confirmar `git branch --show-current`.
- Durante desenvolvimento, somente a branch `agora-2.0` recebe mudanças.

## 5. Lançamento futuro

Quando a 2.0 estiver pronta:

1. Migrar uma cópia dos dados.
2. Testar com poucos usuários.
3. Fazer backup dos dados atuais.
4. Definir uma janela de lançamento.
5. Trocar o domínio para o novo projeto.
6. Manter o projeto antigo disponível para rollback por alguns dias.
