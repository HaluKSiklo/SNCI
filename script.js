// ================== 安全な初期化 ==================
window.addEventListener("DOMContentLoaded", () => {

    if (typeof Chart === "undefined") {
        console.error("Chart.js が読み込まれていません");
        return;
    }

    const canvas = document.getElementById("snciChart");
    if (!canvas) {
        console.error("canvas #snciChart が見つかりません");
        return;
    }

    const ctx = canvas.getContext("2d");

    // =============== SNCI ==================
    class SNCI {
        constructor(dim = 3) {
            this.dim = dim;
            this.internal = Array.from({ length: dim }, () => Math.random() * 2 - 1);
            this.ruleWeight = Math.random() + 0.5;
            this.forgetRate = Math.random() * 0.03 + 0.01;
        }

        step(stimulus) {
            for (let i = 0; i < this.dim; i++) {
                this.internal[i] +=
                    Math.tanh(this.internal[i] * this.ruleWeight) * 0.1 +
                    stimulus[i] * 0.05 +
                    (Math.random() - 0.5) * 0.1;

                this.internal[i] *= (1 - this.forgetRate);
            }
        }
    }

    class World {
        constructor(dim = 3) {
            this.state = Array.from({ length: dim }, () => Math.random() * 2 - 1);
        }
        observe() {
            return this.state.map(v => v + (Math.random() - 0.5) * 0.2);
        }
    }

    // =============== 初期化 ==================
    const AGENTS = 3;
    const DIM = 3;

    const agents = Array.from({ length: AGENTS }, () => new SNCI(DIM));
    const world = new World(DIM);

    const data = {
        labels: [],
        datasets: []
    };

    agents.forEach((agent, i) => {
        for (let d = 0; d < DIM; d++) {
            data.datasets.push({
                label: `Agent${i} 内部${d}`,
                data: [],
                borderColor: `hsl(${(i * DIM + d) * 50}, 70%, 60%)`,
                borderWidth: 1,
                pointRadius: 0,
                fill: false
            });
        }
    });

    const chart = new Chart(ctx, {
        type: "line",
        data,
        options: {
            animation: false,
            responsive: true,
            scales: {
                x: { display: false },
                y: { min: -5, max: 5 }
            }
        }
    });

    // =============== ループ ==================
    // =============== ループ (改良版) ==================
    let t = 0;
    const MAX_DATA_POINTS = 100; // グラフに表示する最大点数

    function loop() {
        const stim = world.observe();
        agents.forEach(a => a.step(stim));

        data.labels.push(t++);
        
        // 古いデータを削除してパフォーマンスを維持
        if (data.labels.length > MAX_DATA_POINTS) {
            data.labels.shift();
        }

        agents.forEach((a, i) => {
            const dataset = data.datasets[i * DIM + d]; // ※dのループ内
            // 実際の実装ではネストしたループ内で処理
            for (let d = 0; d < DIM; d++) {
                const targetDataset = data.datasets[i * DIM + d];
                targetDataset.data.push(a.internal[d]);
                if (targetDataset.data.length > MAX_DATA_POINTS) {
                    targetDataset.data.shift();
                }
            }
        });

        chart.update('none'); // アニメーションなしで更新すると動作が軽くなります
        requestAnimationFrame(loop);
    }
    
});
