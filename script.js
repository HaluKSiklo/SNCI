// =============== SNCI Core ===============
class SNCI {
    constructor(dim=3){
        this.dim = dim;
        this.internal = Array.from({length: dim}, ()=>Math.random()*2-1);
        this.ruleWeight = Math.random()*1 + 0.5;
        this.forgetRate = Math.random()*0.03 + 0.01;
    }

    perceive(stimulus, others){
        let combined = stimulus.slice();
        for(let other of others){
            for(let i=0;i<this.dim;i++) combined[i] += other.internal[i];
        }
        for(let i=0;i<this.dim;i++) combined[i] += (Math.random()*0.6-0.3);
        return combined;
    }

    decideAction(perceived){
        return perceived.map(v => Math.tanh(v*this.ruleWeight) + (Math.random()*0.5-0.25));
    }

    updateInternal(perceived){
        for(let i=0;i<this.dim;i++){
            this.internal[i] += Math.tanh(this.internal[i]*this.ruleWeight) + 0.05*Math.random() + perceived[i]*0.1;
        }
    }

    perturbRules(){
        this.ruleWeight += (Math.random()*0.1-0.05);
        this.forgetRate = Math.abs(this.forgetRate + (Math.random()*0.01-0.005));
    }

    forget(){
        for(let i=0;i<this.dim;i++){
            this.internal[i] *= (1-this.forgetRate);
        }
    }

    step(stimulus, others){
        let perceived = this.perceive(stimulus, others);
        let action = this.decideAction(perceived);
        this.updateInternal(perceived);
        this.perturbRules();
        this.forget();
        return action;
    }
}

// =============== World ===============
class World {
    constructor(dim=3){
        this.dim = dim;
        this.state = Array.from({length:dim}, ()=>Math.random()*2-1);
    }

    step(actions, humanInput){
        this.state[0] += humanInput*0.1;
        for(let i=0;i<this.dim;i++){
            this.state[i] += actions.reduce((sum,a)=>sum+a[i],0)*0.01 + (Math.random()*0.2-0.1);
        }
        return this.state;
    }

    observe(){ return this.state.slice(); }
}

// =============== Setup ===============
const numAgents = 3;
const agents = Array.from({length:numAgents}, ()=>new SNCI(3));
const world = new World(3);

const humanInputElem = document.getElementById("humanInput");

// =============== Chart.js Setup ===============
const ctx = document.getElementById('snciChart').getContext('2d');

let chartData = {
    labels: [],
    datasets: []
};

// 各内部状態ごとにデータセット作成
agents.forEach((agent, i)=>{
    for(let d=0; d<agent.dim; d++){
        chartData.datasets.push({
            label: `Agent ${i} - 内部${d+1}`,
            data: [],
            borderColor: `hsl(${(i*agent.dim+d)*60},70%,50%)`,
            fill: false
        });
    }
});

// 世界状態も追加
chartData.datasets.push({
    label: "World 0",
    data: [],
    borderColor: 'black',
    fill: false
});

const chart = new Chart(ctx,{
    type:'line',
    data: chartData,
    options:{
        animation:false,
        responsive:true,
        plugins: { legend: { position: 'bottom' } }
    }
});

// =============== Main Loop ===============
let stepCount = 0;

function stepSNCI(){
    const stim = world.observe();
    const actions = agents.map((agent,i)=>{
        const others = agents.filter((_,j)=>j!==i);
        return agent.step(stim, others);
    });

    const humanInput = parseFloat(humanInputElem.value) || 0;
    const worldState = world.step(actions, humanInput);

    chart.data.labels.push(stepCount);

    // 各エージェント内部状態を追加
    agents.forEach((agent,i)=>{
        for(let d=0; d<agent.dim; d++){
            chart.data.datasets[i*agent.dim + d].data.push(agent.internal[d]);
        }
    });

    // 世界状態
    chart.data.datasets[chart.data.datasets.length-1].data.push(worldState[0]);

    chart.update();
    stepCount++;

    requestAnimationFrame(stepSNCI);
}

stepSNCI();
