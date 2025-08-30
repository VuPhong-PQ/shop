import { createProxyMiddleware } from 'http-proxy-middleware';

export default function (app) {
  app.use(
    '/api/VietQR',
    createProxyMiddleware({
  target: 'http://localhost:5271',
      changeOrigin: true,
    })
  );
}
