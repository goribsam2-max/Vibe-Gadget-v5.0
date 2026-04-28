import express from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Simple REST fetcher for product data to avoid loading Firebase Client SDK in Node
  const fetchProductData = async (productId: string) => {
    try {
      const res = await fetch(`https://firestore.googleapis.com/v1/projects/vibegadgets-ae9d1/databases/(default)/documents/products/${productId}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.fields;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const isProd = process.env.NODE_ENV === "production";
  let vite: any;

  if (!isProd) {
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in prod except index.html
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, { index: false }));
  }

  app.get('*all', async (req, res) => {
    try {
      let template: string;
      
      if (!isProd) {
        template = fs.readFileSync(path.resolve('index.html'), 'utf-8');
        template = await vite.transformIndexHtml(req.originalUrl, template);
      } else {
        template = fs.readFileSync(path.join(process.cwd(), 'dist', 'index.html'), 'utf-8');
      }

      // Check if it's a product page
      const productMatch = req.path.match(/^\/product\/(.+)$/);
      if (productMatch && productMatch[1]) {
        const productId = productMatch[1];
        const product = await fetchProductData(productId);
        
        if (product) {
          const title = product.name?.stringValue || 'Vibe Gadgets';
          const description = product.description?.stringValue || 'Check out this amazing product on Vibe Gadgets.';
          const imageUrl = product.image?.stringValue || product.images?.arrayValue?.values?.[0]?.stringValue || 'https://vibe-gadget.vercel.app/og-image.jpg';
          const price = product.price?.integerValue || product.price?.doubleValue || 0;

          let metaTags = `
            <title>${title} | Vibe Gadgets</title>
            <meta name="description" content="${description}" />
            <meta property="og:title" content="${title} | Vibe Gadgets" />
            <meta property="og:description" content="${description}" />
            <meta property="og:image" content="${imageUrl}" />
            <meta property="og:type" content="product" />
            <meta property="product:price:amount" content="${price}" />
            <meta property="product:price:currency" content="BDT" />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content="${title}" />
            <meta name="twitter:description" content="${description}" />
            <meta name="twitter:image" content="${imageUrl}" />
          `;

          // Inject meta tags
          const metaRegex = /<!-- META_TAGS_PLACEHOLDER -->[\s\S]*?<!-- END_META_TAGS_PLACEHOLDER -->/;
          if (metaRegex.test(template)) {
             template = template.replace(metaRegex, metaTags);
          } else {
             template = template.replace('</head>', `${metaTags}\n</head>`);
          }
        }
      }

      res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
    } catch (e: any) {
      if (!isProd && vite) {
        vite.ssrFixStacktrace(e);
      }
      console.log(e.stack);
      res.status(500).end(e.stack);
    }
  });

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
