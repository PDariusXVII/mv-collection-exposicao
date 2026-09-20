# MV Collection · Exposição de projetos

Site **somente de visualização**. Ele não cria, edita nem envia nada: lê o catálogo público em
[`public/projects.json`](public/projects.json) e exibe os projetos. O site administrativo deve editar esse arquivo
(e publicar os arquivos de mídia correspondentes) no repositório.

## Rodar

```bash
npm install
npm run dev                    # http://localhost:3000
```

- Para adicionar, editar ou remover um projeto, o site administrativo deve alterar `public/projects.json`.
- Para conteúdo local, coloque os arquivos em `public/` e use caminhos relativos no JSON, como
  `projetos/catalogo/capa.jpg` ou `projetos/catalogo/documentacao.pdf`.
- `npm run build` gera a pasta `dist/` (estática, caminhos relativos). Pode publicar no GitHub Pages.
  O JSON é copiado automaticamente para essa pasta.

## Formato do catálogo

O arquivo pode ser um array de projetos ou um objeto com a chave `projects`, `data` ou `items`.
Só `id` e `title` são obrigatórios. Todo o resto é opcional: o que não vier simplesmente não aparece.

```json
{
  "id": "catalogo-hq",
  "title": "Catálogo de HQs",
  "description": "Leitor e catálogo web para uma coleção de quadrinhos.",
  "category": "Site e Aplicativo",
  "tags": ["JavaScript", "Estático"],
  "coverUrl": "projetos/catalogo/capa.jpg",
  "images": ["https://…/1.jpg", "https://…/2.jpg"],
  "videos": ["https://…/demo.mp4", { "url": "https://…/uso.mp4", "poster": "https://…/uso.jpg" }],
  "docUrl": "projetos/catalogo/documentacao.pdf",
  "zipUrl": "projetos/catalogo/catalogo-hq.zip",
  "zipSize": 2411724,
  "version": "1.2.0",
  "updatedAt": "2026-08-14T12:00:00Z",
  "readme": "# Título\n\nTexto…",
  "files": [{ "path": "index.html", "size": 18420 }],
  "links": [{ "label": "Demo", "url": "https://…" }]
}
```

### Categorias, mídia e documentação

- **`category`**: `Programa`, `Site`, `Aplicativo` ou `Site e Aplicativo` (maiúsculas, acentos e variações como
  `site_e_aplicativo` ou `site + app` são aceitos; um array `["site","aplicativo"]` vira "Site e Aplicativo").
  O site mostra um filtro por categoria e divide a lista em grupos. Uma categoria **nova** no JSON
  (ex.: `Jogo`) aparece sozinha no filtro; projetos sem categoria vão para "Outros".
  As categorias fixas ficam em `CATEGORIES`, em `src/config/site.ts`.
- **`images`**: até **5** (o excedente é ignorado). **`videos`**: até **2**, arquivos diretos (`.mp4`/`.webm`),
  não links do YouTube. Sem `images`, a capa é usada como única imagem.
- **`docUrl`**: PDF da documentação. Se existir, aparece o botão **ACESSE AQUI** abaixo das imagens.
  O PDF **não é baixado nem mostrado como PDF**: o site lê o texto e o desenha como uma página do site
  (títulos, listas, índice e links). Links do PDF viram botões quando estão sozinhos numa linha
  (ex.: "Baixar o aplicativo") e URLs soltas viram links clicáveis.

Como escrever o PDF para ele ficar bom:

- PDF com **texto** (exportado do Word/Google Docs/etc.), não escaneado, em **uma coluna**.
- Os títulos são reconhecidos pelo **tamanho da fonte**: título maior que os subtítulos, e subtítulos maiores que o texto.
- Listas com marcadores (`•`, `-`) ou numeradas (`1.`, `2.`) viram listas.
- Imagens e tabelas dentro do PDF **não** são exibidas (só o texto).
- Para PDFs externos, o servidor precisa liberar **CORS**. PDFs dentro de `public/` não precisam de configuração extra.

Detalhes úteis:

- Nomes em `snake_case` também funcionam (`cover_url`, `zip_url`, `zip_size`, `updated_at`).
- Prefira URLs relativas para arquivos dentro de `public/`, por exemplo `projetos/catalogo/capa.jpg`.
- O botão **Baixar .zip** só aparece se o projeto tiver `zipUrl`. Para não permitir download, não envie o campo.
- **GitHub Pages:** prefira caminhos relativos no JSON e mantenha os arquivos dentro de `public/`, para que o catálogo
  funcione também quando o site estiver publicado em uma subpasta.
- Não coloque segredos no catálogo: todo conteúdo em `public/` fica visível no navegador.

## Como o site é organizado

```
src/
  config/site.ts        textos fixos (nome, hero, "sobre", rodapé) e caminho do catálogo
  lib/api.ts            fetch + normalização dos dados do JSON
  hooks/                useProjects (lista) · useProjectRoute (#/projeto/<id>)
  lib/pdfBlocks.ts      transforma o texto do PDF em títulos/listas/links
  lib/pdfDocument.ts    baixa o PDF em memória e carrega o pdf.js só quando a documentação é aberta
  components/           Hero, AboutSection, ProjectsSection (filtro por categoria + busca),
                        ProjectViewer (imagens, vídeos, botão da documentação), DocumentReader
public/projects.json    catálogo editável pelo site administrativo
```

- **Ver projeto** abre um visualizador com galeria (imagens e vídeos), descrição, metadados, arquivos, README e download.
  Cada projeto tem link próprio: `https://seu-site/#/projeto/catalogo-hq`, e a documentação também:
  `https://seu-site/#/projeto/catalogo-hq/docs`.
- `public/exemplo/` tem um PDF de exemplo usado pelo primeiro projeto do catálogo; pode apagar junto com esse projeto.
- Para trocar as fotos, edite `src/config/site.ts` (foto da seção "Sobre") e o vídeo do topo (`hero.videoUrl`).
