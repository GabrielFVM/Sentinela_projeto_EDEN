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
            foto BLOB
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
            FOREIGN KEY (admin_id) REFERENCES users(id)
        )
    ''')
    db.commit()

    # Ensure 'afinidade' column exists for older DBs that may lack it
    cur.execute("PRAGMA table_info(nomeados)")
    existing_cols = [row[1] for row in cur.fetchall()]
    if 'afinidade' not in existing_cols:
        cur.execute("ALTER TABLE nomeados ADD COLUMN afinidade TEXT")
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
    
    # Ensure 'current_jti' column exists in users table for token invalidation
    if 'current_jti' not in user_cols:
        cur.execute("ALTER TABLE users ADD COLUMN current_jti TEXT")
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
    
    # Populate elementos (5 fixed rows)
    cur.execute('SELECT COUNT(1) as cnt FROM elementos')
    if cur.fetchone()[0] == 0:
        elementosDef = [
            (1, "Sangue", None),
            (2, "Morte", None),
            (3, "Energia", None),
            (4, "Conhecimento", None),
            (5, "Medo", None),
        ]
        cur.executemany('INSERT INTO elementos(id, elemento, imagem) VALUES (?,?,?)', elementosDef)
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
            'elemento': r['elemento'],
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
        'elemento': row['elemento'],
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
        SELECT p.id, p.nome, p.cidade, p.class, p.status, p.populacao, p.descricao, p.admin_id, u.display_name as admin_nome
        FROM perimetros p
        LEFT JOIN users u ON p.admin_id = u.id
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
        SELECT p.id, p.nome, p.cidade, p.class, p.status, p.populacao, p.descricao,  p.admin_id, u.display_name as admin_nome
        FROM perimetros p
        LEFT JOIN users u ON p.admin_id = u.id
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
    if not updates:
        return jsonify({'erro': 'Nenhum campo para atualizar'}), 400
    
    values.append(pid)
    query = f'UPDATE perimetros SET {", ".join(updates)} WHERE id = ?'
    cur.execute(query, values)
    db.commit()
    
    cur.execute('SELECT id, nome, cidade, class, status, populacao, descricao, admin_id FROM perimetros WHERE id = ?', (pid,))
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


if __name__ == '__main__':
    init_db()
    perimetro = Perimetro(DATABASE)
    perimetro.start()
    # host='0.0.0.0' permite conexões de outros dispositivos na rede (Tailscale)
    # Para uso local apenas, mude para host='127.0.0.1'
    app.run(host='0.0.0.0', port=2025, debug=True)