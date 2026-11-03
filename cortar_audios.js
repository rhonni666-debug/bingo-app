import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const inputFile = path.resolve('audio_completo.mp3');
const outputDir = path.resolve('public', 'audios');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function fatiarComAceleracaoProgressiva() {
  console.log('🧹 A limpar ficheiros anteriores...');
  for (let i = 1; i <= 90; i++) {
    const f = path.join(outputDir, `${i}.mp3`);
    if (fs.existsSync(f)) {
      try { fs.unlinkSync(f); } catch (e) {}
    }
  }

  console.log('🎙️ A processar os 90 áudios com redução progressiva de milissegundos...');

  let startPoint = 0.0;
  let intervaloAtual = 0.68; // Distância inicial entre os primeiros números
  const taxaDeAceleracao = 0.0025; // O valor exato em milissegundos que vai encurtando a cada pedra
  const duracaoSeca = 0.42; // Duração muito curta e seca para não vazar a próxima voz

  for (let num = 1; num <= 90; num++) {
    const destino = path.join(outputDir, `${num}.mp3`);

    await new Promise((resolve) => {
      ffmpeg(inputFile)
        .setStartTime(startPoint)
        .setDuration(duracaoSeca)
        .output(destino)
        .on('end', () => {
          console.log(`✅ Áudio ${num}.mp3 fatiado (Início: ${startPoint.toFixed(3)}s | Intervalo aplicado: ${intervaloAtual.toFixed(3)}s)`);
          resolve();
        })
        .on('error', (err) => {
          console.error(`Erro no áudio ${num}:`, err.message);
          resolve();
        })
        .run();
    });

    // Calcula o início da próxima pedra encurtando o tempo progressivamente
    startPoint += intervaloAtual;
    intervaloAtual -= taxaDeAceleracao;
  }

  console.log('🎉 Fatiamento progressivo do 1 ao 90 concluído com sucesso!');
}

fatiarComAceleracaoProgressiva();