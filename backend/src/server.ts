import { app } from './app';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🏭 Industrial ERP Backend Server running on port ${PORT}`);
  console.log(`📡 Health endpoint: http://localhost:${PORT}/health`);
  console.log(`🔐 RBAC Enabled: [ADMIN, SALES]`);
});
