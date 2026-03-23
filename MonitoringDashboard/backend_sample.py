"""
Monitoring Dashboard 백엔드 샘플 API
Flask를 사용하여 REST API 엔드포인트를 제공합니다.
"""

from flask import Flask, jsonify, request
from datetime import datetime, timedelta
import random
import jwt
from functools import wraps

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-change-this'

# CORS 헤더 자동 추가
@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return response

# 옵션 요청 처리
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        return '', 204

# 테스트용 사용자
TEST_USERS = {
    'admin': 'password123',
    'user': 'user123'
}

# JWT 토큰 검증 데코레이터
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': '토큰이 없습니다'}), 401
        
        try:
            token = token.split(' ')[1]
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        except:
            return jsonify({'message': '토큰이 유효하지 않습니다'}), 401
        
        return f(*args, **kwargs)
    
    return decorated


@app.route('/auth/login', methods=['POST'])
def login():
    """로그인 엔드포인트"""
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if username in TEST_USERS and TEST_USERS[username] == password:
        token = jwt.encode({
            'user_id': username,
            'exp': datetime.utcnow() + timedelta(days=30)
        }, app.config['SECRET_KEY'], algorithm='HS256')
        
        return jsonify({
            'token': token,
            'user': {'id': 1, 'username': username}
        }), 200
    
    return jsonify({'message': '사용자명 또는 비밀번호가 올바르지 않습니다'}), 401


@app.route('/auth/logout', methods=['POST'])
@token_required
def logout():
    """로그아웃 엔드포인트"""
    return jsonify({'message': '로그아웃 되었습니다'}), 200


@app.route('/api/status', methods=['GET'])
@token_required
def get_status():
    """
    어플리케이션 상태 데이터
    배열 형식으로 반환
    """
    status_data = [
        {
            'app_id': 1,
            'name': 'CoinTrader',
            'status': random.choice(['healthy', 'active', 'warning']),
            'cpu_usage': round(random.uniform(10, 90), 1),
            'memory_usage': round(random.uniform(20, 80), 1),
            'uptime_seconds': random.randint(3600, 86400),
            'last_update': datetime.now().isoformat(),
            'version': '1.0.0'
        },
        {
            'app_id': 2,
            'name': 'FileTransfer',
            'status': random.choice(['healthy', 'active', 'warning']),
            'cpu_usage': round(random.uniform(5, 50), 1),
            'memory_usage': round(random.uniform(15, 60), 1),
            'uptime_seconds': random.randint(7200, 172800),
            'last_update': datetime.now().isoformat(),
            'version': '2.1.3'
        },
        {
            'app_id': 3,
            'name': 'AutoEconomicBlog',
            'status': random.choice(['healthy', 'active', 'offline']),
            'cpu_usage': round(random.uniform(2, 30), 1),
            'memory_usage': round(random.uniform(10, 40), 1),
            'uptime_seconds': random.randint(10800, 259200),
            'last_update': datetime.now().isoformat(),
            'version': '1.5.2'
        }
    ]
    
    return jsonify(status_data), 200


@app.route('/api/alerts', methods=['GET'])
@token_required
def get_alerts():
    """
    알람/이벤트 데이터
    객체 형식으로 반환
    """
    alerts = {
        'alert-1': {
            'alert_id': 'alert-1',
            'app_name': 'CoinTrader',
            'level': random.choice(['error', 'warning', 'info']),
            'message': 'High CPU usage detected',
            'timestamp': (datetime.now() - timedelta(minutes=5)).isoformat(),
            'acknowledged': random.choice([True, False])
        },
        'alert-2': {
            'alert_id': 'alert-2',
            'app_name': 'FileTransfer',
            'level': random.choice(['error', 'warning', 'info']),
            'message': 'Memory threshold approaching',
            'timestamp': (datetime.now() - timedelta(minutes=15)).isoformat(),
            'acknowledged': random.choice([True, False])
        },
        'alert-3': {
            'alert_id': 'alert-3',
            'app_name': 'AutoEconomicBlog',
            'level': random.choice(['error', 'warning', 'info']),
            'message': 'Connection timeout',
            'timestamp': (datetime.now() - timedelta(minutes=30)).isoformat(),
            'acknowledged': random.choice([True, False])
        }
    }
    
    return jsonify(alerts), 200


@app.route('/api/metrics', methods=['GET'])
@token_required
def get_metrics():
    """
    시스템 메트릭 데이터
    배열 형식으로 반환
    """
    metrics = [
        {
            'metric_id': 'm-1',
            'name': 'API Response Time',
            'unit': 'ms',
            'value': round(random.uniform(50, 500), 1),
            'threshold': 1000,
            'status': 'ok'
        },
        {
            'metric_id': 'm-2',
            'name': 'Database Query Time',
            'unit': 'ms',
            'value': round(random.uniform(10, 200), 1),
            'threshold': 500,
            'status': 'ok'
        },
        {
            'metric_id': 'm-3',
            'name': 'Active Connections',
            'unit': 'count',
            'value': random.randint(10, 100),
            'threshold': 500,
            'status': 'ok'
        },
        {
            'metric_id': 'm-4',
            'name': 'Request Rate',
            'unit': 'req/sec',
            'value': round(random.uniform(100, 500), 1),
            'threshold': 1000,
            'status': 'ok'
        },
        {
            'metric_id': 'm-5',
            'name': 'Error Rate',
            'unit': '%',
            'value': round(random.uniform(0, 5), 2),
            'threshold': 10,
            'status': random.choice(['ok', 'warning'])
        }
    ]
    
    return jsonify(metrics), 200


@app.route('/api/transactions', methods=['GET'])
@token_required
def get_transactions():
    """
    거래 내역 데이터
    복잡한 구조의 배열 형식
    """
    transaction_types = ['buy', 'sell', 'transfer', 'deposit', 'withdraw']
    statuses = ['completed', 'pending', 'failed', 'processing']
    
    transactions = [
        {
            'tx_id': f'tx-{i:04d}',
            'type': random.choice(transaction_types),
            'from_account': f'Account-{random.randint(1000, 9999)}',
            'to_account': f'Account-{random.randint(1000, 9999)}',
            'amount': round(random.uniform(100, 10000), 2),
            'currency': random.choice(['KRW', 'USD', 'EUR', 'BTC']),
            'status': random.choice(statuses),
            'timestamp': (datetime.now() - timedelta(hours=i)).isoformat(),
            'fee': round(random.uniform(0, 100), 2),
            'description': f'Transaction {i}'
        }
        for i in range(20)
    ]
    
    return jsonify(transactions), 200


@app.route('/api/logs', methods=['GET'])
@token_required
def get_logs():
    """
    시스템 로그 데이터
    """
    log_levels = ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL']
    components = ['CoinTrader', 'FileTransfer', 'API', 'Database', 'Cache']
    
    logs = [
        {
            'log_id': f'log-{i:05d}',
            'level': random.choice(log_levels),
            'component': random.choice(components),
            'message': f'Sample log message {i}',
            'timestamp': (datetime.now() - timedelta(minutes=i)).isoformat(),
            'details': f'Additional details for log {i}'
        }
        for i in range(50)
    ]
    
    return jsonify(logs), 200


@app.route('/health', methods=['GET'])
def health_check():
    """헬스 체크 엔드포인트 (인증 불필요)"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat()
    }), 200


if __name__ == '__main__':
    # PyJWT 설치 필요: pip install PyJWT
    # Flask CORS 설치 필요: pip install flask-cors
    app.run(debug=True, port=5000)
