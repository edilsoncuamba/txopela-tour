const fs = require('fs');

// ── PublicationDetailModal.tsx ────────────────────────────────────────────
let p = 'app/src/components/PublicationDetailModal.tsx';
let c = fs.readFileSync(p, 'utf8');
c = c.split('Nota do apurador').join('Nota do aprovador');
c = c.split("Rejeitado pelo apurador.").join("Rejeitado pelo aprovador.");
fs.writeFileSync(p, c, 'utf8');
console.log('PublicationDetailModal OK');

// ── App.tsx ────────────────────────────────────────────────────────────────
p = 'app/src/App.tsx';
c = fs.readFileSync(p, 'utf8');
// Comentários e textos visuais ao utilizador
c = c.split('painel apurador').join('painel aprovador');
c = c.split('painel do apurador').join('painel do aprovador');
c = c.split('Painel do Apurador').join('Painel do Aprovador');
c = c.split('painel do Apurador').join('painel do Aprovador');
// role "curator" na mensagem de erro visível ao utilizador
c = c.split('O painel do apurador requer role "curator" ou "admin".')
     .join('O painel do aprovador requer role "curator" ou "admin".');
fs.writeFileSync(p, c, 'utf8');
console.log('App.tsx OK');

// ── ProtectedRoute.tsx ─────────────────────────────────────────────────────
p = 'app/src/components/ProtectedRoute.tsx';
c = fs.readFileSync(p, 'utf8');
c = c.split('/apurador').join('/aprovador');
fs.writeFileSync(p, c, 'utf8');
console.log('ProtectedRoute OK');

console.log('Tudo concluído!');
