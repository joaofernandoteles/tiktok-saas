require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { ApifyClient } = require('apify-client');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const db = require('./database');
const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'chave-muito-secreta-padrao-123';

app.use(express.json({ limit: '10mb' }));
app.use(cors());

// ================= AUTH MIDDLEWARE ================= //
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = (authHeader && authHeader.split(' ')[1]) || req.query.token;
    
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// ================= AUTH ROUTES ================= //
app.post('/api/auth/register', (req, res) => {
    const { name, email, password } = req.body;
    if(!email || !password) return res.status(400).json({error: "Dados incompletos"});

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    db.run(`INSERT INTO users (name, email, password) VALUES (?, ?, ?)`, [name, email, hash], function(err) {
        if (err) {
            if(err.message.includes("UNIQUE")) return res.status(400).json({error: "Esse e-mail já existe."});
            return res.status(500).json({error: err.message});
        }
        res.json({ success: true, message: "Conta criada com sucesso" });
    });
});

app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;

    db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
        if(err) return res.status(500).json({error: err.message});
        if(!user) return res.status(400).json({error: "Usuário não encontrado"});

        const isMatch = bcrypt.compareSync(password, user.password);
        if(!isMatch) return res.status(400).json({error: "Senha incorreta"});

        const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
        
        res.json({
            success: true,
            token,
            user: { id: user.id, name: user.name, email: user.email },
            savedVideos: JSON.parse(user.savedVideos || '[]'),
            likedVideos: JSON.parse(user.likedVideos || '[]')
        });
    });
});

// ================= USER CLOUD SYNC ================= //
app.post('/api/user/sync', authenticateToken, (req, res) => {
    const { savedVideos, likedVideos } = req.body;
    // As transformações são parciais
    let query = "UPDATE users SET ";
    let params = [];
    
    if(savedVideos !== undefined) {
        query += "savedVideos = ?, ";
        params.push(JSON.stringify(savedVideos));
    }
    if(likedVideos !== undefined) {
        query += "likedVideos = ?, ";
        params.push(JSON.stringify(likedVideos));
    }

    query = query.slice(0, -2) + " WHERE id = ?";
    params.push(req.user.id);

    db.run(query, params, (err) => {
        if(err) return res.status(500).json({error: err.message});
        res.json({success: true, message: "Sincronizado na nuvem"});
    });
});


// ================= CORE TOOLS ================= //
app.post('/api/search', authenticateToken, async (req, res) => {
    const { topic, likedVideos } = req.body;
    
    if (!topic) return res.status(400).json({ error: 'Assunto é obrigatório' });

    const { APIFY_API_TOKEN, GEMINI_API_KEY } = process.env;
    const isMock = !APIFY_API_TOKEN || APIFY_API_TOKEN === 'sua_chave_aqui';

    if (isMock) {
        console.log(`[MOCK] Buscando vídeos de: ${topic}`);
        setTimeout(() => {
            res.json({ success: true, isMock: true, message: "A chave API do Apify não está configurada.", data: [] });
        }, 500);
        return;
    }

    try {
        console.log(`[API] Buscando Apify para: ${topic}...`);
        const client = new ApifyClient({ token: APIFY_API_TOKEN });
        const input = { "searchQueries": [topic], "resultsPerPage": 50 };
        const run = await client.actor("clockworks/tiktok-scraper").call(input);
        const { items } = await client.dataset(run.defaultDatasetId).listItems();
        
        let finalData = items.map(v => {
             const videoId = v.id || v.videoMeta?.id;
             const coverUrl = v.covers?.default || v.videoMeta?.coverUrl || v.imageUrl;
             const authorName = v.authorMeta?.name || v.author?.uniqueId;
             const authorAvatar = v.authorMeta?.avatar || v.author?.avatarThumb;
             
             return {
                 id: videoId,
                 title: v.text || v.desc || "Trend no TikTok",
                 author: { nickname: authorName || "Usuário", avatar: authorAvatar || "https://ui-avatars.com/api/?name=TK&background=random" },
                 stats: { playCount: v.playCount || v.videoMeta?.playCount || "0", diggCount: v.diggCount || v.videoMeta?.diggCount || "0" },
                 cover: coverUrl || "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=400&q=80",
                 videoUrl: v.webVideoUrl || v.videoMeta?.downloadAddr || (authorName && videoId ? `https://www.tiktok.com/@${authorName}/video/${videoId}` : 'https://www.tiktok.com/'),
                 downloadUrl: v.videoMeta?.downloadAddr || v.videoUrl
             };
        });

        // IA FILTERING
        if (likedVideos && likedVideos.length > 0 && GEMINI_API_KEY) {
             try {
                console.log(`[IA] Filtrando resultados baseado em ${likedVideos.length} curtidas...`);
                const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

                const prompt = `
                Você é um IA Curador Profissional do TikTok.
                O usuário pesquisou pelo assunto: "${topic}".
                Abaixo está a lista de vídeos que ele CURTIU no passado:
                ${JSON.stringify(likedVideos.map(v => v.title))}
                
                Agora, aqui estão 50 novos vídeos encontrados:
                ${JSON.stringify(finalData.map((v, idx) => ({ id: v.id, title: v.title })))}
                
                Retorne APENAS um JSON válido contendo um array dos IDs ordenados por maior match. Format: ["id1", "id2"]. Sem markdown!
                `;                
                const result = await model.generateContent(prompt);
                const responseText = result.response.text().trim().replace(/```json/g, '').replace(/```/g, '');
                
                try {
                     const rankedIds = JSON.parse(responseText);
                     if (Array.isArray(rankedIds)) {
                         const rankedData = [];
                         rankedIds.forEach(id => {
                             const found = finalData.find(v => String(v.id) === String(id));
                             if (found) rankedData.push(found);
                         });
                         finalData.forEach(v => {
                             if (!rankedData.find(rv => String(rv.id) === String(v.id))) rankedData.push(v);
                         });
                         finalData = rankedData;
                     }
                } catch(e) {}
             } catch(e) {}
        }
        res.json({ success: true, isMock: false, data: finalData });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar dados', detail: error.message });
    }
});

app.get('/api/download', authenticateToken, async (req, res) => {
    try {
        const videoUrl = req.query.url;
        if (!videoUrl) return res.status(400).send('URL missing');
        
        const tikwmRes = await axios.get(`https://www.tikwm.com/api/?url=${videoUrl}`);
        if (!tikwmRes.data?.data?.play) throw new Error("Não foi possível resolver o MP4");
        
        const rawMp4Url = tikwmRes.data.data.hdplay || tikwmRes.data.data.play;
        const response = await axios({ method: 'GET', url: rawMp4Url, responseType: 'stream', headers: { 'Referer': 'https://www.tiktok.com/' }});

        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Content-Disposition', 'attachment; filename="tiktok-premium.mp4"');
        response.data.pipe(res);
    } catch (e) { res.status(500).send("Erro"); }
});

app.get('/api/stream', authenticateToken, async (req, res) => {
    try {
        const videoUrl = req.query.url;
        if (!videoUrl) return res.status(400).send('URL missing');
        
        const tikwmRes = await axios.get(`https://www.tikwm.com/api/?url=${videoUrl}`);
        if (!tikwmRes.data?.data?.play) throw new Error("Falha ao resolver");
        
        const rawMp4Url = tikwmRes.data.data.play;
        const response = await axios({ method: 'GET', url: rawMp4Url, responseType: 'stream', headers: { 'Referer': 'https://www.tiktok.com/' }});

        res.setHeader('Content-Type', 'video/mp4');
        response.data.pipe(res);
    } catch (e) { res.status(500).send("Erro"); }
});

const cron = require('node-cron');

// ================= SCHEDULING ROUTES ================= //
app.post('/api/tiktok/connect', authenticateToken, (req, res) => {
    const TIKTOK_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY || 'aw8088i96wy0bxcc';
    const REDIRECT_URI = encodeURIComponent((process.env.BACKEND_URL || "http://localhost:3001") + "/api/tiktok/callback");
    const SCOPES = "user.info.basic,video.publish,video.upload";
    
    // O state envia o nosso internal User ID assinado pra nao nos perdermos na volta
    const customState = req.user.id; 
    
    const authUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${TIKTOK_CLIENT_KEY}&response_type=code&scope=${SCOPES}&redirect_uri=${REDIRECT_URI}&state=${customState}`;
    
    res.json({ url: authUrl });
});

// TikTok Domain Verification (any path)
app.get(/\/tiktok[^/]+\.txt$/, (req, res) => {
    const filename = req.path.split('/').pop();
    const token = filename.replace('tiktok', '').replace('.txt', '');
    res.type('text/plain').send(`tiktok-developers-site-verification=${token}`);
});

app.get('/terms', (req, res) => {
    res.type('text/html').send(`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Termos de Uso - TrendCatcher</title><style>body{font-family:sans-serif;max-width:800px;margin:0 auto;padding:4rem 2rem;line-height:1.8}h1{margin-bottom:0.5rem}h2{margin-top:2rem}</style></head><body><h1>Termos de Uso</h1><p style="color:#666">Última atualização: abril de 2025</p><h2>1. Aceitação dos Termos</h2><p>Ao utilizar o TrendCatcher, você concorda com estes Termos de Uso.</p><h2>2. Descrição do Serviço</h2><p>O TrendCatcher é uma ferramenta de análise de tendências do TikTok que permite buscar vídeos em alta, salvar conteúdos e agendar publicações usando sua conta oficial do TikTok.</p><h2>3. Uso da Conta TikTok</h2><p>Ao conectar sua conta do TikTok, você autoriza o TrendCatcher a publicar vídeos em seu nome nos horários agendados. Você pode revogar esse acesso a qualquer momento nas configurações do TikTok.</p><h2>4. Responsabilidades do Usuário</h2><p>Você é responsável por todo o conteúdo agendado e publicado através da plataforma.</p><h2>5. Contato</h2><p>Dúvidas? <a href="mailto:joaofernando.teles.silva@gmail.com">joaofernando.teles.silva@gmail.com</a></p></body></html>`);
});

app.get('/privacy', (req, res) => {
    res.type('text/html').send(`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Política de Privacidade - TrendCatcher</title><style>body{font-family:sans-serif;max-width:800px;margin:0 auto;padding:4rem 2rem;line-height:1.8}h1{margin-bottom:0.5rem}h2{margin-top:2rem}</style></head><body><h1>Política de Privacidade</h1><p style="color:#666">Última atualização: abril de 2025</p><h2>1. Dados Coletados</h2><p>Coletamos nome, e-mail, token de acesso do TikTok e preferências de vídeos.</p><h2>2. Uso dos Dados</h2><p>Seus dados são usados exclusivamente para autenticação e publicação de vídeos agendados no TikTok em seu nome.</p><h2>3. Compartilhamento</h2><p>Não vendemos ou compartilhamos seus dados com terceiros.</p><h2>4. Token do TikTok</h2><p>O token é armazenado de forma segura e usado apenas para publicar os vídeos que você agendou. Você pode revogar o acesso nas configurações do TikTok.</p><h2>5. Contato</h2><p><a href="mailto:joaofernando.teles.silva@gmail.com">joaofernando.teles.silva@gmail.com</a></p></body></html>`);
});

app.get('/api/tiktok/callback', async (req, res) => {
    const { code, state, error } = req.query;
    if(error || !code) return res.send(`Falha na autenticação do TikTok: ${error}`);
    
    const userId = state;
    const TIKTOK_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY || 'aw8088i96wy0bxcc';
    const TIKTOK_CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET || 'zf11kmWMDD1yCTOJgT1nqh43Dhq1MWGI';
    
    try {
        const tokenRes = await axios.post('https://open.tiktokapis.com/v2/oauth/token/', new URLSearchParams({
            client_key: TIKTOK_CLIENT_KEY,
            client_secret: TIKTOK_CLIENT_SECRET,
            code: code,
            grant_type: 'authorization_code',
            redirect_uri: (process.env.BACKEND_URL || "http://localhost:3001") + "/api/tiktok/callback"
        }), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        
        const { access_token, refresh_token, open_id } = tokenRes.data;
        
        // Vamos buscar o nome do usuario na API de Basic Info
        const userInfoRes = await axios.get('https://open.tiktokapis.com/v2/user/info/?fields=display_name', {
            headers: { 'Authorization': `Bearer ${access_token}` }
        });
        const username = userInfoRes.data?.data?.user?.display_name || "Usuário TikTok";

        db.run(`INSERT INTO tiktok_accounts (user_id, tiktok_username, access_token) VALUES (?, ?, ?)`,
           [userId, username, access_token], (err) => {
             const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
             res.redirect(`${frontendUrl}/schedule?connected=true`);
        });
    } catch(err) {
        console.error("Erro no Callback do TikTok:", err.response?.data || err.message);
        res.send("Erro ao obter chaves do TikTok. Suas credenciais podem estar incorretas ou seu Redirect URI desconfigurado na Dashboard.");
    }
});

app.get('/api/tiktok/status', authenticateToken, (req, res) => {
    db.get(`SELECT * FROM tiktok_accounts WHERE user_id = ? ORDER BY id DESC LIMIT 1`, [req.user.id], (err, row) => {
        if(err || !row) return res.json({ connected: false });
        res.json({ connected: true, username: row.tiktok_username });
    });
});

app.post('/api/schedule/create', authenticateToken, (req, res) => {
    const { video_id, video_url, cover_url, caption, post_time } = req.body;
    db.run(`INSERT INTO scheduled_posts (user_id, video_id, video_url, cover_url, caption, post_time) VALUES (?, ?, ?, ?, ?, ?)`,
           [req.user.id, video_id, video_url, cover_url, caption, post_time], (err) => {
        if(err) return res.status(500).json({ error: "Erro interno no BD." });
        res.json({ success: true, message: "Agendado com sucesso!" });
    });
});

app.get('/api/schedule/list', authenticateToken, (req, res) => {
    db.all(`SELECT * FROM scheduled_posts WHERE user_id = ? ORDER BY post_time ASC`, [req.user.id], (err, rows) => {
        if(err) return res.status(500).json({ error: "Erro" });
        res.json(rows);
    });
});

app.post('/api/schedule/delete', authenticateToken, (req, res) => {
    const { id } = req.body;
    db.run(`DELETE FROM scheduled_posts WHERE id = ? AND user_id = ?`, [id, req.user.id], (err) => {
        res.json({ success: true });
    });
});

app.post('/api/schedule/update', authenticateToken, (req, res) => {
    const { id, caption, post_time } = req.body;
    db.run(`UPDATE scheduled_posts SET caption = ?, post_time = ?, status = 'PENDING' WHERE id = ? AND user_id = ?`,
        [caption, post_time, id, req.user.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.post('/api/schedule/post-now', authenticateToken, async (req, res) => {
    const { id } = req.body;
    db.get(`SELECT sp.*, ta.access_token FROM scheduled_posts sp JOIN tiktok_accounts ta ON sp.user_id = ta.user_id WHERE sp.id = ? AND sp.user_id = ?`,
        [id, req.user.id], async (err, post) => {
        if (err || !post) return res.status(404).json({ error: "Post não encontrado." });
        if (!post.access_token) return res.status(400).json({ error: "Conta TikTok não conectada." });

        try {
            const payload = {
                post_info: {
                    title: post.caption,
                    privacy_level: "PUBLIC_TO_EVERYONE",
                    disable_comment: false
                },
                source_info: {
                    source: "PULL_FROM_URL",
                    video_url: post.video_url
                }
            };

            const postRes = await axios.post('https://open.tiktokapis.com/v2/post/publish/video/init/', payload, {
                headers: { 'Authorization': `Bearer ${post.access_token}`, 'Content-Type': 'application/json' }
            });

            if (postRes.data?.error?.code && postRes.data.error.code !== 'ok') {
                throw new Error(postRes.data.error.message);
            }

            db.run(`UPDATE scheduled_posts SET status = 'PUBLISHED' WHERE id = ?`, [post.id]);
            res.json({ success: true, publish_id: postRes.data?.data?.publish_id });
        } catch (e) {
            const errMsg = e.response?.data?.error?.message || e.message;
            db.run(`UPDATE scheduled_posts SET status = 'ERROR' WHERE id = ?`, [post.id]);
            res.status(500).json({ error: errMsg });
        }
    });
});

// ================= CRON JOB: POSTADOR AUTOMATICO ================= //
// Roda a cada minuto checando os horários
cron.schedule('* * * * *', () => {
    const now = Date.now();
    // Recuperamos o post junto do token de acesso do tiktok da conta vinculada
    db.all(`SELECT sp.*, ta.access_token FROM scheduled_posts sp JOIN tiktok_accounts ta ON sp.user_id = ta.user_id WHERE sp.status = 'PENDING' AND sp.post_time <= ?`, [now], (err, rows) => {
        if(err || !rows) return;
        
        rows.forEach(async post => {
            console.log(`[CRON] Disparando automação do vídeo para TikTok... Usuário: ${post.user_id}`);
            
            try {
                const payload = {
                    post_info: {
                        title: post.caption,
                        privacy_level: "PUBLIC_TO_EVERYONE",
                        disable_comment: false
                    },
                    source_info: {
                        source: "PULL_FROM_URL",
                        video_url: post.video_url
                    }
                };

                const postRes = await axios.post('https://open.tiktokapis.com/v2/post/publish/video/init/', payload, {
                    headers: { 'Authorization': `Bearer ${post.access_token}`, 'Content-Type': 'application/json' }
                });

                if(postRes.data && postRes.data.error && postRes.data.error.code !== 'ok') {
                    throw new Error(postRes.data.error.message);
                }

                db.run(`UPDATE scheduled_posts SET status = 'PUBLISHED' WHERE id = ?`, [post.id], () => {
                    console.log(`[CRON] Sucesso! Publish ID:`, postRes.data?.data?.publish_id);
                });
            } catch(e) {
                console.error(`[CRON] Falha ao postar vídeo ${post.id}:`, e.response?.data || e.message);
                // Marcamos erro para nao afogar a API na prox tentativa
                db.run(`UPDATE scheduled_posts SET status = 'ERROR' WHERE id = ?`, [post.id]);
            }
        });
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor Backend rodando na porta ${PORT}`);
});
