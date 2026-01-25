from flask import Flask, jsonify, request, g
import sqlite3
import base64
import jwt
import uuid
from datetime import datetime, timedelta
from pathlib import Path
import os
from playwright.sync_api import sync_playwright

DATABASE = Path(__file__).parent / 'perimetro.db'
SECRET_KEY = 'seu_secret_key_super_secreto_123456'  # Mude isso em produção!

app = Flask(__name__)

# CORS manual sem biblioteca
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response


@app.before_request
def require_admin():
    # Allow CORS preflight
    if request.method == 'OPTIONS':
        return None

    # Skip auth check for login endpoint
    if request.path == '/login':
        return None

    # Ensure DB exists/initialized
    if not DATABASE.exists():
        init_db()
    
    # Require JWT token in Authorization header
    auth = request.headers.get('Authorization')
    if not auth:
        return jsonify({'erro': 'Permissão negada'}), 403

    parts = auth.split()
    if len(parts) != 2 or parts[0].lower() != 'bearer':
        return jsonify({'erro': 'Permissão negada'}), 403

    token = parts[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        # cargo = payload.get('cargo', '').lower()
        # if cargo not in ("administrador", "???", "lider"):
        #     return jsonify({'erro': 'Permissão negada'}), 403
        
        # Verificar se o jti do token corresponde ao current_jti do usuário
        jti = payload.get('jti')
        user_id = payload.get('user_id')
        if jti and user_id:
            db = get_db()
            cur = db.cursor()
            cur.execute('SELECT current_jti FROM users WHERE id = ?', (user_id,))
            row = cur.fetchone()
            if row and row['current_jti'] and row['current_jti'] != jti:
                return jsonify({'erro': 'Sessão invalidada. Faça login novamente.'}), 401
    except jwt.ExpiredSignatureError:
        return jsonify({'erro': 'Token expirado'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'erro': 'Token inválido'}), 401


def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = sqlite3.connect(str(DATABASE))
        db.row_factory = sqlite3.Row
        g._database = db
    return db


def get_auth_user():
    """Retorna o usuário autenticado (dict com id, cargo, grupo) ou None."""
    auth = request.headers.get('Authorization')
    if not auth:
        return None
    parts = auth.split()
    if len(parts) != 2 or parts[0].lower() != 'bearer':
        return None
    try:
        payload = jwt.decode(parts[1], SECRET_KEY, algorithms=['HS256'])
        user_id = payload.get('user_id')
        if not user_id:
            return None
        db = get_db()
        cur = db.cursor()
        cur.execute('SELECT id, cargo, grupo FROM users WHERE id = ?', (user_id,))
        row = cur.fetchone()
        if not row:
            return None
        return { 'id': row['id'], 'cargo': row['cargo'], 'grupo': row['grupo'] }
    except Exception:
        return None


def init_db():
    db = sqlite3.connect(str(DATABASE))
    cur = db.cursor()
    cur.execute('''
        CREATE TABLE IF NOT EXISTS nomeados (
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            simulacro TEXT NOT NULL,
            homunculo TEXT NOT NULL,
            saude TEXT,
            mental TEXT,
            exposicao TEXT,
            afinidade TEXT,
            ficha TEXT,
            foto BLOB,
            perimetro_id INTEGER,
            status TEXT DEFAULT 'Ativo' NOT NULL,
            FOREIGN KEY (perimetro_id) REFERENCES perimetros(id)
        )
    ''')
    cur.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            username TEXT NOT NULL,
            display_name TEXT,
            password TEXT,
            ativo INTEGER DEFAULT 1 NOT NULL,
            cargo TEXT,
            grupo TEXT DEFAULT 'Observador',
            foto BLOB,
            -- Campos de ficha RPG
            origem TEXT,
            jogador TEXT,
            classe TEXT,
            nex INTEGER DEFAULT 5,
            pe_turno INTEGER DEFAULT 1,
            deslocamento TEXT DEFAULT '9m / 6q',
            vida_atual INTEGER DEFAULT 0,
            vida_max INTEGER DEFAULT 0,
            sanidade_atual INTEGER DEFAULT 0,
            sanidade_max INTEGER DEFAULT 0,
            esforco_atual INTEGER DEFAULT 0,
            esforco_max INTEGER DEFAULT 0,
            defesa INTEGER DEFAULT 10,
            bloqueio INTEGER DEFAULT 0,
            esquiva INTEGER DEFAULT 0,
            protecao TEXT,
            resistencias TEXT,
            proficiencias TEXT,
            agi INTEGER DEFAULT 0,
            forca INTEGER DEFAULT 0,
            inteligencia INTEGER DEFAULT 0,
            pre INTEGER DEFAULT 0,
            vig INTEGER DEFAULT 0,
            dt_rituais INTEGER DEFAULT 0
        )
    ''')
    cur.execute('''
        CREATE TABLE IF NOT EXISTS elementos (
            id INTEGER PRIMARY KEY NOT NULL,
            elemento TEXT NOT NULL,
            imagem BLOB
        )
    ''')
    cur.execute('''
        CREATE TABLE IF NOT EXISTS perimetros (
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            nome TEXT NOT NULL,
            cidade TEXT,
            class TEXT,
            status TEXT,
            populacao INTEGER,
            descricao TEXT,
            admin_id INTEGER,
            missao_id INTEGER,
            FOREIGN KEY (admin_id) REFERENCES users(id),
            FOREIGN KEY (missao_id) REFERENCES missoes(id) ON DELETE SET NULL
        )
    ''')
    
    # Tabela de missões
    cur.execute('''
        CREATE TABLE IF NOT EXISTS missoes (
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            nome TEXT NOT NULL,
            descricao TEXT,
            briefing TEXT,
            nex INTEGER DEFAULT 0,
            status TEXT DEFAULT 'Não Iniciada' NOT NULL,
            data_criacao TEXT,
            data_conclusao TEXT,
            criado_por INTEGER,
            comandante_id INTEGER NOT NULL,
            FOREIGN KEY (criado_por) REFERENCES users(id),
            FOREIGN KEY (comandante_id) REFERENCES users(id)
        )
    ''')
    
    # Tabela de associação entre missões e agentes (users)
    cur.execute('''
        CREATE TABLE IF NOT EXISTS missao_agentes (
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            missao_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            data_atribuicao TEXT,
            FOREIGN KEY (missao_id) REFERENCES missoes(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE(missao_id, user_id)
        )
    ''')
    
    # Tabela de notificações
    cur.execute('''
        CREATE TABLE IF NOT EXISTS notificacoes (
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            user_id INTEGER NOT NULL,
            tipo TEXT NOT NULL,
            titulo TEXT NOT NULL,
            mensagem TEXT,
            missao_id INTEGER,
            remetente_id INTEGER,
            lida INTEGER DEFAULT 0,
            data_criacao TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (missao_id) REFERENCES missoes(id) ON DELETE SET NULL,
            FOREIGN KEY (remetente_id) REFERENCES users(id) ON DELETE SET NULL
        )
    ''')
    
    # Tabela de criaturas (Bestiário)
    cur.execute('''
        CREATE TABLE IF NOT EXISTS criaturas (
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            nome TEXT NOT NULL,
            elemento TEXT,
            elementos_adicionais TEXT,
            deslocamento_metros TEXT,
            deslocamento_quadrados TEXT,
            escalada_metros TEXT,
            escalada_quadrados TEXT,
            voo_metros TEXT,
            voo_quadrados TEXT,
            agi INTEGER DEFAULT 0,
            forca INTEGER DEFAULT 0,
            int INTEGER DEFAULT 0,
            pre INTEGER DEFAULT 0,
            vig INTEGER DEFAULT 0,
            descricao TEXT,
            imagem BLOB,
            criado_por INTEGER,
            data_criacao TEXT,
            FOREIGN KEY (criado_por) REFERENCES users(id)
        )
    ''')
    
    # Tabela de associação N:N entre criaturas e elementos
    cur.execute('''
        CREATE TABLE IF NOT EXISTS criatura_elementos (
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            criatura_id INTEGER NOT NULL,
            elemento_id INTEGER NOT NULL,
            is_principal INTEGER DEFAULT 0,
            FOREIGN KEY (criatura_id) REFERENCES criaturas(id) ON DELETE CASCADE,
            FOREIGN KEY (elemento_id) REFERENCES elementos(id) ON DELETE CASCADE,
            UNIQUE(criatura_id, elemento_id)
        )
    ''')
    db.commit()

    # Ensure 'afinidade' column exists for older DBs that may lack it
    cur.execute("PRAGMA table_info(nomeados)")
    existing_cols = [row[1] for row in cur.fetchall()]
    if 'afinidade' not in existing_cols:
        cur.execute("ALTER TABLE nomeados ADD COLUMN afinidade TEXT")
        db.commit()
    
    # Ensure 'elemento' column exists in criaturas for older DBs
    cur.execute("PRAGMA table_info(criaturas)")
    criaturas_cols = [row[1] for row in cur.fetchall()]
    if 'elemento' not in criaturas_cols:
        cur.execute("ALTER TABLE criaturas ADD COLUMN elemento TEXT")
        db.commit()
    if 'elementos_adicionais' not in criaturas_cols:
        cur.execute("ALTER TABLE criaturas ADD COLUMN elementos_adicionais TEXT")
        db.commit()
    
    # Ensure 'grupo' column exists in users table for older DBs
    cur.execute("PRAGMA table_info(users)")
    user_cols = [row[1] for row in cur.fetchall()]
    if 'grupo' not in user_cols:
        cur.execute("ALTER TABLE users ADD COLUMN grupo TEXT DEFAULT 'Observador'")
        db.commit()
    
    # Ensure 'display_name' column exists in users table for older DBs
    if 'display_name' not in user_cols:
        cur.execute("ALTER TABLE users ADD COLUMN display_name TEXT")
        db.commit()
    
    # Ensure RPG ficha fields exist in users table
    ficha_fields = [
        ('origem', 'TEXT'),
        ('jogador', 'TEXT'),
        ('classe', 'TEXT'),
        ('nex', 'INTEGER DEFAULT 5'),
        ('pe_turno', 'INTEGER DEFAULT 1'),
        ('deslocamento', "TEXT DEFAULT '9m / 6q'"),
        ('vida_atual', 'INTEGER DEFAULT 0'),
        ('vida_max', 'INTEGER DEFAULT 0'),
        ('sanidade_atual', 'INTEGER DEFAULT 0'),
        ('sanidade_max', 'INTEGER DEFAULT 0'),
        ('esforco_atual', 'INTEGER DEFAULT 0'),
        ('esforco_max', 'INTEGER DEFAULT 0'),
        ('defesa', 'INTEGER DEFAULT 10'),
        ('bloqueio', 'INTEGER DEFAULT 0'),
        ('esquiva', 'INTEGER DEFAULT 0'),
        ('protecao', 'TEXT'),
        ('resistencias', 'TEXT'),
        ('proficiencias', 'TEXT'),
        ('agi', 'INTEGER DEFAULT 0'),
        ('forca', 'INTEGER DEFAULT 0'),
        ('inteligencia', 'INTEGER DEFAULT 0'),
        ('pre', 'INTEGER DEFAULT 0'),
        ('vig', 'INTEGER DEFAULT 0'),
        ('dt_rituais', 'INTEGER DEFAULT 0'),
    ]
    for field_name, field_type in ficha_fields:
        if field_name not in user_cols:
            cur.execute(f"ALTER TABLE users ADD COLUMN {field_name} {field_type}")
            db.commit()

    # Drop deprecated 'personagem' column if present (SQLite >= 3.35)
    if 'personagem' in user_cols:
        try:
            cur.execute("ALTER TABLE users DROP COLUMN personagem")
            db.commit()
        except Exception:
            # If running on older SQLite without DROP COLUMN support, ignore safely
            pass
    
    # Ensure 'briefing' and 'nex' columns exist in missoes table for older DBs
    cur.execute("PRAGMA table_info(missoes)")
    missoes_cols = [row[1] for row in cur.fetchall()]
    if 'briefing' not in missoes_cols:
        cur.execute("ALTER TABLE missoes ADD COLUMN briefing TEXT")
        db.commit()
    if 'nex' not in missoes_cols:
        cur.execute("ALTER TABLE missoes ADD COLUMN nex INTEGER DEFAULT 0")
        db.commit()
    
    # Ensure 'missao_id' column exists in perimetros table for 1:1 relation
    cur.execute("PRAGMA table_info(perimetros)")
    perimetros_cols = [row[1] for row in cur.fetchall()]
    if 'missao_id' not in perimetros_cols:
        cur.execute("ALTER TABLE perimetros ADD COLUMN missao_id INTEGER")
        db.commit()
    
    # Ensure 'current_jti' column exists in users table for token invalidation
    if 'current_jti' not in user_cols:
        cur.execute("ALTER TABLE users ADD COLUMN current_jti TEXT")
        db.commit()
    
    # Ensure 'comandante_id' column exists in missoes table for older DBs
    cur.execute("PRAGMA table_info(missoes)")
    missoes_cols = [row[1] for row in cur.fetchall()]
    if 'comandante_id' not in missoes_cols:
        cur.execute("ALTER TABLE missoes ADD COLUMN comandante_id INTEGER")
        db.commit()
    
    # Set display_name = username for any users where display_name is NULL
    cur.execute("UPDATE users SET display_name = username WHERE display_name IS NULL")
    db.commit()
    
    # Ensure 'ficha' column exists for older DBs that may lack it
    if 'ficha' not in existing_cols:
        cur.execute("ALTER TABLE nomeados ADD COLUMN ficha TEXT")
        db.commit()
    
    # Ensure 'foto' column exists for older DBs that may lack it
    if 'foto' not in existing_cols:
        cur.execute("ALTER TABLE nomeados ADD COLUMN foto BLOB")
        db.commit()
    
    # Ensure 'perimetro_id' column exists for older DBs
    if 'perimetro_id' not in existing_cols:
        cur.execute("ALTER TABLE nomeados ADD COLUMN perimetro_id INTEGER DEFAULT 1")
        db.commit()

    # populate defaults only if table empty
    cur.execute('SELECT COUNT(1) as cnt FROM nomeados')
    if cur.fetchone()[0] == 0:
        defaults = [
            ("Carol","Gabriela","Estável","Estável","5%","Morte", "https://crisordemparanormal.com/agente/rbZFWe1Xu8NvNT1TPUu9", 'Ativo',1),
            ("Melissa","Alex","Estável","Estável","5%","Energia", "https://crisordemparanormal.com/agente/AX3zIgZANdCzg9H0NOik", 'Ativo',1),
            ("Nabun","Vitor","Estável","Estável","5%","Sangue", "https://crisordemparanormal.com/agente/bg0sHRH7Y6gkl9AUSaKo", 'Ativo',1),
            ("Céline","Maria","Estável","Crítico","20%","Medo", "https://crisordemparanormal.com/agente/p3uonzMGZK1hfLsDWeIS", 'Ativo',1),
            ("Avox","Jade","Estável","Estável","5%","Conhecimento", "https://crisordemparanormal.com/agente/wUJK5DfI7yTmcoKSDeHB", 'Ativo',1),
            ("Luisa","Aimê","Estável","Estável","5%","Conhecimento", "https://crisordemparanormal.com/agente/EhmPKwhUVJWkbCzePmfN", 'Ativo',1),
            ("Silvia","Sabrina","Estável","Estável","???","Morte", "https://crisordemparanormal.com/agente/bgBJW4SMEA39HqOZYvmx", 'Ativo',1),
            ("Mey","Amélia","Estável","Estável","0%","Sangue", None, 'Ativo',1),
        ]
        cur.executemany('INSERT INTO nomeados(simulacro, homunculo, saude, mental, exposicao, afinidade, ficha, status, perimetro_id) VALUES (?,?,?,?,?,?,?,?,?)', defaults)
        db.commit()
    cur.execute('SELECT COUNT(1) as cnt FROM users')
    if cur.fetchone()[0] == 0:
        adminsDef = [
            ("K", "K", "0lh0d0c0rv0", 1, "administrador", "Serafim"),
            ("X", "X", "", 1, "Lider", "Serafim"),
            ("Zimo", "Z", "AdrienJasmin98334", 1, "administrador", "Serafim"),
        ]
        cur.executemany('INSERT INTO users(username, display_name, password, ativo, cargo, grupo) VALUES (?,?,?,?,?,?)', adminsDef)
        db.commit()
    
    # Populate elementos (5 fixed rows) with images from public folder
    cur.execute('SELECT COUNT(1) as cnt FROM elementos')
    if cur.fetchone()[0] == 0:
        # Load images from public folder
        public_folder = Path(__file__).parent.parent.parent / 'public'
        elementos_data = []
        for elem_id, elem_nome in [(1, "Sangue"), (2, "Morte"), (3, "Energia"), (4, "Conhecimento"), (5, "Medo")]:
            img_path = public_folder / f"{elem_nome}.png"
            img_data = None
            if img_path.exists():
                with open(img_path, 'rb') as f:
                    img_data = f.read()
            elementos_data.append((elem_id, elem_nome, img_data))
        cur.executemany('INSERT INTO elementos(id, elemento, imagem) VALUES (?,?,?)', elementos_data)
        db.commit()
    else:
        # Update existing elementos with images if they don't have one
        public_folder = Path(__file__).parent.parent.parent / 'public'
        for elem_id, elem_nome in [(1, "Sangue"), (2, "Morte"), (3, "Energia"), (4, "Conhecimento"), (5, "Medo")]:
            cur.execute('SELECT imagem FROM elementos WHERE id = ?', (elem_id,))
            row = cur.fetchone()
            if row and row[0] is None:
                img_path = public_folder / f"{elem_nome}.png"
                if img_path.exists():
                    with open(img_path, 'rb') as f:
                        img_data = f.read()
                    cur.execute('UPDATE elementos SET imagem = ? WHERE id = ?', (img_data, elem_id))
                    db.commit()
    
    # Migrate existing criatura elementos from text fields to N:N table
    cur.execute('SELECT id, elemento, elementos_adicionais FROM criaturas')
    criaturas_to_migrate = cur.fetchall()
    elem_name_to_id = {"Sangue": 1, "Morte": 2, "Energia": 3, "Conhecimento": 4, "Medo": 5}
    for criatura in criaturas_to_migrate:
        cid, elem_principal, elems_adicionais = criatura
        # Check if already migrated
        cur.execute('SELECT COUNT(1) FROM criatura_elementos WHERE criatura_id = ?', (cid,))
        if cur.fetchone()[0] > 0:
            continue  # Already migrated
        # Add principal element
        if elem_principal and elem_principal in elem_name_to_id:
            try:
                cur.execute('INSERT INTO criatura_elementos(criatura_id, elemento_id, is_principal) VALUES (?, ?, 1)',
                           (cid, elem_name_to_id[elem_principal]))
            except:
                pass
        # Add additional elements
        if elems_adicionais:
            for elem_nome in elems_adicionais.split(','):
                elem_nome = elem_nome.strip()
                if elem_nome and elem_nome in elem_name_to_id:
                    try:
                        cur.execute('INSERT INTO criatura_elementos(criatura_id, elemento_id, is_principal) VALUES (?, ?, 0)',
                                   (cid, elem_name_to_id[elem_nome]))
                    except:
                        pass
        db.commit()
    
    # Populate perimetros (default: Véu da Serra)
    cur.execute('SELECT COUNT(1) as cnt FROM perimetros')
    if cur.fetchone()[0] == 0:
        # Admin padrão é Lukas (id 1)
        cur.execute('INSERT INTO perimetros(id, nome, cidade, class, status, populacao, descricao, admin_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', 
                    (1, "Perimetro 01", "Véu da Serra", "ômega", "Anomalia detectada", 0, "Cidade montanhosa com atividade paranormal frequente", 2))
        db.commit()
    
    db.close()


@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()


class Perimetro:
    instance = None

    def __init__(self, db_path: Path):
        self.db_path = db_path
        self.admin = None

    def start(self):
        Perimetro.instance = self
        # host='0.0.0.0' permite conexões de outros dispositivos na rede (Tailscale)
        app.run(host='0.0.0.0', port=2025, debug=True)


@app.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    username = data.get('username', '')
    password = data.get('password', '')

    db = get_db()
    cur = db.cursor()
    
    # Buscar usuário na tabela users
    cur.execute('SELECT * FROM users WHERE username = ? AND ativo = 1', (username,))
    user = cur.fetchone()
    
    if user is None:
        return jsonify({'erro': 'Credenciais inválidas'}), 401
    
    # Verificar senha se necessário
    if user['password'] and user['password'] != password:
        return jsonify({'erro': 'Credenciais inválidas'}), 401
    
    # Nome de exibição (usa display_name se existir, senão username)
    display_name = user['display_name'] or username
    
    # Gerar jti único para este token (invalida tokens anteriores)
    jti = str(uuid.uuid4())
    
    # Salvar o jti no banco de dados para o usuário
    cur.execute('UPDATE users SET current_jti = ? WHERE id = ?', (jti, user['id']))
    db.commit()
    
    # Gerar JWT token com cargo, grupo e jti do usuário
    payload = {
        'username': username,
        'display_name': display_name,
        'cargo': user['cargo'],
        'grupo': user['grupo'] or 'Observador',
        'user_id': user['id'],
        'jti': jti,  # ID único do token para invalidação
        'exp': datetime.utcnow() + timedelta(hours=24)
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm='HS256')
    
    return jsonify({
        'mensagem': f'Bem-vindo, {display_name}', 
        'admin': username, 
        'display_name': display_name,
        'token': token, 
        'grupo': user['grupo'] or 'Observador'
    }), 200


@app.route('/nomeados', methods=['GET'])
def listar_nomeados():
    db = get_db()
    cur = db.cursor()
    cur.execute('SELECT * FROM nomeados')
    rows = cur.fetchall()
    perfis = [dict(r) for r in rows]
    return jsonify(perfis)


@app.route('/nomeados', methods=['POST'])
def criar_nomeado():
    data = request.get_json() or {}
    fields = ('simulacro', 'homunculo', 'saude', 'mental', 'exposicao', 'afinidade', 'ficha', 'perimetro_id', 'status')
    values = tuple(data.get(f, '') for f in fields)
    db = get_db()
    cur = db.cursor()
    cur.execute('INSERT INTO nomeados(simulacro, homunculo, saude, mental, exposicao, afinidade, ficha, perimetro_id, status) VALUES (?,?,?,?,?,?,?,?,?)', values)
    db.commit()
    nid = cur.lastrowid
    cur.execute('SELECT * FROM nomeados WHERE id = ?', (nid,))
    row = cur.fetchone()
    resultado = dict(row)
    if resultado.get('foto'):
        resultado['foto'] = base64.b64encode(resultado['foto']).decode('utf-8')
    return jsonify(resultado), 201


@app.route('/nomeados/<int:nid>', methods=['GET'])
def obter_nomeado(nid):
    db = get_db()
    cur = db.cursor()
    cur.execute('SELECT * FROM nomeados WHERE id = ?', (nid,))
    row = cur.fetchone()
    if row is None:
        return jsonify({'erro': 'Nomeado não encontrado'}), 404
    
    resultado = dict(row)
    # Converter foto bytes para base64
    if resultado.get('foto'):
        resultado['foto'] = base64.b64encode(resultado['foto']).decode('utf-8')
    
    return jsonify(resultado), 200


@app.route('/nomeados/<int:nid>', methods=['PUT'])
def atualizar_nomeado(nid):
    db = get_db()
    cur = db.cursor()
    
    # Verificar se existe
    cur.execute('SELECT * FROM nomeados WHERE id = ?', (nid,))
    if cur.fetchone() is None:
        return jsonify({'erro': 'Nomeado não encontrado'}), 404
    
    data = request.get_json() or {}
    fields = ('simulacro', 'homunculo', 'saude', 'mental', 'exposicao', 'afinidade', 'ficha', 'perimetro_id', 'status')
    
    # Construir dinamicamente a query UPDATE
    updates = []
    values = []
    for field in fields:
        if field in data:
            updates.append(f'{field} = ?')
            values.append(data[field])
    
    if not updates:
        return jsonify({'erro': 'Nenhum campo para atualizar'}), 400
    
    values.append(nid)
    query = f'UPDATE nomeados SET {", ".join(updates)} WHERE id = ?'
    cur.execute(query, values)
    db.commit()
    
    # Retornar o registro atualizado
    cur.execute('SELECT * FROM nomeados WHERE id = ?', (nid,))
    row = cur.fetchone()
    resultado = dict(row)
    if resultado.get('foto'):
        resultado['foto'] = base64.b64encode(resultado['foto']).decode('utf-8')
    return jsonify(resultado), 200


@app.route('/nomeados/<int:nid>/foto', methods=['PUT'])
def upload_foto_nomeado(nid):
    """Upload de foto para um nomeado (recebe arquivo binário via multipart/form-data)"""
    db = get_db()
    cur = db.cursor()
    
    # Verificar se existe
    cur.execute('SELECT * FROM nomeados WHERE id = ?', (nid,))
    if cur.fetchone() is None:
        return jsonify({'erro': 'Nomeado não encontrado'}), 404
    
    # Recebe arquivo via multipart/form-data
    if 'foto' not in request.files:
        return jsonify({'erro': 'Nenhum arquivo enviado. Use o campo "foto"'}), 400
    
    arquivo = request.files['foto']
    
    if arquivo.filename == '':
        return jsonify({'erro': 'Nenhum arquivo selecionado'}), 400
    
    # Lê os bytes do arquivo
    foto_bytes = arquivo.read()
    
    if len(foto_bytes) == 0:
        return jsonify({'erro': 'Arquivo vazio'}), 400
    
    cur.execute('UPDATE nomeados SET foto = ? WHERE id = ?', (foto_bytes, nid))
    db.commit()
    
    return jsonify({'mensagem': f'Foto do nomeado {nid} atualizada com sucesso'}), 200


@app.route('/nomeados/<int:nid>/foto', methods=['GET'])
def obter_foto_nomeado(nid):
    """Obtém a foto de um nomeado em base64"""
    db = get_db()
    cur = db.cursor()
    
    cur.execute('SELECT foto FROM nomeados WHERE id = ?', (nid,))
    row = cur.fetchone()
    
    if row is None:
        return jsonify({'erro': 'Nomeado não encontrado'}), 404
    
    if row['foto']:
        return jsonify({'foto': base64.b64encode(row['foto']).decode('utf-8')}), 200
    else:
        return jsonify({'foto': None}), 200


@app.route('/nomeados/<int:nid>', methods=['DELETE'])
def deletar_nomeado(nid):
    db = get_db()
    cur = db.cursor()
    
    # Verificar se existe
    cur.execute('SELECT * FROM nomeados WHERE id = ?', (nid,))
    if cur.fetchone() is None:
        return jsonify({'erro': 'Nomeado não encontrado'}), 404
    
    cur.execute('DELETE FROM nomeados WHERE id = ?', (nid,))
    db.commit()
    
    return jsonify({'mensagem': f'Nomeado com ID {nid} deletado com sucesso'}), 200


# ============================================
# WEB SCRAPING - Base Function
# ============================================
def scrape_info(url):
    """
    Função base de web scraping usando Playwright (headless).
    
    Args:
        url (str): URL para fazer o scraping (coluna 'ficha' do nomeado)
        
    Returns:
        dict: Dados extraídos da página
    """
    resultado = {
        'sucesso': False,
        'dados': {},
        'erro': None
    }
    
    try:
        with sync_playwright() as p:
            # Inicia browser em modo headless (invisível)
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            )
            page = context.new_page()
            
            # Navega para a URL
            page.goto(url, timeout=60000)
            
            # Espera o conteúdo JavaScript/Vue carregar
            page.wait_for_timeout(8000)
            
            # ========================================
            # Extrair dados dinamicamente
            # ========================================
            dados = {}
            
            # Buscar Origem
            try:
                origem_inputs = page.query_selector_all('div.info-line')
                for div in origem_inputs:
                    h3 = div.query_selector('h3')
                    if h3 and 'ORIGEM' in h3.inner_text():
                        input_el = div.query_selector('input')
                        if input_el:
                            dados['origem'] = input_el.get_attribute('value') or input_el.input_value()
                        break
            except:
                dados['origem'] = None
            
            # Buscar Classe
            try:
                for div in origem_inputs:
                    h3 = div.query_selector('h3')
                    if h3 and 'CLASSE' in h3.inner_text():
                        input_el = div.query_selector('input')
                        if input_el:
                            dados['classe'] = input_el.get_attribute('value') or input_el.input_value()
                        break
            except:
                dados['classe'] = None
            
            # Buscar NEX
            try:
                nex_input = page.query_selector('div.pe-container input.pe-input')
                if nex_input:
                    dados['nex'] = nex_input.input_value()
            except:
                dados['nex'] = None
            
            # ========================================
            
            browser.close()
            
            resultado['sucesso'] = True
            resultado['dados'] = dados
            
    except Exception as e:
        resultado['erro'] = str(e)
    
    return resultado


@app.route('/scrape/<int:nid>', methods=['GET'])
def scrape_nomeado(nid):
    """
    Endpoint para buscar informações via web scraping para um nomeado específico.
    Pega a URL da coluna 'ficha' do nomeado no banco de dados.
    """
    db = get_db()
    cur = db.cursor()
    
    # Buscar nomeado para pegar a URL da ficha
    cur.execute('SELECT * FROM nomeados WHERE id = ?', (nid,))
    row = cur.fetchone()
    
    if row is None:
        return jsonify({'erro': 'Nomeado não encontrado'}), 404
    
    # Pega a URL da coluna 'ficha'
    url = row['ficha']
    
    if not url:
        return jsonify({'erro': 'URL de ficha não configurada para este nomeado'}), 400
    
    # Executa o scraping
    resultado = scrape_info(url)
    
    if resultado['sucesso']:
        return jsonify(resultado['dados']), 200
    else:
        return jsonify({'erro': resultado['erro']}), 500


# ============================================
# ELEMENTOS - Endpoints
# ============================================
@app.route('/elementos', methods=['GET'])
def listar_elementos():
    """Lista todos os 5 elementos"""
    db = get_db()
    cur = db.cursor()
    cur.execute('SELECT id, elemento, imagem FROM elementos ORDER BY id')
    rows = cur.fetchall()
    elementos = []
    for r in rows:
        elementos.append({
            'id': r['id'],
            'nome': r['elemento'],
            'imagem': base64.b64encode(r['imagem']).decode('utf-8') if r['imagem'] else None
        })
    return jsonify(elementos)


@app.route('/elementos/<int:eid>', methods=['GET'])
def obter_elemento(eid):
    """Obtém um elemento específico pelo ID"""
    db = get_db()
    cur = db.cursor()
    cur.execute('SELECT id, elemento, imagem FROM elementos WHERE id = ?', (eid,))
    row = cur.fetchone()
    if row is None:
        return jsonify({'erro': 'Elemento não encontrado'}), 404
    return jsonify({
        'id': row['id'],
        'nome': row['elemento'],
        'imagem': base64.b64encode(row['imagem']).decode('utf-8') if row['imagem'] else None
    })


@app.route('/elementos/<int:eid>', methods=['PUT'])
def atualizar_elemento(eid):
    """Atualiza a imagem de um elemento (recebe base64)"""
    if eid < 1 or eid > 5:
        return jsonify({'erro': 'ID de elemento inválido (1-5)'}), 400
    
    db = get_db()
    cur = db.cursor()
    
    # Verificar se existe
    cur.execute('SELECT * FROM elementos WHERE id = ?', (eid,))
    if cur.fetchone() is None:
        return jsonify({'erro': 'Elemento não encontrado'}), 404
    
    data = request.get_json() or {}
    
    # Recebe imagem em base64
    imagem_base64 = data.get('imagem')
    if imagem_base64:
        try:
            imagem_bytes = base64.b64decode(imagem_base64)
        except:
            return jsonify({'erro': 'Imagem base64 inválida'}), 400
    else:
        imagem_bytes = None
    
    cur.execute('UPDATE elementos SET imagem = ? WHERE id = ?', (imagem_bytes, eid))
    db.commit()
    
    return jsonify({'mensagem': f'Elemento {eid} atualizado com sucesso'}), 200


@app.route('/register', methods=['POST'])
def register_user():

    data = request.get_json() or {}
    username = data.get('username', '')
    password = data.get('password', '')
    cargo = data.get('cargo', 'usuario')

    if not username or not password:
        return jsonify({'erro': 'Username e password são obrigatórios'}), 400

    db = get_db()
    cur = db.cursor()
    cur.execute('SELECT * FROM admins WHERE username = ?', (username,))
    if cur.fetchone() is not None:
        return jsonify({'erro': 'Usuário já existe'}), 400

    cur.execute('INSERT INTO admins(username, password, ativo, cargo) VALUES (?,?,?,?)',
                (username, password, 1, cargo))
    db.commit()
    return jsonify({'mensagem': f'Usuário {username} registrado com sucesso'}), 201

@app.route('/users', methods=['GET'])
def list_users():
    db = get_db()
    cur = db.cursor()
    cur.execute('SELECT id, username, display_name, ativo, cargo, grupo FROM users')
    rows = cur.fetchall()
    users = [dict(r) for r in rows]
    return jsonify(users)

@app.route('/users', methods=['POST'])
def create_user():
    # Verificar se é Seraphim
    auth = request.headers.get('Authorization')
    user_grupo = 'Observador'
    if auth:
        parts = auth.split()
        if len(parts) == 2 and parts[0].lower() == 'bearer':
            try:
                payload = jwt.decode(parts[1], SECRET_KEY, algorithms=['HS256'])
                user_grupo = payload.get('grupo', 'Observador')
            except:
                pass
    
    if user_grupo != 'Serafim':
        return jsonify({'erro': 'Apenas membros do grupo Serafim podem criar usuários'}), 403
    
    data = request.get_json() or {}
    username = data.get('username', 'Novo Usuário')
    display_name = data.get('display_name', username)
    password = data.get('password', '123456')
    cargo = data.get('cargo', 'administrador')
    ativo = data.get('ativo', 1)
    grupo = data.get('grupo', 'Observador')
    
    db = get_db()
    cur = db.cursor()
    
    cur.execute('INSERT INTO users(username, display_name, password, ativo, cargo, grupo) VALUES (?,?,?,?,?,?)',
                (username, display_name, password, ativo, cargo, grupo))
    db.commit()
    
    new_id = cur.lastrowid
    cur.execute('SELECT id, username, display_name, ativo, cargo, grupo FROM users WHERE id = ?', (new_id,))
    row = cur.fetchone()
    return jsonify(dict(row)), 201

@app.route('/users/<int:nid>', methods=['GET'])
def get_user(nid):
    db = get_db()
    cur = db.cursor()
    cur.execute('SELECT id, username, display_name, ativo, cargo, grupo FROM users WHERE id = ?', (nid,))
    row = cur.fetchone()
    if row is None:
        return jsonify({'erro': 'Usuário não encontrado'}), 404
    return jsonify(dict(row)), 200

@app.route('/users/<int:nid>', methods=['PUT'])
def update_user(nid):
    db = get_db()
    cur = db.cursor()
    
    # Verificar se existe
    cur.execute('SELECT * FROM users WHERE id = ?', (nid,))
    if cur.fetchone() is None:
        return jsonify({'erro': 'Usuário não encontrado'}), 404
    
    # Extrair grupo do usuário logado do token
    auth = request.headers.get('Authorization')
    user_grupo = 'Observador'
    user_id_from_token = None
    if auth:
        parts = auth.split()
        if len(parts) == 2 and parts[0].lower() == 'bearer':
            try:
                payload = jwt.decode(parts[1], SECRET_KEY, algorithms=['HS256'])
                user_grupo = payload.get('grupo', 'Observador')
                user_id_from_token = payload.get('user_id')
            except:
                pass
    
    data = request.get_json() or {}
    
    # X (ID 2) tem permissões especiais - pode alterar tudo sem restrições
    is_x = user_id_from_token == 2
    
    # Campos que qualquer usuário pode alterar no próprio perfil
    basic_fields = ('username', 'display_name', 'password')
    # Campos que Seraphim pode alterar (cargo e ativo)
    seraphim_fields = ('cargo', 'ativo')
    # Campo grupo NÃO pode ser alterado (exceto por X)
    
    # Verificar permissões
    is_seraphim = user_grupo == 'Serafim'
    is_own_profile = user_id_from_token == nid
    
    # Construir dinamicamente a query UPDATE
    updates = []
    values = []
    
    for field in basic_fields:
        if field in data:
            # Usuário pode editar próprio perfil, Seraphim ou X pode editar qualquer um
            if is_own_profile or is_seraphim or is_x:
                updates.append(f'{field} = ?')
                values.append(data[field])
    
    for field in seraphim_fields:
        if field in data:
            # Seraphim ou X pode editar esses campos
            if is_seraphim or is_x:
                updates.append(f'{field} = ?')
                values.append(data[field])
            else:
                return jsonify({'erro': f'Apenas membros do grupo Serafim podem alterar o campo {field}'}), 403
    
    # Campo 'grupo' - APENAS X pode alterar
    if 'grupo' in data:
        if is_x:
            updates.append('grupo = ?')
            values.append(data['grupo'])
        else:
            return jsonify({'erro': 'O campo grupo não pode ser alterado'}), 403
    
    if not updates:
        return jsonify({'erro': 'Nenhum campo para atualizar'}), 400
    
    values.append(nid)
    query = f'UPDATE users SET {", ".join(updates)} WHERE id = ?'
    cur.execute(query, values)
    db.commit()
    
    # Retornar o registro atualizado (sem foto e senha)
    cur.execute('SELECT id, username, display_name, ativo, cargo, grupo FROM users WHERE id = ?', (nid,))
    row = cur.fetchone()
    return jsonify(dict(row)), 200

@app.route('/users/<int:nid>', methods=['DELETE'])
def delete_user(nid):
    db = get_db()
    cur = db.cursor()
    
    # Verificar se existe
    cur.execute('SELECT * FROM users WHERE id = ?', (nid,))
    if cur.fetchone() is None:
        return jsonify({'erro': 'Usuário não encontrado'}), 404
    
    cur.execute('DELETE FROM users WHERE id = ?', (nid,))
    db.commit()
    
    return jsonify({'mensagem': f'Usuário com ID {nid} deletado com sucesso'}), 200


@app.route('/users/<int:nid>/foto', methods=['PUT'])
def upload_foto_user(nid):
    """Upload de foto para um usuário (recebe arquivo binário via multipart/form-data)"""
    db = get_db()
    cur = db.cursor()
    
    # Verificar se existe
    cur.execute('SELECT * FROM users WHERE id = ?', (nid,))
    if cur.fetchone() is None:
        return jsonify({'erro': 'Usuário não encontrado'}), 404
    
    # Recebe arquivo via multipart/form-data
    if 'foto' not in request.files:
        return jsonify({'erro': 'Nenhum arquivo enviado. Use o campo "foto"'}), 400
    
    arquivo = request.files['foto']
    
    if arquivo.filename == '':
        return jsonify({'erro': 'Nenhum arquivo selecionado'}), 400
    
    # Lê os bytes do arquivo
    foto_bytes = arquivo.read()
    
    if len(foto_bytes) == 0:
        return jsonify({'erro': 'Arquivo vazio'}), 400
    
    cur.execute('UPDATE users SET foto = ? WHERE id = ?', (foto_bytes, nid))
    db.commit()
    
    return jsonify({'mensagem': f'Foto do usuário {nid} atualizada com sucesso'}), 200


@app.route('/users/<int:nid>/foto', methods=['GET'])
def obter_foto_user(nid):
    """Obtém a foto de um usuário em base64"""
    db = get_db()
    cur = db.cursor()
    
    cur.execute('SELECT foto FROM users WHERE id = ?', (nid,))
    row = cur.fetchone()
    
    if row is None:
        return jsonify({'erro': 'Usuário não encontrado'}), 404
    
    if row['foto']:
        return jsonify({'foto': base64.b64encode(row['foto']).decode('utf-8')}), 200
    else:
        return jsonify({'foto': None}), 200


@app.route('/users/me', methods=['GET'])
def get_current_user():
    """Obtém os dados do usuário logado (via token JWT)"""
    auth = request.headers.get('Authorization')
    if not auth:
        return jsonify({'erro': 'Não autenticado'}), 401
    
    parts = auth.split()
    if len(parts) != 2 or parts[0].lower() != 'bearer':
        return jsonify({'erro': 'Token inválido'}), 401
    
    token = parts[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        username = payload.get('username')
    except:
        return jsonify({'erro': 'Token inválido'}), 401
    
    db = get_db()
    cur = db.cursor()
    
    cur.execute('SELECT id, username, display_name, ativo, cargo, grupo FROM users WHERE username = ?', (username,))
    row = cur.fetchone()
    
    if row is None:
        return jsonify({'erro': 'Usuário não encontrado'}), 404
    
    return jsonify(dict(row)), 200

@app.route('/users/me', methods=['PUT'])
def update_current_user():
    """Atualiza os dados do usuário logado (via token JWT)"""
    auth = request.headers.get('Authorization')
    if not auth:
        return jsonify({'erro': 'Não autenticado'}), 401
    
    parts = auth.split()
    if len(parts) != 2 or parts[0].lower() != 'bearer':
        return jsonify({'erro': 'Token inválido'}), 401
    
    token = parts[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        username = payload.get('username')
    except:
        return jsonify({'erro': 'Token inválido'}), 401
    
    db = get_db()
    cur = db.cursor()
    
    # Verificar se existe
    cur.execute('SELECT * FROM users WHERE username = ?', (username,))
    user = cur.fetchone()
    if user is None:
        return jsonify({'erro': 'Usuário não encontrado'}), 404
    
    data = request.get_json() or {}
    fields = ('username', 'display_name', 'password')
    
    # Construir dinamicamente a query UPDATE
    updates = []
    values = []
    for field in fields:
        if field in data:
            updates.append(f'{field} = ?')
            values.append(data[field])
    
    if not updates:
        return jsonify({'erro': 'Nenhum campo para atualizar'}), 400
    
    values.append(user['id'])
    query = f'UPDATE users SET {", ".join(updates)} WHERE id = ?'
    cur.execute(query, values)
    db.commit()
    
    # Retornar o registro atualizado
    cur.execute('SELECT id, username, display_name, ativo, cargo, grupo FROM users WHERE id = ?', (user['id'],))
    row = cur.fetchone()
    return jsonify(dict(row)), 200

@app.route('/users/me/foto', methods=['PUT'])
def upload_minha_foto():
    """Upload de foto para o usuário logado (via token JWT)"""
    auth = request.headers.get('Authorization')
    if not auth:
        return jsonify({'erro': 'Não autenticado'}), 401
    
    parts = auth.split()
    if len(parts) != 2 or parts[0].lower() != 'bearer':
        return jsonify({'erro': 'Token inválido'}), 401
    
    token = parts[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        username = payload.get('username')
    except:
        return jsonify({'erro': 'Token inválido'}), 401
    
    db = get_db()
    cur = db.cursor()
    
    # Buscar usuário pelo username
    cur.execute('SELECT id FROM users WHERE username = ?', (username,))
    user = cur.fetchone()
    if user is None:
        return jsonify({'erro': 'Usuário não encontrado'}), 404
    
    # Recebe arquivo via multipart/form-data
    if 'foto' not in request.files:
        return jsonify({'erro': 'Nenhum arquivo enviado. Use o campo "foto"'}), 400
    
    arquivo = request.files['foto']
    
    if arquivo.filename == '':
        return jsonify({'erro': 'Nenhum arquivo selecionado'}), 400
    
    foto_bytes = arquivo.read()
    
    if len(foto_bytes) == 0:
        return jsonify({'erro': 'Arquivo vazio'}), 400
    
    cur.execute('UPDATE users SET foto = ? WHERE id = ?', (foto_bytes, user['id']))
    db.commit()
    
    return jsonify({'mensagem': 'Foto atualizada com sucesso'}), 200


@app.route('/users/me/foto', methods=['GET'])
def obter_minha_foto():
    """Obtém a foto do usuário logado em base64"""
    auth = request.headers.get('Authorization')
    if not auth:
        return jsonify({'erro': 'Não autenticado'}), 401
    
    parts = auth.split()
    if len(parts) != 2 or parts[0].lower() != 'bearer':
        return jsonify({'erro': 'Token inválido'}), 401
    
    token = parts[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        username = payload.get('username')
    except:
        return jsonify({'erro': 'Token inválido'}), 401
    
    db = get_db()
    cur = db.cursor()
    
    cur.execute('SELECT foto FROM users WHERE username = ?', (username,))
    row = cur.fetchone()
    
    if row is None:
        return jsonify({'erro': 'Usuário não encontrado'}), 404
    
    if row['foto']:
        return jsonify({'foto': base64.b64encode(row['foto']).decode('utf-8')}), 200
    else:
        return jsonify({'foto': None}), 200


@app.route('/emergencia', methods=['POST'])
def db_restart():
    # Verificar o cargo do usuário logado através do token JWT
    auth = request.headers.get('Authorization')
    if not auth:
        return jsonify({'erro': 'Permissão negada'}), 403
    
    parts = auth.split()
    if len(parts) != 2 or parts[0].lower() != 'bearer':
        return jsonify({'erro': 'Permissão negada'}), 403
    
    token = parts[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        cargo = payload.get('cargo')
        username = payload.get('username')
        
        # Só permite administrador ou ??? resetar o DB
        if cargo not in ("Administrador", "Lider"):
            return jsonify({'erro': 'Permissão negada'}), 403
            
    except jwt.ExpiredSignatureError:
        return jsonify({'erro': 'Token expirado'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'erro': 'Token inválido'}), 401

    # Fechar conexão atual antes de remover o arquivo
    if getattr(g, '_database', None) is not None:
        try:
            g._database.close()
        except Exception:
            pass
        delattr(g, '_database')

    if DATABASE.exists():
        DATABASE.unlink()
    init_db()
    return jsonify({'mensagem': f'Banco reiniciado por {username}'}), 200


# ===================== ROTAS DE PERIMETROS =====================

@app.route('/perimetros', methods=['GET'])
def list_perimetros():
    """Lista todos os perímetros"""
    db = get_db()
    cur = db.cursor()
    cur.execute('''
        SELECT p.id, p.nome, p.cidade, p.class, p.status, p.populacao, p.descricao, p.admin_id, p.missao_id,
               u.display_name as admin_nome,
               m.nome as missao_nome, m.status as missao_status
        FROM perimetros p
        LEFT JOIN users u ON p.admin_id = u.id
        LEFT JOIN missoes m ON p.missao_id = m.id
    ''')
    rows = cur.fetchall()
    
    result = []
    for row in rows:
        # Contar homunculos neste perimetro
        cur.execute('SELECT COUNT(*) FROM nomeados WHERE perimetro_id = ?', (row['id'],))
        count = cur.fetchone()[0]
        cur.execute('SELECT * FROM nomeados WHERE perimetro_id = ?', (row['id'],))
        nomeados = []
        for n in cur.fetchall():
            n_dict = dict(n)
            if n_dict.get('foto'):
                n_dict['foto'] = base64.b64encode(n_dict['foto']).decode('utf-8')
            else:
                n_dict['foto'] = None
            nomeados.append(n_dict)
        result.append({
            'id': row['id'],
            'nome': row['nome'],
            'descricao': row['descricao'],
            'cidade': row['cidade'],
            'class': row['class'],
            'status': row['status'],
            'populacao': row['populacao'],
            'admin_id': row['admin_id'],
            'admin_nome': row['admin_nome'],
            'missao_id': row['missao_id'],
            'missao_nome': row['missao_nome'],
            'missao_status': row['missao_status'],
            'homunculos_count': count,
            'homunculos': nomeados
        })
    
    return jsonify(result), 200


@app.route('/perimetros/<int:pid>', methods=['GET'])
def get_perimetro(pid):
    """Retorna um perímetro específico"""
    db = get_db()
    cur = db.cursor()
    cur.execute('''
        SELECT p.id, p.nome, p.cidade, p.class, p.status, p.populacao, p.descricao, p.admin_id, p.missao_id,
               u.display_name as admin_nome,
               m.nome as missao_nome, m.status as missao_status
        FROM perimetros p
        LEFT JOIN users u ON p.admin_id = u.id
        LEFT JOIN missoes m ON p.missao_id = m.id
        WHERE p.id = ?
    ''', (pid,))
    row = cur.fetchone()
    
    if row is None:
        return jsonify({'erro': 'Perímetro não encontrado'}), 404
    
    # Contar homunculos neste perimetro
    cur.execute('SELECT COUNT(*) FROM nomeados WHERE perimetro_id = ?', (pid,))
    count = cur.fetchone()[0]
    cur.execute('SELECT * FROM nomeados WHERE perimetro_id = ?', (row['id'],))
    nomeados = []
    for n in cur.fetchall():
        n_dict = dict(n)
        if n_dict.get('foto'):
            n_dict['foto'] = base64.b64encode(n_dict['foto']).decode('utf-8')
        else:
            n_dict['foto'] = None
        nomeados.append(n_dict)
        
    return jsonify({
        'id': row['id'],
        'nome': row['nome'],
        'descricao': row['descricao'],
        'cidade': row['cidade'],
        'class': row['class'],
        'status': row['status'],
        'populacao': row['populacao'],
        'admin_id': row['admin_id'],
        'admin_nome': row['admin_nome'],
        'missao_id': row['missao_id'],
        'missao_nome': row['missao_nome'],
        'missao_status': row['missao_status'],
        'homunculos_count': count,
        'homunculos': nomeados
    }), 200


@app.route('/perimetros', methods=['POST'])
def create_perimetro():
    """Cria um novo perímetro"""
    data = request.get_json() or {}
    
    nome = data.get('nome')
    if not nome:
        return jsonify({'erro': 'Nome é obrigatório'}), 400
    
    descricao = data.get('descricao', '')
    admin_id = data.get('admin_id')
    
    db = get_db()
    cur = db.cursor()
    cur.execute('INSERT INTO perimetros(nome, cidade, class, status, populacao, descricao, admin_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
                (nome, data.get('cidade'), data.get('class'), data.get('status'), data.get('populacao'), descricao, admin_id))
    db.commit()
    
    new_id = cur.lastrowid
    return jsonify({'id': new_id, 'nome': nome, 'cidade': data.get('cidade'), 'class': data.get('class'), 'status': data.get('status'), 'populacao': data.get('populacao'), 'descricao': descricao, 'admin_id': admin_id}), 201


@app.route('/perimetros/<int:pid>', methods=['PUT'])
def update_perimetro(pid):
    """Atualiza um perímetro"""
    db = get_db()
    cur = db.cursor()
    
    cur.execute('SELECT * FROM perimetros WHERE id = ?', (pid,))
    if cur.fetchone() is None:
        return jsonify({'erro': 'Perímetro não encontrado'}), 404
    
    data = request.get_json() or {}
    
    updates = []
    values = []
    
    if 'nome' in data:
        updates.append('nome = ?')
        values.append(data['nome'])
    if 'descricao' in data:
        updates.append('descricao = ?')
        values.append(data['descricao'])
    if 'admin_id' in data:
        updates.append('admin_id = ?')
        values.append(data['admin_id'])
    if 'cidade' in data:
        updates.append('cidade = ?')
        values.append(data['cidade'])
    if 'class' in data:
        updates.append('class = ?')
        values.append(data['class'])
    if 'status' in data:
        updates.append('status = ?')
        values.append(data['status'])
    if 'populacao' in data:
        updates.append('populacao = ?')
        values.append(data['populacao'])
    if 'missao_id' in data:
        updates.append('missao_id = ?')
        # Permitir null para desvincular missão
        values.append(data['missao_id'] if data['missao_id'] else None)
    if not updates:
        return jsonify({'erro': 'Nenhum campo para atualizar'}), 400
    
    values.append(pid)
    query = f'UPDATE perimetros SET {", ".join(updates)} WHERE id = ?'
    cur.execute(query, values)
    db.commit()
    
    cur.execute('SELECT id, nome, cidade, class, status, populacao, descricao, admin_id, missao_id FROM perimetros WHERE id = ?', (pid,))
    row = cur.fetchone()
    return jsonify(dict(row)), 200


@app.route('/perimetros/<int:pid>', methods=['DELETE'])
def delete_perimetro(pid):
    """Deleta um perímetro"""
    db = get_db()
    cur = db.cursor()
    
    cur.execute('SELECT * FROM perimetros WHERE id = ?', (pid,))
    if cur.fetchone() is None:
        return jsonify({'erro': 'Perímetro não encontrado'}), 404
    
    cur.execute('DELETE FROM perimetros WHERE id = ?', (pid,))
    db.commit()
    
    return jsonify({'mensagem': 'Perímetro deletado com sucesso'}), 200


@app.route('/perimetros/<int:pid>/nomeados', methods=['GET'])
def get_nomeados_perimetro(pid):
    """Lista todos os nomeados/homunculos de um perímetro"""
    db = get_db()
    cur = db.cursor()
    
    cur.execute('SELECT * FROM perimetros WHERE id = ?', (pid,))
    if cur.fetchone() is None:
        return jsonify({'erro': 'Perímetro não encontrado'}), 404
    
    cur.execute('SELECT id, simulacro, homunculo, saude, mental, exposicao, afinidade, ficha FROM nomeados WHERE perimetro_id = ?', (pid,))
    rows = cur.fetchall()
    
    return jsonify([dict(row) for row in rows]), 200


# ===================== ROTAS DE MISSÕES =====================

@app.route('/missoes', methods=['GET'])
def list_missoes():
    """Lista todas as missões com seus agentes"""
    db = get_db()
    cur = db.cursor()
    cur.execute('''
        SELECT m.id, m.nome, m.descricao, m.briefing, m.nex, m.status, m.data_criacao, m.data_conclusao, m.criado_por,
               m.comandante_id, u.display_name as criador_nome, c.display_name as comandante_nome
        FROM missoes m
        LEFT JOIN users u ON m.criado_por = u.id
        LEFT JOIN users c ON m.comandante_id = c.id
        ORDER BY m.id DESC
    ''')
    missoes = []
    for row in cur.fetchall():
        missao = dict(row)
        # Buscar foto do comandante
        if missao.get('comandante_id'):
            cur2 = db.cursor()
            cur2.execute('SELECT foto FROM users WHERE id = ?', (missao['comandante_id'],))
            cmd_foto = cur2.fetchone()
            if cmd_foto and cmd_foto['foto']:
                missao['comandante_foto'] = base64.b64encode(cmd_foto['foto']).decode('utf-8')
            else:
                missao['comandante_foto'] = None
        else:
            missao['comandante_foto'] = None
        # Buscar agentes desta missão
        cur.execute('''
            SELECT u.id, u.username, u.display_name, u.cargo, u.grupo, ma.data_atribuicao
            FROM missao_agentes ma
            JOIN users u ON ma.user_id = u.id
            WHERE ma.missao_id = ?
        ''', (row['id'],))
        agentes = []
        for agente_row in cur.fetchall():
            agente = dict(agente_row)
            # Buscar foto do agente
            cur2 = db.cursor()
            cur2.execute('SELECT foto FROM users WHERE id = ?', (agente['id'],))
            foto_row = cur2.fetchone()
            if foto_row and foto_row['foto']:
                agente['foto'] = base64.b64encode(foto_row['foto']).decode('utf-8')
            else:
                agente['foto'] = None
            agentes.append(agente)
        missao['agentes'] = agentes
        missao['agentes_count'] = len(agentes)
        
        # Buscar perímetro vinculado a esta missão
        cur2 = db.cursor()
        cur2.execute('''
            SELECT p.id, p.nome, p.cidade, p.class, p.status, p.populacao, p.descricao
            FROM perimetros p
            WHERE p.missao_id = ?
        ''', (row['id'],))
        perimetro_row = cur2.fetchone()
        if perimetro_row:
            perimetro = dict(perimetro_row)
            # Buscar homunculos do perímetro
            cur2.execute('SELECT id, simulacro, homunculo, saude, mental, status FROM nomeados WHERE perimetro_id = ?', (perimetro['id'],))
            homunculos = [dict(h) for h in cur2.fetchall()]
            perimetro['homunculos'] = homunculos
            perimetro['homunculos_count'] = len(homunculos)
            missao['perimetro'] = perimetro
        else:
            missao['perimetro'] = None
        
        missoes.append(missao)
    
    return jsonify(missoes), 200


@app.route('/missoes/<int:mid>', methods=['GET'])
def get_missao(mid):
    """Retorna uma missão específica com seus agentes"""
    db = get_db()
    cur = db.cursor()
    cur.execute('''
        SELECT m.id, m.nome, m.descricao, m.briefing, m.nex, m.status, m.data_criacao, m.data_conclusao, m.criado_por,
               m.comandante_id, u.display_name as criador_nome, c.display_name as comandante_nome
        FROM missoes m
        LEFT JOIN users u ON m.criado_por = u.id
        LEFT JOIN users c ON m.comandante_id = c.id
        WHERE m.id = ?
    ''', (mid,))
    row = cur.fetchone()
    
    if row is None:
        return jsonify({'erro': 'Missão não encontrada'}), 404
    
    missao = dict(row)
    # Buscar foto do comandante
    if missao.get('comandante_id'):
        cur2 = db.cursor()
        cur2.execute('SELECT foto FROM users WHERE id = ?', (missao['comandante_id'],))
        cmd_foto = cur2.fetchone()
        if cmd_foto and cmd_foto['foto']:
            missao['comandante_foto'] = base64.b64encode(cmd_foto['foto']).decode('utf-8')
        else:
            missao['comandante_foto'] = None
    else:
        missao['comandante_foto'] = None
    # Buscar agentes desta missão
    cur.execute('''
        SELECT u.id, u.username, u.display_name, u.cargo, u.grupo, ma.data_atribuicao
        FROM missao_agentes ma
        JOIN users u ON ma.user_id = u.id
        WHERE ma.missao_id = ?
    ''', (mid,))
    agentes = []
    for agente_row in cur.fetchall():
        agente = dict(agente_row)
        # Buscar foto do agente
        cur2 = db.cursor()
        cur2.execute('SELECT foto FROM users WHERE id = ?', (agente['id'],))
        foto_row = cur2.fetchone()
        if foto_row and foto_row['foto']:
            agente['foto'] = base64.b64encode(foto_row['foto']).decode('utf-8')
        else:
            agente['foto'] = None
        agentes.append(agente)
    missao['agentes'] = agentes
    missao['agentes_count'] = len(agentes)
    
    # Buscar perímetro vinculado a esta missão
    cur2 = db.cursor()
    cur2.execute('''
        SELECT p.id, p.nome, p.cidade, p.class, p.status, p.populacao, p.descricao
        FROM perimetros p
        WHERE p.missao_id = ?
    ''', (mid,))
    perimetro_row = cur2.fetchone()
    if perimetro_row:
        perimetro = dict(perimetro_row)
        # Buscar homunculos do perímetro
        cur2.execute('SELECT id, simulacro, homunculo, saude, mental, status FROM nomeados WHERE perimetro_id = ?', (perimetro['id'],))
        homunculos = [dict(h) for h in cur2.fetchall()]
        perimetro['homunculos'] = homunculos
        perimetro['homunculos_count'] = len(homunculos)
        missao['perimetro'] = perimetro
    else:
        missao['perimetro'] = None
    
    return jsonify(missao), 200


@app.route('/missoes', methods=['POST'])
def create_missao():
    """Cria uma nova missão"""
    data = request.get_json() or {}
    
    nome = data.get('nome')
    if not nome:
        return jsonify({'erro': 'Nome é obrigatório'}), 400
    
    comandante_id = data.get('comandante_id')
    if not comandante_id:
        return jsonify({'erro': 'Comandante da missão é obrigatório'}), 400
    
    descricao = data.get('descricao', '')
    briefing = data.get('briefing', '')
    nex = data.get('nex', 0)
    
    # Validar NEX (0-100)
    try:
        nex = int(nex)
        if nex < 0: nex = 0
        if nex > 100: nex = 100
    except:
        nex = 0
    
    status = data.get('status', 'Não Iniciada')
    
    # Status válidos
    status_validos = ['Não Iniciada', 'Fase de Preparação', 'Em Andamento', 'Concluída', 'Falha']
    if status not in status_validos:
        status = 'Não Iniciada'
    
    # Verificar se o comandante existe
    db = get_db()
    cur = db.cursor()
    cur.execute('SELECT id, display_name FROM users WHERE id = ?', (comandante_id,))
    comandante = cur.fetchone()
    if comandante is None:
        return jsonify({'erro': 'Comandante não encontrado'}), 404
    
    # Obter ID do criador do token
    criado_por = None
    auth = request.headers.get('Authorization')
    if auth:
        parts = auth.split()
        if len(parts) == 2 and parts[0].lower() == 'bearer':
            try:
                payload = jwt.decode(parts[1], SECRET_KEY, algorithms=['HS256'])
                criado_por = payload.get('user_id')
            except:
                pass
    
    data_criacao = datetime.utcnow().isoformat()
    
    cur.execute('''
        INSERT INTO missoes(nome, descricao, briefing, nex, status, data_criacao, criado_por, comandante_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (nome, descricao, briefing, nex, status, data_criacao, criado_por, comandante_id))
    db.commit()
    
    new_id = cur.lastrowid
    return jsonify({
        'id': new_id, 
        'nome': nome, 
        'descricao': descricao,
        'briefing': briefing,
        'nex': nex,
        'status': status,
        'data_criacao': data_criacao,
        'criado_por': criado_por,
        'comandante_id': comandante_id,
        'comandante_nome': comandante['display_name'],
        'agentes': [],
        'agentes_count': 0
    }), 201


@app.route('/missoes/<int:mid>', methods=['PUT'])
def update_missao(mid):
    """Atualiza uma missão"""
    db = get_db()
    cur = db.cursor()
    
    cur.execute('SELECT * FROM missoes WHERE id = ?', (mid,))
    if cur.fetchone() is None:
        return jsonify({'erro': 'Missão não encontrada'}), 404
    
    data = request.get_json() or {}
    
    updates = []
    values = []
    
    if 'nome' in data:
        updates.append('nome = ?')
        values.append(data['nome'])
    if 'descricao' in data:
        updates.append('descricao = ?')
        values.append(data['descricao'])
    if 'briefing' in data:
        updates.append('briefing = ?')
        values.append(data['briefing'])
    if 'nex' in data:
        try:
            nex = int(data['nex'])
            if nex < 0: nex = 0
            if nex > 100: nex = 100
            updates.append('nex = ?')
            values.append(nex)
        except:
            pass
    if 'comandante_id' in data:
        # Verificar se o comandante existe
        cur.execute('SELECT id FROM users WHERE id = ?', (data['comandante_id'],))
        if cur.fetchone() is None:
            return jsonify({'erro': 'Comandante não encontrado'}), 404
        updates.append('comandante_id = ?')
        values.append(data['comandante_id'])
    if 'status' in data:
        status_validos = ['Não Iniciada', 'Fase de Preparação', 'Em Andamento', 'Concluída', 'Falha']
        if data['status'] in status_validos:
            updates.append('status = ?')
            values.append(data['status'])
            # Se concluída ou falha, adicionar data de conclusão
            if data['status'] in ['Concluída', 'Falha']:
                updates.append('data_conclusao = ?')
                values.append(datetime.utcnow().isoformat())
    
    if not updates:
        return jsonify({'erro': 'Nenhum campo para atualizar'}), 400
    
    values.append(mid)
    query = f'UPDATE missoes SET {", ".join(updates)} WHERE id = ?'
    cur.execute(query, values)
    db.commit()
    
    # Retornar missão atualizada
    cur.execute('SELECT * FROM missoes WHERE id = ?', (mid,))
    row = cur.fetchone()
    return jsonify(dict(row)), 200


@app.route('/missoes/<int:mid>', methods=['DELETE'])
def delete_missao(mid):
    """Deleta uma missão e suas associações com agentes"""
    db = get_db()
    cur = db.cursor()
    
    cur.execute('SELECT * FROM missoes WHERE id = ?', (mid,))
    if cur.fetchone() is None:
        return jsonify({'erro': 'Missão não encontrada'}), 404
    
    # Deletar associações primeiro
    cur.execute('DELETE FROM missao_agentes WHERE missao_id = ?', (mid,))
    # Deletar missão
    cur.execute('DELETE FROM missoes WHERE id = ?', (mid,))
    db.commit()
    
    return jsonify({'mensagem': 'Missão deletada com sucesso'}), 200


# ===================== ROTAS DE AGENTES EM MISSÕES =====================

@app.route('/missoes/<int:mid>/agentes', methods=['GET'])
def get_agentes_missao(mid):
    """Lista todos os agentes de uma missão"""
    db = get_db()
    cur = db.cursor()
    
    cur.execute('SELECT * FROM missoes WHERE id = ?', (mid,))
    if cur.fetchone() is None:
        return jsonify({'erro': 'Missão não encontrada'}), 404
    
    cur.execute('''
        SELECT u.id, u.username, u.display_name, u.cargo, u.grupo, ma.data_atribuicao
        FROM missao_agentes ma
        JOIN users u ON ma.user_id = u.id
        WHERE ma.missao_id = ?
    ''', (mid,))
    
    agentes = []
    for row in cur.fetchall():
        agente = dict(row)
        # Buscar foto
        cur2 = db.cursor()
        cur2.execute('SELECT foto FROM users WHERE id = ?', (agente['id'],))
        foto_row = cur2.fetchone()
        if foto_row and foto_row['foto']:
            agente['foto'] = base64.b64encode(foto_row['foto']).decode('utf-8')
        else:
            agente['foto'] = None
        agentes.append(agente)
    
    return jsonify(agentes), 200


@app.route('/missoes/<int:mid>/agentes', methods=['POST'])
def add_agente_missao(mid):
    """Adiciona um agente a uma missão"""
    db = get_db()
    cur = db.cursor()
    
    cur.execute('SELECT * FROM missoes WHERE id = ?', (mid,))
    if cur.fetchone() is None:
        return jsonify({'erro': 'Missão não encontrada'}), 404
    
    data = request.get_json() or {}
    user_id = data.get('user_id')
    
    if not user_id:
        return jsonify({'erro': 'user_id é obrigatório'}), 400
    
    # Verificar se usuário existe
    cur.execute('SELECT id, username, display_name FROM users WHERE id = ?', (user_id,))
    user = cur.fetchone()
    if user is None:
        return jsonify({'erro': 'Usuário não encontrado'}), 404
    
    # Verificar se já está na missão
    cur.execute('SELECT * FROM missao_agentes WHERE missao_id = ? AND user_id = ?', (mid, user_id))
    if cur.fetchone() is not None:
        return jsonify({'erro': 'Agente já está nesta missão'}), 400
    
    data_atribuicao = datetime.utcnow().isoformat()
    cur.execute('INSERT INTO missao_agentes(missao_id, user_id, data_atribuicao) VALUES (?, ?, ?)',
                (mid, user_id, data_atribuicao))
    db.commit()
    
    # Buscar foto do usuário
    cur.execute('SELECT foto FROM users WHERE id = ?', (user_id,))
    foto_row = cur.fetchone()
    foto = base64.b64encode(foto_row['foto']).decode('utf-8') if foto_row and foto_row['foto'] else None
    
    return jsonify({
        'mensagem': f'Agente {user["display_name"]} adicionado à missão',
        'agente': {
            'id': user['id'],
            'username': user['username'],
            'display_name': user['display_name'],
            'data_atribuicao': data_atribuicao,
            'foto': foto
        }
    }), 201


@app.route('/missoes/<int:mid>/agentes/<int:uid>', methods=['DELETE'])
def remove_agente_missao(mid, uid):
    """Remove um agente de uma missão"""
    db = get_db()
    cur = db.cursor()
    
    cur.execute('SELECT * FROM missoes WHERE id = ?', (mid,))
    if cur.fetchone() is None:
        return jsonify({'erro': 'Missão não encontrada'}), 404
    
    cur.execute('SELECT * FROM missao_agentes WHERE missao_id = ? AND user_id = ?', (mid, uid))
    if cur.fetchone() is None:
        return jsonify({'erro': 'Agente não está nesta missão'}), 404
    
    cur.execute('DELETE FROM missao_agentes WHERE missao_id = ? AND user_id = ?', (mid, uid))
    db.commit()
    
    return jsonify({'mensagem': 'Agente removido da missão'}), 200


@app.route('/missoes/<int:mid>/notificar', methods=['POST'])
def notificar_agentes_missao(mid):
    """Notifica os agentes de uma missão (apenas o comandante pode notificar)"""
    db = get_db()
    cur = db.cursor()
    
    # Buscar missão
    cur.execute('SELECT * FROM missoes WHERE id = ?', (mid,))
    missao = cur.fetchone()
    if missao is None:
        return jsonify({'erro': 'Missão não encontrada'}), 404
    
    # Verificar se o usuário logado é o comandante
    auth = request.headers.get('Authorization')
    user_id = None
    if auth:
        parts = auth.split()
        if len(parts) == 2 and parts[0].lower() == 'bearer':
            try:
                payload = jwt.decode(parts[1], SECRET_KEY, algorithms=['HS256'])
                user_id = payload.get('user_id')
            except:
                pass
    
    if user_id != missao['comandante_id']:
        return jsonify({'erro': 'Apenas o comandante da missão pode notificar os agentes'}), 403
    
    data = request.get_json() or {}
    mensagem = data.get('mensagem', '')
    
    if not mensagem.strip():
        return jsonify({'erro': 'Mensagem é obrigatória'}), 400
    
    # Buscar agentes da missão
    cur.execute('''
        SELECT u.id, u.username, u.display_name 
        FROM missao_agentes ma
        JOIN users u ON ma.user_id = u.id
        WHERE ma.missao_id = ?
    ''', (mid,))
    agentes = cur.fetchall()
    
    if len(agentes) == 0:
        return jsonify({'erro': 'Nenhum agente designado para esta missão'}), 400
    
    # Criar notificação para cada agente no banco de dados
    data_criacao = datetime.utcnow().isoformat()
    titulo = f"Missão: {missao['nome']}"
    
    for agente in agentes:
        cur.execute('''
            INSERT INTO notificacoes (user_id, tipo, titulo, mensagem, missao_id, remetente_id, lida, data_criacao)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (agente['id'], 'missao', titulo, mensagem, mid, user_id, 0, data_criacao))
    db.commit()
    
    agentes_nomes = [a['display_name'] for a in agentes]
    print(f"[NOTIFICAÇÃO] Missão '{missao['nome']}' - Comandante notificou: {agentes_nomes}")
    print(f"[NOTIFICAÇÃO] Mensagem: {mensagem}")
    
    return jsonify({
        'mensagem': 'Notificação enviada com sucesso',
        'agentes_notificados': len(agentes),
        'agentes': agentes_nomes
    }), 200


# ===================== ROTAS DE NOTIFICAÇÕES =====================

@app.route('/notificacoes', methods=['GET'])
def get_minhas_notificacoes():
    """Retorna as notificações do usuário logado"""
    auth = request.headers.get('Authorization')
    user_id = None
    if auth:
        parts = auth.split()
        if len(parts) == 2 and parts[0].lower() == 'bearer':
            try:
                payload = jwt.decode(parts[1], SECRET_KEY, algorithms=['HS256'])
                user_id = payload.get('user_id')
            except:
                pass
    
    if not user_id:
        return jsonify({'erro': 'Não autenticado'}), 401
    
    db = get_db()
    cur = db.cursor()
    
    # Buscar notificações do usuário, ordenadas por data (mais recentes primeiro)
    cur.execute('''
        SELECT n.id, n.tipo, n.titulo, n.mensagem, n.missao_id, n.remetente_id, n.lida, n.data_criacao,
               u.display_name as remetente_nome, m.nome as missao_nome
        FROM notificacoes n
        LEFT JOIN users u ON n.remetente_id = u.id
        LEFT JOIN missoes m ON n.missao_id = m.id
        WHERE n.user_id = ?
        ORDER BY n.data_criacao DESC
        LIMIT 50
    ''', (user_id,))
    
    notificacoes = []
    for row in cur.fetchall():
        notif = dict(row)
        # Buscar foto do remetente
        if notif.get('remetente_id'):
            cur2 = db.cursor()
            cur2.execute('SELECT foto FROM users WHERE id = ?', (notif['remetente_id'],))
            foto_row = cur2.fetchone()
            if foto_row and foto_row['foto']:
                notif['remetente_foto'] = base64.b64encode(foto_row['foto']).decode('utf-8')
            else:
                notif['remetente_foto'] = None
        else:
            notif['remetente_foto'] = None
        notificacoes.append(notif)
    
    return jsonify(notificacoes), 200


@app.route('/notificacoes/count', methods=['GET'])
def get_notificacoes_count():
    """Retorna a contagem de notificações não lidas do usuário logado"""
    auth = request.headers.get('Authorization')
    user_id = None
    if auth:
        parts = auth.split()
        if len(parts) == 2 and parts[0].lower() == 'bearer':
            try:
                payload = jwt.decode(parts[1], SECRET_KEY, algorithms=['HS256'])
                user_id = payload.get('user_id')
            except:
                pass
    
    if not user_id:
        return jsonify({'erro': 'Não autenticado'}), 401
    
    db = get_db()
    cur = db.cursor()
    cur.execute('SELECT COUNT(*) as count FROM notificacoes WHERE user_id = ? AND lida = 0', (user_id,))
    row = cur.fetchone()
    
    return jsonify({'count': row['count']}), 200


@app.route('/notificacoes/<int:nid>/lida', methods=['PUT'])
def marcar_notificacao_lida(nid):
    """Marca uma notificação como lida"""
    auth = request.headers.get('Authorization')
    user_id = None
    if auth:
        parts = auth.split()
        if len(parts) == 2 and parts[0].lower() == 'bearer':
            try:
                payload = jwt.decode(parts[1], SECRET_KEY, algorithms=['HS256'])
                user_id = payload.get('user_id')
            except:
                pass
    
    if not user_id:
        return jsonify({'erro': 'Não autenticado'}), 401
    
    db = get_db()
    cur = db.cursor()
    
    # Verificar se a notificação pertence ao usuário
    cur.execute('SELECT * FROM notificacoes WHERE id = ? AND user_id = ?', (nid, user_id))
    if cur.fetchone() is None:
        return jsonify({'erro': 'Notificação não encontrada'}), 404
    
    cur.execute('UPDATE notificacoes SET lida = 1 WHERE id = ?', (nid,))
    db.commit()
    
    return jsonify({'mensagem': 'Notificação marcada como lida'}), 200


@app.route('/notificacoes/lidas', methods=['PUT'])
def marcar_todas_lidas():
    """Marca todas as notificações do usuário como lidas"""
    auth = request.headers.get('Authorization')
    user_id = None
    if auth:
        parts = auth.split()
        if len(parts) == 2 and parts[0].lower() == 'bearer':
            try:
                payload = jwt.decode(parts[1], SECRET_KEY, algorithms=['HS256'])
                user_id = payload.get('user_id')
            except:
                pass
    
    if not user_id:
        return jsonify({'erro': 'Não autenticado'}), 401
    
    db = get_db()
    cur = db.cursor()
    cur.execute('UPDATE notificacoes SET lida = 1 WHERE user_id = ?', (user_id,))
    db.commit()
    
    return jsonify({'mensagem': 'Todas as notificações foram marcadas como lidas'}), 200


@app.route('/notificacoes', methods=['DELETE'])
def limpar_notificacoes():
    """Remove todas as notificações do usuário"""
    auth = request.headers.get('Authorization')
    user_id = None
    if auth:
        parts = auth.split()
        if len(parts) == 2 and parts[0].lower() == 'bearer':
            try:
                payload = jwt.decode(parts[1], SECRET_KEY, algorithms=['HS256'])
                user_id = payload.get('user_id')
            except:
                pass
    
    if not user_id:
        return jsonify({'erro': 'Não autenticado'}), 401
    
    db = get_db()
    cur = db.cursor()
    cur.execute('DELETE FROM notificacoes WHERE user_id = ?', (user_id,))
    db.commit()
    
    return jsonify({'mensagem': 'Todas as notificações foram removidas'}), 200


# ===================== ROTAS DE CRIATURAS (BESTIÁRIO) =====================

@app.route('/criaturas', methods=['GET'])
def list_criaturas():
    """Lista todas as criaturas do bestiário"""
    db = get_db()
    cur = db.cursor()
    cur.execute('''
        SELECT c.*, u.display_name as criador_nome
        FROM criaturas c
        LEFT JOIN users u ON c.criado_por = u.id
        ORDER BY c.nome
    ''')
    rows = cur.fetchall()
    
    result = []
    for row in rows:
        criatura = dict(row)
        if criatura.get('imagem'):
            criatura['imagem'] = base64.b64encode(criatura['imagem']).decode('utf-8')
        else:
            criatura['imagem'] = None
        
        # Buscar elementos da relação N:N
        cur.execute('''
            SELECT e.id, e.elemento as nome, ce.is_principal, e.imagem
            FROM criatura_elementos ce
            JOIN elementos e ON ce.elemento_id = e.id
            WHERE ce.criatura_id = ?
            ORDER BY ce.is_principal DESC, e.elemento
        ''', (criatura['id'],))
        elementos = []
        for elem_row in cur.fetchall():
            elementos.append({
                'id': elem_row['id'],
                'nome': elem_row['nome'],
                'is_principal': bool(elem_row['is_principal']),
                'imagem': base64.b64encode(elem_row['imagem']).decode('utf-8') if elem_row['imagem'] else None
            })
        criatura['elementos'] = elementos
        
        result.append(criatura)
    
    return jsonify(result), 200


@app.route('/criaturas/<int:cid>', methods=['GET'])
def get_criatura(cid):
    """Retorna uma criatura específica"""
    db = get_db()
    cur = db.cursor()
    cur.execute('''
        SELECT c.*, u.display_name as criador_nome
        FROM criaturas c
        LEFT JOIN users u ON c.criado_por = u.id
        WHERE c.id = ?
    ''', (cid,))
    row = cur.fetchone()
    
    if row is None:
        return jsonify({'erro': 'Criatura não encontrada'}), 404
    
    criatura = dict(row)
    if criatura.get('imagem'):
        criatura['imagem'] = base64.b64encode(criatura['imagem']).decode('utf-8')
    else:
        criatura['imagem'] = None
    
    # Buscar elementos da relação N:N
    cur.execute('''
        SELECT e.id, e.elemento as nome, ce.is_principal, e.imagem
        FROM criatura_elementos ce
        JOIN elementos e ON ce.elemento_id = e.id
        WHERE ce.criatura_id = ?
        ORDER BY ce.is_principal DESC, e.elemento
    ''', (cid,))
    elementos = []
    for elem_row in cur.fetchall():
        elementos.append({
            'id': elem_row['id'],
            'nome': elem_row['nome'],
            'is_principal': bool(elem_row['is_principal']),
            'imagem': base64.b64encode(elem_row['imagem']).decode('utf-8') if elem_row['imagem'] else None
        })
    criatura['elementos'] = elementos
    
    return jsonify(criatura), 200


@app.route('/criaturas', methods=['POST'])
def create_criatura():
    """Cria uma nova criatura no bestiário"""
    user = get_auth_user()
    # Somente administradores e líderes podem criar/editar
    allowed = {'administrador', 'lider'}
    cargo_norm = (user.get('cargo', '') if user else '').strip().lower()
    if not user or cargo_norm not in allowed:
        return jsonify({'erro': 'Permissão negada: somente administradores ou líderes podem criar criaturas'}), 403
    
    data = request.get_json() or {}
    
    nome = data.get('nome')
    if not nome:
        return jsonify({'erro': 'Nome é obrigatório'}), 400
    
    imagem_data = None
    if data.get('imagem'):
        try:
            # Remover prefixo data:image se presente
            img_str = data['imagem']
            if ',' in img_str:
                img_str = img_str.split(',')[1]
            imagem_data = base64.b64decode(img_str)
        except Exception as e:
            print(f"Erro ao decodificar imagem: {e}")
            imagem_data = None
    
    db = get_db()
    cur = db.cursor()
    cur.execute('''
        INSERT INTO criaturas(nome, elemento, elementos_adicionais, deslocamento_metros, deslocamento_quadrados, escalada_metros, escalada_quadrados, 
                              voo_metros, voo_quadrados, agi, forca, int, pre, vig, descricao, imagem, criado_por, data_criacao)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ''', (
        nome,
        data.get('elemento', ''),
        data.get('elementos_adicionais', ''),
        data.get('deslocamento_metros', ''),
        data.get('deslocamento_quadrados', ''),
        data.get('escalada_metros', ''),
        data.get('escalada_quadrados', ''),
        data.get('voo_metros', ''),
        data.get('voo_quadrados', ''),
        data.get('agi', 0),
        data.get('forca', 0),
        data.get('int', 0),
        data.get('pre', 0),
        data.get('vig', 0),
        data.get('descricao', ''),
        imagem_data,
        user['id']
    ))
    db.commit()
    
    new_id = cur.lastrowid
    
    # Salvar elementos na tabela de associação N:N
    elem_name_to_id = {"Sangue": 1, "Morte": 2, "Energia": 3, "Conhecimento": 4, "Medo": 5}
    
    # Elemento principal
    elem_principal = data.get('elemento', '')
    if elem_principal and elem_principal in elem_name_to_id:
        try:
            cur.execute('INSERT INTO criatura_elementos(criatura_id, elemento_id, is_principal) VALUES (?, ?, 1)',
                       (new_id, elem_name_to_id[elem_principal]))
        except:
            pass
    
    # Elementos adicionais
    elems_adicionais = data.get('elementos_adicionais', '')
    if elems_adicionais:
        for elem_nome in elems_adicionais.split(','):
            elem_nome = elem_nome.strip()
            if elem_nome and elem_nome in elem_name_to_id:
                try:
                    cur.execute('INSERT INTO criatura_elementos(criatura_id, elemento_id, is_principal) VALUES (?, ?, 0)',
                               (new_id, elem_name_to_id[elem_nome]))
                except:
                    pass
    db.commit()
    
    return jsonify({'id': new_id, 'nome': nome, 'mensagem': 'Criatura criada com sucesso'}), 201


@app.route('/criaturas/<int:cid>', methods=['PUT'])
def update_criatura(cid):
    """Atualiza uma criatura"""
    user = get_auth_user()
    allowed = {'administrador', 'lider'}
    cargo_norm = (user.get('cargo', '') if user else '').strip().lower()
    if not user or cargo_norm not in allowed:
        return jsonify({'erro': 'Permissão negada: somente administradores ou líderes podem editar criaturas'}), 403
    
    db = get_db()
    cur = db.cursor()
    
    cur.execute('SELECT * FROM criaturas WHERE id = ?', (cid,))
    existing = cur.fetchone()
    if existing is None:
        return jsonify({'erro': 'Criatura não encontrada'}), 404
    
    data = request.get_json() or {}
    
    updates = []
    values = []
    
    campos = ['nome', 'elemento', 'elementos_adicionais', 'deslocamento_metros', 'deslocamento_quadrados', 'escalada_metros', 'escalada_quadrados',
              'voo_metros', 'voo_quadrados', 'agi', 'forca', 'int', 'pre', 'vig', 'descricao']
    
    for campo in campos:
        if campo in data:
            updates.append(f'{campo} = ?')
            values.append(data[campo])
    
    if 'imagem' in data:
        updates.append('imagem = ?')
        if data['imagem']:
            try:
                # Remover prefixo data:image se presente
                img_str = data['imagem']
                if ',' in img_str:
                    img_str = img_str.split(',')[1]
                values.append(base64.b64decode(img_str))
            except Exception as e:
                print(f"Erro ao decodificar imagem: {e}")
                values.append(None)
        else:
            values.append(None)
    
    if updates:
        values.append(cid)
        query = f'UPDATE criaturas SET {", ".join(updates)} WHERE id = ?'
        cur.execute(query, values)
    
    # Sincronizar elementos na tabela de associação N:N
    elem_name_to_id = {"Sangue": 1, "Morte": 2, "Energia": 3, "Conhecimento": 4, "Medo": 5}
    
    # Se elemento ou elementos_adicionais foram atualizados, recriar associações
    if 'elemento' in data or 'elementos_adicionais' in data:
        # Remover associações antigas
        cur.execute('DELETE FROM criatura_elementos WHERE criatura_id = ?', (cid,))
        
        # Buscar valores atuais
        cur.execute('SELECT elemento, elementos_adicionais FROM criaturas WHERE id = ?', (cid,))
        row = cur.fetchone()
        elem_principal = data.get('elemento', row['elemento'] if row else '') or ''
        elems_adicionais = data.get('elementos_adicionais', row['elementos_adicionais'] if row else '') or ''
        
        # Adicionar elemento principal
        if elem_principal and elem_principal in elem_name_to_id:
            try:
                cur.execute('INSERT INTO criatura_elementos(criatura_id, elemento_id, is_principal) VALUES (?, ?, 1)',
                           (cid, elem_name_to_id[elem_principal]))
            except:
                pass
        
        # Adicionar elementos adicionais
        if elems_adicionais:
            for elem_nome in elems_adicionais.split(','):
                elem_nome = elem_nome.strip()
                if elem_nome and elem_nome in elem_name_to_id:
                    try:
                        cur.execute('INSERT INTO criatura_elementos(criatura_id, elemento_id, is_principal) VALUES (?, ?, 0)',
                                   (cid, elem_name_to_id[elem_nome]))
                    except:
                        pass
    
    db.commit()
    
    return jsonify({'mensagem': 'Criatura atualizada com sucesso'}), 200


@app.route('/criaturas/<int:cid>', methods=['DELETE'])
def delete_criatura(cid):
    """Deleta uma criatura"""
    user = get_auth_user()
    allowed = {'administrador', 'lider'}
    cargo_norm = (user.get('cargo', '') if user else '').strip().lower()
    if not user or cargo_norm not in allowed:
        return jsonify({'erro': 'Permissão negada: somente administradores ou líderes podem remover criaturas'}), 403
    
    db = get_db()
    cur = db.cursor()
    
    cur.execute('SELECT * FROM criaturas WHERE id = ?', (cid,))
    if cur.fetchone() is None:
        return jsonify({'erro': 'Criatura não encontrada'}), 404
    
    cur.execute('DELETE FROM criaturas WHERE id = ?', (cid,))
    db.commit()
    
    return jsonify({'mensagem': 'Criatura removida com sucesso'}), 200


# ==================== AGENTES (Ficha RPG) ====================

@app.route('/agentes', methods=['GET'])
def get_agentes():
    """Lista todos os agentes (usuários) com dados de ficha RPG, filtro opcional por grupo"""
    db = get_db()
    cur = db.cursor()
    
    grupo = request.args.get('grupo')
    
    if grupo:
        cur.execute('''
             SELECT id, username, display_name, ativo, cargo, grupo, foto,
                 origem, jogador, classe, nex, pe_turno, deslocamento,
                   vida_atual, vida_max, sanidade_atual, sanidade_max,
                   esforco_atual, esforco_max, defesa, bloqueio, esquiva,
                   protecao, resistencias, proficiencias,
                   agi, forca, inteligencia, pre, vig, dt_rituais
            FROM users
            WHERE grupo = ? AND ativo = 1
            ORDER BY display_name
        ''', (grupo,))
    else:
        cur.execute('''
             SELECT id, username, display_name, ativo, cargo, grupo, foto,
                 origem, jogador, classe, nex, pe_turno, deslocamento,
                   vida_atual, vida_max, sanidade_atual, sanidade_max,
                   esforco_atual, esforco_max, defesa, bloqueio, esquiva,
                   protecao, resistencias, proficiencias,
                   agi, forca, inteligencia, pre, vig, dt_rituais
            FROM users
            WHERE ativo = 1
            ORDER BY display_name
        ''')
    
    rows = cur.fetchall()
    agentes = []
    for row in rows:
        agente = {
            'id': row['id'],
            'username': row['username'],
            'display_name': row['display_name'],
            'ativo': row['ativo'],
            'cargo': row['cargo'],
            'grupo': row['grupo'],
            'foto': base64.b64encode(row['foto']).decode('utf-8') if row['foto'] else None,
            'origem': row['origem'],
            'jogador': row['jogador'],
            'classe': row['classe'],
            'nex': row['nex'],
            'pe_turno': row['pe_turno'],
            'deslocamento': row['deslocamento'],
            'vida_atual': row['vida_atual'],
            'vida_max': row['vida_max'],
            'sanidade_atual': row['sanidade_atual'],
            'sanidade_max': row['sanidade_max'],
            'esforco_atual': row['esforco_atual'],
            'esforco_max': row['esforco_max'],
            'defesa': row['defesa'],
            'bloqueio': row['bloqueio'],
            'esquiva': row['esquiva'],
            'protecao': row['protecao'],
            'resistencias': row['resistencias'],
            'proficiencias': row['proficiencias'],
            'agi': row['agi'],
            'forca': row['forca'],
            'inteligencia': row['inteligencia'],
            'pre': row['pre'],
            'vig': row['vig'],
            'dt_rituais': row['dt_rituais']
        }
        agentes.append(agente)
    
    return jsonify(agentes)


@app.route('/agentes/<int:aid>', methods=['GET'])
def get_agente(aid):
    """Retorna dados de um agente específico"""
    db = get_db()
    cur = db.cursor()
    
    cur.execute('''
        SELECT id, username, display_name, ativo, cargo, grupo, foto,
               origem, jogador, classe, nex, pe_turno, deslocamento,
               vida_atual, vida_max, sanidade_atual, sanidade_max,
               esforco_atual, esforco_max, defesa, bloqueio, esquiva,
               protecao, resistencias, proficiencias,
               agi, forca, inteligencia, pre, vig, dt_rituais
        FROM users
        WHERE id = ?
    ''', (aid,))
    
    row = cur.fetchone()
    if not row:
        return jsonify({'erro': 'Agente não encontrado'}), 404
    
    agente = {
        'id': row['id'],
        'username': row['username'],
        'display_name': row['display_name'],
        'ativo': row['ativo'],
        'cargo': row['cargo'],
        'grupo': row['grupo'],
        'foto': base64.b64encode(row['foto']).decode('utf-8') if row['foto'] else None,
        'origem': row['origem'],
        'jogador': row['jogador'],
        'classe': row['classe'],
        'nex': row['nex'],
        'pe_turno': row['pe_turno'],
        'deslocamento': row['deslocamento'],
        'vida_atual': row['vida_atual'],
        'vida_max': row['vida_max'],
        'sanidade_atual': row['sanidade_atual'],
        'sanidade_max': row['sanidade_max'],
        'esforco_atual': row['esforco_atual'],
        'esforco_max': row['esforco_max'],
        'defesa': row['defesa'],
        'bloqueio': row['bloqueio'],
        'esquiva': row['esquiva'],
        'protecao': row['protecao'],
        'resistencias': row['resistencias'],
        'proficiencias': row['proficiencias'],
        'agi': row['agi'],
        'forca': row['forca'],
        'inteligencia': row['inteligencia'],
        'pre': row['pre'],
        'vig': row['vig'],
        'dt_rituais': row['dt_rituais']
    }
    
    return jsonify(agente)


@app.route('/agentes/<int:aid>', methods=['PUT'])
def update_agente(aid):
    """Atualiza dados de ficha RPG de um agente"""
    db = get_db()
    cur = db.cursor()
    
    cur.execute('SELECT * FROM users WHERE id = ?', (aid,))
    if cur.fetchone() is None:
        return jsonify({'erro': 'Agente não encontrado'}), 404
    
    data = request.get_json() or {}
    
    # Lista de campos que podem ser atualizados
    allowed_fields = [
        'origem', 'jogador', 'classe', 'nex', 'pe_turno', 'deslocamento',
        'vida_atual', 'vida_max', 'sanidade_atual', 'sanidade_max',
        'esforco_atual', 'esforco_max', 'defesa', 'bloqueio', 'esquiva',
        'protecao', 'resistencias', 'proficiencias',
        'agi', 'forca', 'inteligencia', 'pre', 'vig', 'dt_rituais', 'grupo'
    ]
    
    updates = []
    values = []
    
    for field in allowed_fields:
        if field in data:
            updates.append(f'{field} = ?')
            values.append(data[field])
    
    # Tratar foto separadamente (base64)
    if 'foto' in data:
        updates.append('foto = ?')
        if data['foto']:
            try:
                values.append(base64.b64decode(data['foto']))
            except:
                values.append(None)
        else:
            values.append(None)
    
    if not updates:
        return jsonify({'erro': 'Nenhum campo para atualizar'}), 400
    
    values.append(aid)
    query = f'UPDATE users SET {", ".join(updates)} WHERE id = ?'
    cur.execute(query, values)
    db.commit()
    
    return jsonify({'mensagem': 'Agente atualizado com sucesso'}), 200


if __name__ == '__main__':
    init_db()
    perimetro = Perimetro(DATABASE)
    perimetro.start()
    # host='0.0.0.0' permite conexões de outros dispositivos na rede (Tailscale)
    # Para uso local apenas, mude para host='127.0.0.1'
    app.run(host='0.0.0.0', port=2025, debug=True)