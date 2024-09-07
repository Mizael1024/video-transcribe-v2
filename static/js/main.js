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

    form.addEventListener('submit', (e) => {
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

        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/upload', true);

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const percentComplete = (event.loaded / event.total) * 100;
                progressBar.style.width = percentComplete + '%';
                progressText.textContent = percentComplete.toFixed(2) + '%';
            }
        };

        xhr.onload = function() {
            if (xhr.status === 200) {
                const data = JSON.parse(xhr.responseText);
                transcriptionText.value = data.transcription;
                loading.classList.add('hidden');
                result.classList.remove('hidden');
            } else {
                const errorData = JSON.parse(xhr.responseText);
                throw new Error(errorData.error || 'Erro desconhecido durante o upload');
            }
        };

        xhr.onerror = function() {
            console.error('Erro:', xhr.statusText);
            alert(`Erro durante o upload e transcrição: ${xhr.statusText}`);
        };

        xhr.onloadend = function() {
            loading.classList.add('hidden');
            progressContainer.classList.add('hidden');
        };

        xhr.send(formData);
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
