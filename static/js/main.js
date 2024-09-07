document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('upload-form');
    const fileInput = document.getElementById('file-input');
    const languageSelect = document.getElementById('language-select');
    const loading = document.getElementById('loading');
    const result = document.getElementById('result');
    const transcriptionText = document.getElementById('transcription-text');
    const downloadBtn = document.getElementById('download-btn');
    const progressContainer = document.getElementById('progress-container');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const file = fileInput.files[0];
        if (!file) {
            alert('Por favor, selecione um arquivo');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('language', languageSelect.value);

        loading.classList.remove('hidden');
        result.classList.add('hidden');
        progressContainer.classList.remove('hidden');
        progressBar.style.width = '0%';
        progressText.textContent = '0%';

        try {
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro desconhecido durante o upload');
            }

            const data = await response.json();
            transcriptionText.value = data.transcription;
            loading.classList.add('hidden');
            result.classList.remove('hidden');
        } catch (error) {
            console.error('Erro:', error);
            alert(`Erro durante o upload e transcrição: ${error.message}`);
        } finally {
            loading.classList.add('hidden');
            progressContainer.classList.add('hidden');
        }
    });

    downloadBtn.addEventListener('click', async () => {
        const transcription = transcriptionText.value;
        if (!transcription) {
            alert('No transcription available');
            return;
        }

        try {
            const response = await fetch('/download', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ transcription })
            });

            if (!response.ok) {
                throw new Error('Download failed');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = 'transcription.txt';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred during download');
        }
    });
});
