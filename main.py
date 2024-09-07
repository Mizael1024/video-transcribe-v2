import os
from flask import Flask, request, jsonify, render_template, send_file
import whisper
import ffmpeg
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = '/tmp'
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max file size

ALLOWED_EXTENSIONS = {'mp4', 'avi', 'mov', 'wmv', 'jpg', 'jpeg', 'png', 'gif'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'Nenhum arquivo enviado'}), 400
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'Nenhum arquivo selecionado'}), 400
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            
            file_extension = filename.rsplit('.', 1)[1].lower()
            
            if file_extension in {'mp4', 'avi', 'mov', 'wmv'}:
                # Extract audio from video
                audio_path = os.path.splitext(filepath)[0] + '.wav'
                stream = ffmpeg.input(filepath)
                stream = ffmpeg.output(stream, audio_path)
                ffmpeg.run(stream)
                
                # Transcribe audio using Whisper
                model = whisper.load_model("base")
                result = model.transcribe(audio_path)
                transcription = result["text"]
                
                # Clean up temporary files
                os.remove(filepath)
                os.remove(audio_path)
            
            elif file_extension in {'jpg', 'jpeg', 'png', 'gif'}:
                # Process image files
                transcription = "Arquivo de imagem carregado com sucesso. A transcrição não está disponível para imagens."
            
            else:
                return jsonify({'error': 'Tipo de arquivo não suportado'}), 400
            
            return jsonify({'transcription': transcription})
        return jsonify({'error': 'Tipo de arquivo não permitido'}), 400
    except Exception as e:
        return jsonify({'error': f'Erro interno do servidor: {str(e)}'}), 500

@app.route('/download', methods=['POST'])
def download_transcription():
    transcription = request.json.get('transcription', '')
    if not transcription:
        return jsonify({'error': 'No transcription provided'}), 400
    
    filename = 'transcription.txt'
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    with open(filepath, 'w') as f:
        f.write(transcription)
    
    return send_file(filepath, as_attachment=True, attachment_filename=filename)

@app.errorhandler(413)
def request_entity_too_large(error):
    return jsonify({'error': 'O arquivo é muito grande. O tamanho máximo permitido é 50MB.'}), 413

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
