import * as googleTTS from 'google-tts-api';
import fs from 'fs';
import axios from 'axios';
import path from 'path';

const outputDir = path.resolve('public', 'audios');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

async function baixarVozes() {
  console.log('🎙️ Gerando 90 arquivos de voz em português...');
  for (let i = 1; i <= 90; i++) {
    const url = googleTTS.getAudioUrl(`Número ${i}`, {
      lang: 'pt-BR',
      slow: false,
      host: 'https://translate.google.com',
    });
    const res = await axios.get(url, { responseType: 'arraybuffer' });
    fs.writeFileSync(path.join(outputDir, `${i}.mp3`), res.data);
    console.log(`✅ Áudio ${i}.mp3 gerado`);
  }
  console.log('🎉 Todos os 90 áudios estão prontos na pasta public/audios!');
}
baixarVozes();