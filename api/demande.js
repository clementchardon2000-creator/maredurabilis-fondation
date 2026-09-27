// POST /api/demande — formulaire « Contact » du site Mare Durabilis.
// Envoie le message (et les pièces jointes du porteur de projet) à contact@maredurabilis.org via Brevo,
// avec Répondre-à = l'expéditeur, puis un accusé de réception à l'expéditeur.
// Variable d'environnement requise sur Vercel : BREVO_API_KEY (et, en option, NOTIF_EMAIL).
const BREVO_KEY = process.env.BREVO_API_KEY;
const DEST = (process.env.NOTIF_EMAIL || 'contact@maredurabilis.org').split(',').map(s => s.trim()).filter(Boolean);
const MAX_PJ = 5, MAX_BYTES = 3 * 1024 * 1024;
const EXT_OK = /\.(pdf|docx?|xlsx?|odt|ods|pptx?|odp|zip|jpe?g|png)$/i;

const esc = t => String(t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function brevo(payload) {
  if (!BREVO_KEY) { console.error('BREVO_API_KEY absente'); return false; }
  try {
    const r = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST', headers: { 'api-key': BREVO_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!r.ok) console.error('Brevo', r.status, (await r.text()).slice(0, 300));
    return r.ok;
  } catch (e) { console.error('Brevo réseau', e.message); return false; }
}

function wrap(titre, corps) {
  return `<!DOCTYPE html><html lang="fr"><body style="margin:0;background:#EEF3F7;padding:24px 0">
<table role="presentation" width="600" align="center" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:14px">
<tr><td style="padding:26px 32px 6px;font-family:Verdana,sans-serif;font-size:18px;font-weight:bold;color:#0012B5">Mare Durabilis</td></tr>
<tr><td style="padding:0 32px"><div style="height:3px;background:#00B5B5;border-radius:2px"></div></td></tr>
<tr><td style="padding:22px 32px 8px"><h1 style="margin:0 0 14px;font-family:Verdana,sans-serif;font-size:19px;color:#0012B5">${titre}</h1>
<div style="font-family:Verdana,sans-serif;font-size:13.5px;line-height:1.65;color:#13202B">${corps}</div></td></tr>
<tr><td style="padding:18px 32px 24px;font-family:Verdana,sans-serif;font-size:10.5px;color:#5A6B7A;border-top:1px solid #E1E8EF">
<strong style="color:#0012B5">Fonds de dotation Mare Durabilis</strong> · 29 promenade Jean-Baptiste Marty, Cap Saint-Louis 3B, 34200 Sète ·
<a href="mailto:contact@maredurabilis.org" style="color:#0074B5">contact@maredurabilis.org</a></td></tr></table></body></html>`;
}
function recap(lignes) {
  return '<table role="presentation" width="100%" style="background:#F2F7FB;border-radius:10px;margin:12px 0">' +
    lignes.filter(l => l[1]).map(l => `<tr><td style="padding:8px 16px 0;font-size:11px;color:#5A6B7A">${l[0]}</td></tr><tr><td style="padding:0 16px 8px;font-size:14px;font-weight:bold">${l[1]}</td></tr>`).join('') + '</table>';
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST attendu' });
  try {
    const b = req.body || {};
    if (b.site) return res.status(200).json({ ok: true }); // pot de miel anti-robots
    const nom = String(b.nom || '').trim(), email = String(b.email || '').trim(), message = String(b.message || '').trim();
    const role = String(b.role || '').slice(0, 60), programme = String(b.programme || '').slice(0, 160);
    const organisation = String(b.organisation || '').slice(0, 200), objet = String(b.objet || '').slice(0, 160);
    if (!nom || !email || message.length < 10) return res.status(400).json({ error: 'Nom, e-mail et message (10 caractères minimum) sont requis.' });
    if (message.length > 3000 || nom.length > 200) return res.status(400).json({ error: 'Message trop long.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Adresse e-mail invalide.' });
    if (!b.consent) return res.status(400).json({ error: 'Le consentement est requis.' });

    const pj = Array.isArray(b.fichiers) ? b.fichiers.slice(0, MAX_PJ) : [];
    let total = 0;
    for (const f of pj) {
      if (!f || !f.name || !f.content || !EXT_OK.test(f.name)) return res.status(400).json({ error: 'Type de fichier non accepté : ' + esc(f && f.name) });
      total += Math.floor(String(f.content).length * 3 / 4);
    }
    if (total > MAX_BYTES) return res.status(413).json({ error: 'Pièces jointes trop lourdes (3 Mo au total maximum).' });

    const sujet = (role === 'Porteur de projet' ? '📁 Demande de subvention' : '📩 Contact') + ' — ' + nom + (objet ? ' — ' + objet : '');
    const corps = recap([
      ['Vous nous écrivez en tant que', esc(role)],
      ['Programme d’action de référence', esc(programme)],
      ['Objet', esc(objet)],
      ['Nom', esc(nom)], ['E-mail', esc(email)], ['Structure', esc(organisation)],
      ['Pièces jointes', pj.map(f => esc(f.name)).join('<br>')]
    ]) + `<p style="white-space:pre-wrap">${esc(message)}</p><p style="color:#5A6B7A;font-size:12px">Répondre à cet e-mail répond directement à l’expéditeur.</p>`;

    let ok = false;
    for (const d of DEST) {
      ok = (await brevo({
        sender: { name: 'Site Mare Durabilis', email: 'no-reply@maredurabilis.org' },
        to: [{ email: d }], replyTo: { email, name: nom }, subject: sujet,
        htmlContent: wrap('Nouveau message du site', corps),
        attachment: pj.length ? pj.map(f => ({ name: String(f.name).slice(0, 120), content: String(f.content) })) : undefined
      })) || ok;
    }
    if (!ok) return res.status(502).json({ error: "L’envoi a échoué. Réessayez, ou écrivez directement à contact@maredurabilis.org." });

    await brevo({
      sender: { name: 'Mare Durabilis', email: 'contact@maredurabilis.org' },
      to: [{ email, name: nom }],
      subject: 'Nous avons bien reçu votre message — Mare Durabilis',
      htmlContent: wrap('Votre message est bien arrivé ✓',
        `<p>Bonjour ${esc(nom)},</p><p>Nous avons bien reçu votre message${pj.length ? ' et vos ' + pj.length + ' pièce(s) jointe(s)' : ''}. L’équipe de Mare Durabilis vous répondra rapidement.</p>
         <div style="background:#F2F7FB;border-radius:10px;padding:12px 16px;white-space:pre-wrap;font-size:13px">${esc(message)}</div>
         <p>À très vite,<br><strong style="color:#0012B5">L’équipe de Mare Durabilis</strong></p>`)
    });
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Envoi impossible pour le moment.' });
  }
};

module.exports.config = { api: { bodyParser: { sizeLimit: '4.5mb' } } };
